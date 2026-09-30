import mongoose from "mongoose";
import express, { type RequestHandler } from "express";
import { authMiddleware, authorizeRole } from "redis-jwt-auth";
import studentController from "./student.controller";

const requireAuth = authMiddleware({ required: true }) as RequestHandler;

const router = express.Router();

router.get("/me", requireAuth, authorizeRole("student"), studentController.getStudentProfile);

export default router;