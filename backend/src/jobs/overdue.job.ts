import cron from "node-cron";
import { prisma } from "../config/prisma.js";

export function startOverdueJob() {
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    await prisma.task.updateMany({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
        isOverdue: false
      },
      data: { isOverdue: true }
    });
  });
}
