import mongoose from "mongoose";

export const TEAM_STATUSES = ["FORMING", "COMPLETED", "CANCELLED"] as const;
export type TeamStatus = typeof TEAM_STATUSES[number];

export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 4;
export const MAX_ADDITIONAL_MEMBERS = 3;

export interface ITeam {
    _id: mongoose.Types.ObjectId;
    leaderId: mongoose.Types.ObjectId;
    memberIds: mongoose.Types.ObjectId[];
    status: TeamStatus;
    createdAt: Date;
    updatedAt: Date;
}
