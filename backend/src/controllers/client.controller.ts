import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/http.js";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional()
});

export async function listClients(_req: Request, res: Response) {
  return ok(res, await prisma.client.findMany({ orderBy: { name: "asc" } }));
}

export async function createClient(req: Request, res: Response) {
  return ok(res, await prisma.client.create({ data: schema.parse(req.body) }), 201);
}
