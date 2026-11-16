import { title } from "node:process";
import notificationService from "./notification.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import express from "express";
import { Request, Response } from "express";

// recipientId: mongoose.Types.ObjectId;
//   type: NotificationType;
//   title: string;
//   message: string;
//   entityType?: NotificationEntityType;
//   entityId?: mongoose.Types.ObjectId;

class NotificationController {
    async createNotification(req: Request, res: Response): Promise<Response> {
        const {recipientId, type, title, message, entityType, entityId} = req.body;
        if(!recipientId || !type || !message)
        {
            throw new AppError("All fields are required", 403, ERROR_CODES.INVALID_CREDENTIALS);
        }
        const createdNotification = await notificationService.createNotification({recipientId, type, title, message, entityType, entityId});
        return res.status(201).json({
            message: "Notification created successfully",
            data: createdNotification
        })
    }

    async getNotifications(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.userId;
        if(!userId)
        {
            throw new AppError("userId is required", 403, ERROR_CODES.INVALID_CREDENTIALS);
        }
        const getNotify = await notificationService.getNotifications(userId);
        return res.status(200).json({
            message: "Notifications fetched successfully",
            data: getNotify
        })
    }

    async getUnreadCount(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.userId;
        if(!userId)
        {
            throw new AppError("userId is required", 403, ERROR_CODES.INVALID_CREDENTIALS);
        }
        const getUnreadNotify = await notificationService.getUnreadCount(userId);
        return res.status(200).json({
            message: "Unread Notifications fetched successfully",
            data: getUnreadNotify
        })
    }

    async markNotificationAsRead(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.userId;
        const notificationId = req.body;
        if(!userId)
        {
            throw new AppError("userId is required", 403, ERROR_CODES.INVALID_CREDENTIALS);
        }
        if(!notificationId)
        {
            throw new AppError("notification is required", 403, ERROR_CODES.INVALID_CREDENTIALS);
        }
        const markNotificationRead = await notificationService.markNotificationAsRead(userId, notificationId);
        return res.status(201).json({
            message: "Marked Unread Notification read successfully",
            data: markNotificationRead
        })
    }
}

export = new NotificationController();