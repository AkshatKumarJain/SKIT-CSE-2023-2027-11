import mongoose from "mongoose";
import { Notification } from "./notification.model";
import { ICreateNotification, INotification } from "./notification.type";
import { AppError } from "../../errors/AppError";

class NotificationService {
    async createNotification(data: ICreateNotification)
    {
        const createNotification = await Notification.create({
            recipientId: data.recipientId,
            type: data.type,
            title: data.title,
            message: data.message,
            ...(data.entityType && {
                entityType: data.entityType,
            }),
            ...(data.entityId && {
                entityId: new mongoose.Types.ObjectId(data.entityId),
            }),
        });

        if(!createNotification)
        {
            return false;
        }
        return createNotification._id;
    }

    async getNotifications(userId: string, page=1, limit=20) 
    {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(50, Math.max(1, limit));

        const filter = {
            recipientId: new mongoose.Types.ObjectId(userId),
        };

        const [notifications, total] = await Promise.all([
            Notification
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),

            Notification.countDocuments(filter),
        ]);

        return {
        notifications,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
            },
        };
    }

    async getUnreadCount(userId: string) {
        return Notification.countDocuments({
            recipientId: new mongoose.Types.ObjectId(userId),
            isRead: false,
        });
    }

    async markNotificationAsRead(userId: string, notificationId: string) {
        return Notification.findOneAndUpdate({
            _id: notificationId,
            recipientId: new mongoose.Types.ObjectId(userId),
        },
        {
            $set: { 
                isRead: true 
            },
        },
        {
            new: true,
        }
    );
    }
    }

export = new NotificationService();