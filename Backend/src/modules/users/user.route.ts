import express from "express";
import userController from "./user.controller";
import { authMiddleware } from "redis-jwt-auth";
import type { RequestHandler } from "express";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;

const router = express.Router();

router.post("/create", userController.create)
router.post("/login", userController.login);
router.get("/logout", requireAuth, userController.logout);
router.post("/refresh", requireAuth, userController.refresh);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.get("/sayHello", userController.sayHello);

export default router;