import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: env.CLIENT_URL, credentials: true }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
      if (!user) return next(new Error("User not found"));
      socket.data.user = { id: user.id, role: user.role, name: user.name };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async socket => {
    const user = socket.data.user as { id: number; role: string; name: string };
    socket.join(`user:${user.id}`);
    socket.join("presence");

    await prisma.user.update({ where: { id: user.id }, data: { isOnline: true } });
    io.emit("presence:count", await prisma.user.count({ where: { isOnline: true } }));

    socket.on("project:join", async (projectId: number) => {
      const project = await prisma.project.findUnique({ where: { id: Number(projectId) } });
      if (!project) return;

      const allowed =
        user.role === "ADMIN" ||
        (user.role === "PROJECT_MANAGER" && project.createdById === user.id) ||
        (user.role === "DEVELOPER" &&
          (await prisma.task.count({ where: { projectId: project.id, assignedDeveloperId: user.id } })) > 0);

      if (allowed) socket.join(`project:${project.id}`);
    });

    socket.on("disconnect", async () => {
      await prisma.user.update({ where: { id: user.id }, data: { isOnline: false } });
      io.emit("presence:count", await prisma.user.count({ where: { isOnline: true } }));
    });
  });

  return io;
}
