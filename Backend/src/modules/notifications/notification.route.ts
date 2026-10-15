import express from "express";
import notificationController from "./notification.controller";
import { authMiddleware } from "redis-jwt-auth";
import { RequestHandler } from "express";

const router = express.Router();
const requireAuth = authMiddleware({ required: true }) as RequestHandler;

router.post("/", requireAuth, notificationController.createNotification);
router.get("/", requireAuth, notificationController.getNotifications);
router.get("/unread", requireAuth, notificationController.getUnreadCount);
router.post("/markRead", requireAuth, notificationController.markNotificationAsRead);

export default router;