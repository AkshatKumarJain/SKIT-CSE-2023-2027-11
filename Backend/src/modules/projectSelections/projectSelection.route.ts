import express from "express";

import projectSelectionController
    from "./projectSelection.controller";

import {
    authMiddleware
} from "redis-jwt-auth";

import type {
    RequestHandler
} from "express";


const router = express.Router();


const requireAuth =
    authMiddleware({
        required: true
    }) as RequestHandler;


// Current phase
router.get(
    "/current",
    requireAuth,
    projectSelectionController.getCurrentPhase
);


// All phases
router.get(
    "/",
    requireAuth,
    projectSelectionController.getAllPhases
);


// Create phase
router.post(
    "/",
    requireAuth,
    projectSelectionController.createPhase
);


// Update phase
router.patch(
    "/:phaseId",
    requireAuth,
    projectSelectionController.updatePhase
);


export default router;