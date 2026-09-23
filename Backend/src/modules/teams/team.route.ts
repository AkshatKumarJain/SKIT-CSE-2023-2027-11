import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import teamController from "./team.controller";
import teamRequestController from "../teamRequests/teamRequest.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.post("/", requireAuth, teamController.create);
router.get("/my", requireAuth, teamController.myTeam);
router.get("/available-members", requireAuth, teamController.availableMembers);
router.get("/:teamId/requests", requireAuth, teamRequestController.listForTeam);
router.post("/:teamId/requests", requireAuth, teamRequestController.create);
router.patch("/:teamId/complete", requireAuth, teamController.complete);
router.get("/:teamId", requireAuth, teamController.getById);

export default router;
