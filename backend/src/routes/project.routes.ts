import { Router } from "express";
import { allowRoles } from "../middleware/roles.js";
import { requireAuth } from "../middleware/auth.js";
import { createProject, getProject, listProjects, updateProject } from "../controllers/project.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", allowRoles("ADMIN", "PROJECT_MANAGER"), createProject);
router.patch("/:id", allowRoles("ADMIN", "PROJECT_MANAGER"), updateProject);

export default router;
