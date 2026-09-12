import { prisma } from "../config/prisma.js";
import type { NotificationType } from "../generated/prisma/enums.js";

export async function createNotification(input: {
  userId: number;
  taskId?: number;
  type: NotificationType;
  message: string;
}) {
  return prisma.notification.create({ data: input });
}
