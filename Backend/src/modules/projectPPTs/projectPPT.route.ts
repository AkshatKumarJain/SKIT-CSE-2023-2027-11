import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import projectPPTController from "./projectPPT.controller";
import { uploadPPTFile } from "./projectPPT.upload";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.post("/submit", requireAuth, uploadPPTFile, projectPPTController.submitOrRevise);
router.get("/my", requireAuth, projectPPTController.myPPTs);

router.get("/mentor", requireAuth, projectPPTController.mentorQueue);
router.patch("/:pptId/mentor-review", requireAuth, projectPPTController.mentorReview);

router.get("/coordinator", requireAuth, projectPPTController.coordinatorQueue);
router.patch("/:pptId/coordinator-review", requireAuth, projectPPTController.coordinatorReview);

// Admin is intentionally restricted to final approved submissions only.
router.get("/admin/approved", requireAuth, projectPPTController.adminApproved);

router.get("/:pptId", requireAuth, projectPPTController.byId);

export default router;
