import mongoose, { HydratedDocument } from "mongoose";

export type ApplicationSource =
    | "OWN_IDEA"
    | "FACULTY_PROJECT"
    | "PROJECT_BANK";

export type ApplicationStatus =
    | "ADMIN_REVIEW"
    | "ADMIN_APPROVED"
    | "MENTOR_REVIEW"
    | "MENTOR_APPROVED"
    | "FACULTY_REVIEW"
    | "FACULTY_APPROVED"
    | "ADMIN_FINAL_REVIEW"
    | "APPROVED"
    | "REJECTED";

export interface IProjectApplication {

    _id: mongoose.Types.ObjectId;

    studentId: mongoose.Types.ObjectId;

    projectId?: mongoose.Types.ObjectId | null;

    source: ApplicationSource;

    mobileNumber: string;

    projectDetails?: {
        title?: string;

        description?: string;

        domain?: string;

        sdgGoals?: string[];

        technologyStack?: string[];

        expectedOutcome?: string;
    };

    teamMembers: mongoose.Types.ObjectId[];

    mentorId?: mongoose.Types.ObjectId | null;

    facultyId?: mongoose.Types.ObjectId | null;

    status: ApplicationStatus;

    rejectionReason?: string | null;

    approvalHistory?: {
        stage: string;

        action: string;

        approvedBy: mongoose.Types.ObjectId;

        comment?: string;

        actedAt: Date;
    }[];

    submittedAt: Date;

    approvedAt?: Date | null;
}

export type ProjectApplicationDocument =
    HydratedDocument<IProjectApplication>;