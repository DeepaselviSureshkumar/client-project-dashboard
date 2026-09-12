import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { projectSchema } from "../validators/project.js";
import { fail, ok } from "../utils/http.js";

function scope(req: Request) {
  if (req.user?.role === "ADMIN") return {};
  return { createdById: req.user!.id };
}

export async function listProjects(req: Request, res: Response) {
  const projects = await prisma.project.findMany({
    where: scope(req),
    include: {
      client: true,
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return ok(res, projects);
}

export async function getProject(req: Request, res: Response) {
  const id = Number(req.params.id);
  const project = await prisma.project.findFirst({
    where: { id, ...scope(req) },
    include: { client: true, createdBy: { select: { id: true, name: true } } }
  });
  if (!project) return fail(res, 404, "NOT_FOUND", "Project not found.");
  return ok(res, project);
}

export async function createProject(req: Request, res: Response) {
  const body = projectSchema.parse(req.body);
  const project = await prisma.project.create({
    data: { ...body, createdById: req.user!.id }
  });
  return ok(res, project, 201);
}

export async function updateProject(req: Request, res: Response) {
  const id = Number(req.params.id);
  const body = projectSchema.partial().parse(req.body);
  const existing = await prisma.project.findFirst({ where: { id, ...scope(req) } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Project not found.");

  const project = await prisma.project.update({ where: { id }, data: body });
  return ok(res, project);
}
