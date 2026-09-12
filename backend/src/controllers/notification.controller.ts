import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/http.js";

export async function listNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const unread = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
  return ok(res, { notifications, unread });
}

export async function markRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { id: Number(req.params.id), userId: req.user!.id },
    data: { isRead: true }
  });
  return ok(res, { message: "Notification marked as read." });
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true }
  });
  return ok(res, { message: "All notifications marked as read." });
}
