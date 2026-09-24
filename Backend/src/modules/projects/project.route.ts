import express from "express";
import projectController from "./project.controller";
import { authMiddleware } from "redis-jwt-auth";
import type { RequestHandler } from "express";

const router = express.Router();

const requireAuth =
    authMiddleware({ required: true }) as RequestHandler;


// Create project
router.post(
    "/",
    requireAuth,
    projectController.createProject
);


// Get all available projects
router.get(
    "/",
    requireAuth,
    projectController.getProjects
);


// Faculty projects
router.get(
    "/faculty",
    requireAuth,
    projectController.getFacultyProjects
);


// Project bank
router.get(
    "/bank",
    requireAuth,
    projectController.getProjectBank
);


// Get project by ID
router.get(
    "/:projectId",
    requireAuth,
    projectController.getProjectById
);


// Update project
router.patch(
    "/:projectId",
    requireAuth,
    projectController.updateProject
);


// Hide project
router.patch(
    "/:projectId/hide",
    requireAuth,
    projectController.hideProject
);

export default router;