import { prisma } from "../config/prisma.js";

export async function createActivity(input: {
  projectId: number;
  taskId: number;
  userId: number;
  action: string;
  oldValue?: string;
  newValue?: string;
}) {
  return prisma.activityLog.create({
    data: input,
    include: {
      user: { select: { id: true, name: true, role: true } },
      task: { select: { id: true, title: true } }
    }
  });
}
