import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(token: string) {
  socket?.disconnect();
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
    auth: { token },
    withCredentials: true
  });
  return socket;
}

export function getSocket() {
  return socket;
}
