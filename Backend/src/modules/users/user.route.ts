import express from "express";
import userController from "./user.controller";
import { authMiddleware } from "redis-jwt-auth";
import type { RequestHandler } from "express";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;

const router = express.Router();

router.post("/login", userController.login);
router.post("/logout", requireAuth, userController.logout);
router.post("/refresh", requireAuth, userController.refresh);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

export default router;