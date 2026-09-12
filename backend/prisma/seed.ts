import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const passwordHash = await bcrypt.hash("Password123!", 10);

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const [admin, pm1, pm2, dev1, dev2, dev3, dev4] = await Promise.all([
    prisma.user.create({ data: { name: "Admin User", email: "admin@example.com", passwordHash, role: "ADMIN" } }),
    prisma.user.create({ data: { name: "Ravi PM", email: "pm1@example.com", passwordHash, role: "PROJECT_MANAGER" } }),
    prisma.user.create({ data: { name: "Priya PM", email: "pm2@example.com", passwordHash, role: "PROJECT_MANAGER" } }),
    prisma.user.create({ data: { name: "Arun Developer", email: "dev1@example.com", passwordHash, role: "DEVELOPER" } }),
    prisma.user.create({ data: { name: "Meena Developer", email: "dev2@example.com", passwordHash, role: "DEVELOPER" } }),
    prisma.user.create({ data: { name: "Karthik Developer", email: "dev3@example.com", passwordHash, role: "DEVELOPER" } }),
    prisma.user.create({ data: { name: "Divya Developer", email: "dev4@example.com", passwordHash, role: "DEVELOPER" } })
  ]);

  const [c1, c2, c3] = await Promise.all([
    prisma.client.create({ data: { name: "Acme Corp", email: "contact@acme.test" } }),
    prisma.client.create({ data: { name: "Globex Ltd", email: "contact@globex.test" } }),
    prisma.client.create({ data: { name: "Initech", email: "contact@initech.test" } })
  ]);

  const p1 = await prisma.project.create({ data: { name: "Acme Mobile App", description: "Customer mobile application", clientId: c1.id, createdById: pm1.id } });
  const p2 = await prisma.project.create({ data: { name: "Globex Portal", description: "Client portal", clientId: c2.id, createdById: pm1.id } });
  const p3 = await prisma.project.create({ data: { name: "Initech API", description: "API modernization", clientId: c3.id, createdById: pm2.id } });

  const projects = [p1, p2, p3];
  const devs = [dev1, dev2, dev3, dev4];
  const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

  for (let i = 0; i < projects.length; i++) {
    for (let j = 0; j < 5; j++) {
      const due = new Date(Date.now() + (j === 0 ? -3 : j + 2) * 86400000);
      const task = await prisma.task.create({
        data: {
          title: `${projects[i].name} Task ${j + 1}`,
          description: "Seeded assessment task",
          projectId: projects[i].id,
          assignedDeveloperId: devs[(i + j) % devs.length].id,
          status: statuses[(i + j) % statuses.length],
          priority: priorities[(j + i) % priorities.length],
          dueDate: due,
          isOverdue: j === 0
        }
      });

      await prisma.activityLog.create({
        data: {
          projectId: task.projectId,
          taskId: task.id,
          userId: j % 2 === 0 ? pm1.id : devs[(i + j) % devs.length].id,
          action: "STATUS_CHANGED",
          oldValue: "TODO",
          newValue: task.status
        }
      });
    }
  }

  console.log("Seed complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
