import mongoose, { HydratedDocument } from "mongoose";

export const PROJECT_SOURCES = ["OWN_IDEA", "FACULTY_PROJECT", "PROJECT_BANK"] as const;
export type ProjectSource = typeof PROJECT_SOURCES[number];

export const PROJECT_VISIBILITY_STATUSES = ["AVAILABLE", "RESERVED", "ALLOCATED", "HIDDEN"] as const;
export type ProjectVisibilityStatus = typeof PROJECT_VISIBILITY_STATUSES[number];

export interface IProject {
    _id: mongoose.Types.ObjectId;
    title: string;
    domain: string;
    problemStatement?: string;
    description: string;
    expectedOutcome?: string;
    sdgGoals: string[];
    technologyStack: string[];
    source: ProjectSource;
    createdBy: mongoose.Types.ObjectId;
    facultyId?: mongoose.Types.ObjectId | null;
    maxTeamSize: number;
    visibilityStatus: ProjectVisibilityStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectDocument = HydratedDocument<IProject>;
