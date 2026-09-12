import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setupSocket } from "./sockets/socket.js";
import { startOverdueJob } from "./jobs/overdue.job.js";
import cookieParser from "cookie-parser";

const server = createServer(app);
const io = setupSocket(server);
app.set("io", io);
startOverdueJob();

server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${env.PORT}`);
});