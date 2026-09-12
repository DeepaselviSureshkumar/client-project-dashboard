import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/http.js";

export async function dashboard(req: Request, res: Response) {
  const user = req.user!;
  const projectWhere: any = user.role === "ADMIN" ? {} : { createdById: user.id };
  const taskWhere: any =
    user.role === "ADMIN" ? {} :
    user.role === "PROJECT_MANAGER" ? { project: { createdById: user.id } } :
    { assignedDeveloperId: user.id };

  const [projects, tasks, overdue, online] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.task.groupBy({ by: ["status"], where: taskWhere, _count: true }),
    prisma.task.count({ where: { ...taskWhere, isOverdue: true } }),
    prisma.user.count({ where: { isOnline: true } })
  ]);

  return ok(res, { projects, tasksByStatus: tasks, overdue, online });
}
