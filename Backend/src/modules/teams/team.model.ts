import mongoose from "mongoose";
import { ITeam, TEAM_STATUSES } from "./team.type";

const teamSchema = new mongoose.Schema<ITeam>(
    {
        leaderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        memberIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        status: {
            type: String,
            enum: TEAM_STATUSES,
            default: "FORMING",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

teamSchema.index({ leaderId: 1, status: 1 });
teamSchema.index({ memberIds: 1, status: 1 });

export default mongoose.model<ITeam>("Team", teamSchema);
