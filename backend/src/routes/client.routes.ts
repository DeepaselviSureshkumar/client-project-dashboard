import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { createClient, listClients } from "../controllers/client.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listClients);
router.post("/", allowRoles("ADMIN"), createClient);
export default router;
