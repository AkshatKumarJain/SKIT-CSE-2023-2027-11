import mongoose from "mongoose";
import {
    IProject,
    PROJECT_SOURCES,
    PROJECT_VISIBILITY_STATUSES
} from "./project.type";

const projectSchema = new mongoose.Schema<IProject>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        domain: { type: String, required: true, trim: true },
        sdgGoals: { type: [String], default: [] },
        technologyStack: { type: [String], default: [] },
        expectedOutcome: { type: String, default: "", trim: true },
        source: {
            type: String,
            enum: PROJECT_SOURCES,
            required: true,
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        maxTeamSize: {
            type: Number,
            required: true,
            default: 4,
            min: 1,
            max: 4
        },
        visibilityStatus: {
            type: String,
            enum: PROJECT_VISIBILITY_STATUSES,
            required: true,
            default: "AVAILABLE",
            index: true
        }
    },
    { timestamps: true }
);

projectSchema.index({ source: 1, visibilityStatus: 1 });

export default mongoose.model<IProject>("Project", projectSchema);
