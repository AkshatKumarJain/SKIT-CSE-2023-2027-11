import mongoose, { HydratedDocument } from "mongoose";

export const PROJECT_PPT_STATUSES = [
    "PENDING_MENTOR_REVIEW",
    "REVISION_REQUIRED",
    "PENDING_COORDINATOR_REVIEW",
    "REJECTED_BY_COORDINATOR",
    "APPROVED",
] as const;
export type ProjectPPTStatus = (typeof PROJECT_PPT_STATUSES)[number];

export const PPT_REVIEW_DECISIONS = ["PENDING", "APPROVED", "REJECTED"] as const;
export type PPTReviewDecision = (typeof PPT_REVIEW_DECISIONS)[number];

export interface IPPTReview {
    decision: PPTReviewDecision;
    reviewerId?: mongoose.Types.ObjectId | null;
    comment?: string;
    reviewedAt?: Date | null;
}

export interface IProjectPPTVersion {
    versionNumber: number;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
    mentorReview: IPPTReview;
    coordinatorReview: IPPTReview;
}

export interface IProjectPPT {
    _id: mongoose.Types.ObjectId;
    applicationId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    mentorId: mongoose.Types.ObjectId;
    status: ProjectPPTStatus;
    latestVersionNumber: number;
    versions: IProjectPPTVersion[];
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectPPTDocument = HydratedDocument<IProjectPPT>;
