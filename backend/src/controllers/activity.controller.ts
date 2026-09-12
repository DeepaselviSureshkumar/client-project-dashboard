import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/http.js";

export async function listActivity(req: Request, res: Response) {
  const where: any =
    req.user!.role === "ADMIN"
      ? {}
      : req.user!.role === "PROJECT_MANAGER"
        ? { project: { createdById: req.user!.id } }
        : { task: { assignedDeveloperId: req.user!.id } };

  const events = await prisma.activityLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return ok(res, events);
}
