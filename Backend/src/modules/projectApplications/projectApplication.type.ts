import mongoose, { HydratedDocument } from "mongoose";

export const APPLICATION_SOURCES = {
    OWN_IDEA: "OWN_IDEA",
    FACULTY_PROJECT: "FACULTY_PROJECT",
    PROJECT_BANK: "PROJECT_BANK",
} as const;

export type ApplicationSource =
    (typeof APPLICATION_SOURCES)[keyof typeof APPLICATION_SOURCES];

export const APPLICATION_STATUSES = {
    ADMIN_REVIEW: "ADMIN_REVIEW",
    ADMIN_APPROVED: "ADMIN_APPROVED",
    MENTOR_REVIEW: "MENTOR_REVIEW",
    MENTOR_APPROVED: "MENTOR_APPROVED",
    FACULTY_REVIEW: "FACULTY_REVIEW",
    FACULTY_APPROVED: "FACULTY_APPROVED",
    ADMIN_FINAL_REVIEW: "ADMIN_FINAL_REVIEW",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

export type ApplicationStatus =
    (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES];

export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
    APPLICATION_STATUSES.ADMIN_REVIEW,
    APPLICATION_STATUSES.ADMIN_APPROVED,
    APPLICATION_STATUSES.MENTOR_REVIEW,
    APPLICATION_STATUSES.MENTOR_APPROVED,
    APPLICATION_STATUSES.FACULTY_REVIEW,
    APPLICATION_STATUSES.FACULTY_APPROVED,
    APPLICATION_STATUSES.ADMIN_FINAL_REVIEW,
    APPLICATION_STATUSES.APPROVED,
];

export interface ProjectDetails {
    title: string;
    description: string;
    domain: string;
    sdgGoals: string[];
    technologyStack: string[];
    expectedOutcome: string;
}

export interface IApprovalHistory {
    stage: string;
    action: "APPROVED" | "REJECTED";
    approvedBy: mongoose.Types.ObjectId;
    comment: string;
    actedAt: Date;
}

export interface IProjectApplication {
    studentId: mongoose.Types.ObjectId;

    projectId?: mongoose.Types.ObjectId | null;

    source: ApplicationSource;

    mobileNumber: string;

    projectDetails: ProjectDetails | null;

    teamMembers: mongoose.Types.ObjectId[];

    mentorId: mongoose.Types.ObjectId;

    facultyId?: mongoose.Types.ObjectId | null;

    status: ApplicationStatus;

    rejectionReason?: string | null;

    approvalHistory: IApprovalHistory[];

    submittedAt: Date;

    approvedAt?: Date | null;

    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectApplicationDocument =
    HydratedDocument<IProjectApplication>;