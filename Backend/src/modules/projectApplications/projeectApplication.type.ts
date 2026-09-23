import mongoose, { HydratedDocument } from "mongoose";

export const APPLICATION_SOURCES = ["OWN_IDEA", "FACULTY_PROJECT", "PROJECT_BANK"] as const;
export type ApplicationSource = typeof APPLICATION_SOURCES[number];

export const APPLICATION_STATUSES = [
    "ADMIN_REVIEW",
    "ADMIN_APPROVED",
    "MENTOR_REVIEW",
    "MENTOR_APPROVED",
    "FACULTY_REVIEW",
    "FACULTY_APPROVED",
    "ADMIN_FINAL_REVIEW",
    "APPROVED",
    "REJECTED"
] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
    "ADMIN_REVIEW",
    "ADMIN_APPROVED",
    "MENTOR_REVIEW",
    "MENTOR_APPROVED",
    "FACULTY_REVIEW",
    "FACULTY_APPROVED",
    "ADMIN_FINAL_REVIEW",
    "APPROVED"
];

export type ProjectDetails = {
    title: string;
    domain: string;
    problemStatement: string;
    description: string;
    expectedOutcome?: string;
    sdgGoals: string[];
    technologyStack: string[];
};

export interface IApprovalHistoryEntry {
    stage: ApplicationStatus;
    action: "APPROVED" | "REJECTED";
    approvedBy: mongoose.Types.ObjectId;
    comment?: string;
    actedAt: Date;
}

export interface IProjectApplication {
    _id: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId | null;
    source: ApplicationSource;
    mobileNumber?: string;
    projectDetails?: ProjectDetails;
    mentorId?: mongoose.Types.ObjectId | null;
    facultyId?: mongoose.Types.ObjectId | null;
    status: ApplicationStatus;
    rejectionReason?: string | null;
    approvalHistory: IApprovalHistoryEntry[];
    submittedAt: Date;
    approvedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectApplicationDocument = HydratedDocument<IProjectApplication>;
