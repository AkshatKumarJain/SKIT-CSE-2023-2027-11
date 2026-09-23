import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import teamRequestController from "./teamRequest.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.get("/my", requireAuth, teamRequestController.myRequests);
router.patch("/:requestId/accept", requireAuth, teamRequestController.accept);
router.patch("/:requestId/reject", requireAuth, teamRequestController.reject);
router.patch("/:requestId/cancel", requireAuth, teamRequestController.cancel);

export default router;
