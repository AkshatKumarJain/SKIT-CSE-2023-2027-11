import mongoose from "mongoose"
import { INotification, NotificationEntityType, NotificationType} from "./notification.type"

const notificationSchema = new mongoose.Schema<INotification> (
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true
        },
        title: {
            type: String,
        },
        message: {
            type: String,
            required: true
        },
        entityType: {
            type: String,
            enum: Object.values(NotificationEntityType),
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }, 
    {timestamps: true}
)

notificationSchema.index({
  recipientId: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipientId: 1,
  isRead: 1,
});

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);