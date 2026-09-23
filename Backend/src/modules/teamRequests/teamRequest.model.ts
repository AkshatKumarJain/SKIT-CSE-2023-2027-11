import mongoose from "mongoose";
import { ITeamRequest, TEAM_REQUEST_STATUSES } from "./teamRequest.type";

const teamRequestSchema = new mongoose.Schema<ITeamRequest>(
    {
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            index: true,
        },
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        requestedStudentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: TEAM_REQUEST_STATUSES,
            default: "PENDING",
            required: true,
            index: true,
        },
        notifiedAt: Date,
        acceptedAt: Date,
        rejectedAt: Date,
        cancelledAt: Date,
    },
    { timestamps: true }
);

teamRequestSchema.index({ teamId: 1, requestedStudentId: 1, status: 1 });
teamRequestSchema.index({ requestedStudentId: 1, status: 1, createdAt: -1 });

export default mongoose.model<ITeamRequest>("TeamRequest", teamRequestSchema);
