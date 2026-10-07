import mongoose from "mongoose";
import express, { type RequestHandler } from "express";
import { authMiddleware, authorizeRole } from "redis-jwt-auth";
import teacherController from "./teacher.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;

const router = express.Router();

router.get("/me", requireAuth, authorizeRole('teacher'), teacherController.getTeacherProfile);

export default router;