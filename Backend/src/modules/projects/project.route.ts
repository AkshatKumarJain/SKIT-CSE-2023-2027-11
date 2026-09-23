import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import projectController from "./project.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.post("/", requireAuth, projectController.create);
router.get("/faculty", requireAuth, projectController.faculty);
router.get("/bank", requireAuth, projectController.bank);
router.get("/", requireAuth, projectController.list);
router.get("/:projectId", requireAuth, projectController.byId);
router.patch("/:projectId/hide", requireAuth, projectController.hide);
router.patch("/:projectId", requireAuth, projectController.update);

export default router;
