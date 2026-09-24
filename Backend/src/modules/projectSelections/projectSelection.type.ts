import mongoose, { HydratedDocument } from "mongoose";

export type SelectionPhase =
    | "OWN_IDEA"
    | "FACULTY_PROJECT"
    | "PROJECT_BANK";

export interface IProjectSelectionWindow {

    _id: mongoose.Types.ObjectId;

    phase: SelectionPhase;

    startDate: Date;

    endDate: Date;

    isActive: boolean;
}

export type ProjectSelectionDocument =
    HydratedDocument<IProjectSelectionWindow>;