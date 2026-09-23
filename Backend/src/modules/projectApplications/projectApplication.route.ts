import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import projectApplicationController from "./projectApplication.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.post("/own-idea", requireAuth, projectApplicationController.createOwnIdea);
router.post("/faculty-project", requireAuth, projectApplicationController.applyForFacultyProject);
router.post("/project-bank", requireAuth, projectApplicationController.applyForProjectBank);
router.get("/my", requireAuth, projectApplicationController.getMyApplications);
router.get("/available-mentors", requireAuth, projectApplicationController.getAvailableMentors);

router.get("/admin", requireAuth, projectApplicationController.getAdminApplications);
router.patch("/:applicationId/admin-approval", requireAuth, projectApplicationController.adminApproval);
router.patch("/:applicationId/final-admin-approval", requireAuth, projectApplicationController.finalAdminApproval);

router.get("/mentor", requireAuth, projectApplicationController.mentorApplications);
router.patch("/:applicationId/mentor-approval", requireAuth, projectApplicationController.mentorApproval);

router.get("/faculty", requireAuth, projectApplicationController.facultyApplications);
router.patch("/:applicationId/faculty-approval", requireAuth, projectApplicationController.facultyApproval);

router.get("/:applicationId", requireAuth, projectApplicationController.getApplicationById);

export default router;
