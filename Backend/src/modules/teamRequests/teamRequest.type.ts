import mongoose from "mongoose";

export const TEAM_REQUEST_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"] as const;
export type TeamRequestStatus = typeof TEAM_REQUEST_STATUSES[number];

export interface ITeamRequest {
    _id: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    requesterId: mongoose.Types.ObjectId;
    requestedStudentId: mongoose.Types.ObjectId;
    status: TeamRequestStatus;
    notifiedAt?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
