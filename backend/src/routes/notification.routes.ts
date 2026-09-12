import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listNotifications, markAllRead, markRead } from "../controllers/notification.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listNotifications);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);
export default router;
