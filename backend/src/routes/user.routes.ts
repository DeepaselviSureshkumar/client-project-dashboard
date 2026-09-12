import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { listDevelopers, listUsers } from "../controllers/user.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/developers", listDevelopers);
router.get("/", allowRoles("ADMIN"), listUsers);
export default router;
