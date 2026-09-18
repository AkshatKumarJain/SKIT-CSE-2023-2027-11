import express from "express";
import { authMiddleware } from "redis-jwt-auth";
import type { RequestHandler } from "express";
import projectController from "./project.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.post("/", requireAuth, projectController.createProject);
router.get("/", requireAuth, projectController.getAllProjects);
router.get("/faculty", requireAuth, projectController.getFacultyProjects);
router.get("/bank", requireAuth, projectController.getBankProjects);
router.get("/:projectId", requireAuth, projectController.getProjectById);
router.patch("/:projectId/hide", requireAuth, projectController.hideProject);
router.patch("/:projectId", requireAuth, projectController.updateProject);

export default router;
