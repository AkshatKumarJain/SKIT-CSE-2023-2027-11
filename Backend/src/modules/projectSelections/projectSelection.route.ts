import express from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "redis-jwt-auth";
import projectSelectionController from "./projectSelection.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;
const router = express.Router();

router.get("/current", requireAuth, projectSelectionController.getCurrentPhase);
router.get("/", requireAuth, projectSelectionController.getAllPhases);
router.post("/", requireAuth, projectSelectionController.createPhase);
router.patch("/:phaseId", requireAuth, projectSelectionController.updatePhase);

export default router;
