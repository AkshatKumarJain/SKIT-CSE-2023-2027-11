import express from "express";
import userController from "./user.controller";
import { authMiddleware } from "redis-jwt-auth";
import type { RequestHandler } from "express";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;

const router = express.Router();

router.get("/login", userController.login);
router.post("/logout", requireAuth, userController.logout);
router.post("/refresh", requireAuth, userController.refresh);

export default router;