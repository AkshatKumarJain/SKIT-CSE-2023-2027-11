import mongoose, { HydratedDocument } from "mongoose";

export type ProjectSource =
    | "OWN_IDEA"
    | "FACULTY_PROJECT"
    | "PROJECT_BANK";

export type ProjectVisibilityStatus =
    | "AVAILABLE"
    | "RESERVED"
    | "ALLOCATED"
    | "HIDDEN";

export interface IProject {
    _id: mongoose.Types.ObjectId;

    title: string;

    description: string;

    domain: string;

    sdgGoals: string[];

    technologyStack: string[];

    expectedOutcome?: string;

    source: ProjectSource;

    createdBy: mongoose.Types.ObjectId;

    facultyId?: mongoose.Types.ObjectId | null;

    maxTeamSize: number;

    visibilityStatus: ProjectVisibilityStatus;
}

export type ProjectDocument = HydratedDocument<IProject>;