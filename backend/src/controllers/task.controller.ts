import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { createTaskSchema, statusSchema } from "../validators/task.js";
import { createActivity } from "../services/activity.service.js";
import { createNotification } from "../services/notification.service.js";
import { fail, ok } from "../utils/http.js";

async function canManageProject(userId: number, role: string, projectId: number) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  return role === "ADMIN" || (role === "PROJECT_MANAGER" && project.createdById === userId);
}

async function visibleTaskWhere(req: Request) {
  if (req.user!.role === "DEVELOPER") {
    return { assignedDeveloperId: req.user!.id };
  }
  if (req.user!.role === "ADMIN") return {};
  return { project: { createdById: req.user!.id } };
}

export async function listTasks(req: Request, res: Response) {
  const where: any = await visibleTaskWhere(req);
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.priority) where.priority = String(req.query.priority);
  if (req.query.from || req.query.to) {
    where.dueDate = {};
    if (req.query.from) where.dueDate.gte = new Date(String(req.query.from));
    if (req.query.to) where.dueDate.lte = new Date(String(req.query.to));
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, createdById: true } },
      assignedDeveloper: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }]
  });

  return ok(res, tasks);
}

export async function createTask(req: Request, res: Response) {
  const body = createTaskSchema.parse(req.body);
  if (!(await canManageProject(req.user!.id, req.user!.role, body.projectId))) {
    return fail(res, 403, "FORBIDDEN", "You cannot manage this project.");
  }

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      assignedDeveloperId: body.assignedDeveloperId,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : null
    },
    include: { project: true }
  });

  if (task.assignedDeveloperId) {
    await createNotification({
      userId: task.assignedDeveloperId,
      taskId: task.id,
      type: "TASK_ASSIGNED",
      message: `You were assigned task #${task.id}: ${task.title}`
    });
  }

  return ok(res, task, 201);
}

export async function updateStatus(req: Request, res: Response) {
  const taskId = Number(req.params.id);
  const { status } = statusSchema.parse(req.body);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true, assignedDeveloper: true }
  });

  if (!task) return fail(res, 404, "NOT_FOUND", "Task not found.");

  const allowed =
    req.user!.role === "ADMIN" ||
    (req.user!.role === "PROJECT_MANAGER" && task.project.createdById === req.user!.id) ||
    (req.user!.role === "DEVELOPER" && task.assignedDeveloperId === req.user!.id);

  if (!allowed) return fail(res, 403, "FORBIDDEN", "You cannot update this task.");

  const oldStatus = task.status;
  if (oldStatus === status) return ok(res, task);

  const updated = await prisma.$transaction(async tx => {
    const next = await tx.task.update({
      where: { id: taskId },
      data: { status, isOverdue: status === "DONE" ? false : task.isOverdue }
    });

    const activity = await tx.activityLog.create({
      data: {
        projectId: task.projectId,
        taskId: task.id,
        userId: req.user!.id,
        action: "STATUS_CHANGED",
        oldValue: oldStatus,
        newValue: status
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, title: true } }
      }
    });

    return { next, activity };
  });

  if (status === "IN_REVIEW" && task.project.createdById !== req.user!.id) {
    await createNotification({
      userId: task.project.createdById,
      taskId: task.id,
      type: "TASK_IN_REVIEW",
      message: `${req.user!.name} moved task #${task.id} to In Review`
    });
  }

  const io = req.app.get("io");
  io?.to(`project:${task.projectId}`).emit("activity:new", updated.activity);

  return ok(res, updated.next);
}

export async function getTask(req: Request, res: Response) {
  const id = Number(req.params.id);
  const where: any = { id, ...(await visibleTaskWhere(req)) };
  const task = await prisma.task.findFirst({
    where,
    include: { project: true, assignedDeveloper: { select: { id: true, name: true } } }
  });
  if (!task) return fail(res, 404, "NOT_FOUND", "Task not found.");
  return ok(res, task);
}
