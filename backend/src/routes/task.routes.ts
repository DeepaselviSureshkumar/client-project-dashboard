import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { createTask, getTask, listTasks, updateStatus } from "../controllers/task.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listTasks);
router.get("/:id", getTask);
router.post("/", allowRoles("ADMIN", "PROJECT_MANAGER"), createTask);
router.patch("/:id/status", updateStatus);
export default router;
