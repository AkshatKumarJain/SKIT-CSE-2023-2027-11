import mongoose, { HydratedDocument } from "mongoose";

export const SELECTION_PHASES = ["OWN_IDEA", "FACULTY_PROJECT", "PROJECT_BANK"] as const;
export type SelectionPhase = typeof SELECTION_PHASES[number];

export interface IProjectSelectionWindow {
    _id: mongoose.Types.ObjectId;
    phase: SelectionPhase;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ProjectSelectionDocument = HydratedDocument<IProjectSelectionWindow>;
