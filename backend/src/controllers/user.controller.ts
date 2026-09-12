import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/http.js";

export async function listDevelopers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { role: "DEVELOPER" },
    select: { id: true, name: true, email: true, isOnline: true },
    orderBy: { name: "asc" }
  });
  return ok(res, users);
}

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isOnline: true },
    orderBy: { name: "asc" }
  });
  return ok(res, users);
}
