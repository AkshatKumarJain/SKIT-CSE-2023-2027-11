import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import facultyProjectsController from "./facultyProject.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

// Projects uploaded by the authenticated faculty member
router.get("/uploaded-projects", requireAuth, facultyProjectsController.uploadedProjects);

// Projects/applications mentored by the authenticated faculty member
router.get("/mentored-projects", requireAuth, facultyProjectsController.mentoredProjects);

export default router;
