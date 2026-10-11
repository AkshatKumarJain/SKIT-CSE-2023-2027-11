import mongoose from "mongoose";

export enum NotificationType {
  APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED",
  APPLICATION_ACCEPTED = "APPLICATION_ACCEPTED",
  APPLICATION_REJECTED = "APPLICATION_REJECTED",
  APPLICATION_CHANGES_REQUESTED = "APPLICATION_CHANGES_REQUESTED",
  PROJECT_ALLOCATED = "PROJECT_ALLOCATED",
  PROJECT_UPDATED = "PROJECT_UPDATED",
  DEADLINE_REMINDER = "DEADLINE_REMINDER",
}

export enum NotificationEntityType {
  PROJECT_APPLICATION = "PROJECT_APPLICATION",
  PROJECT = "PROJECT",
}

export interface INotification {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType;
  entityId?: mongoose.Types.ObjectId;
  isRead: boolean;
}

export interface ICreateNotification {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType;
  entityId?: mongoose.Types.ObjectId;
}