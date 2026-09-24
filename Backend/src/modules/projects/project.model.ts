import mongoose from "mongoose";
import { IProject } from "./project.type";

const projectSchema = new mongoose.Schema<IProject>(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        domain: {
            type: String,
            required: true,
            trim: true
        },

        sdgGoals: {
            type: [String],
            required: true,
            default: []
        },

        technologyStack: {
            type: [String],
            required: true,
            default: []
        },

        expectedOutcome: {
            type: String,
            default: ""
        },

        source: {
            type: String,
            enum: [
                "OWN_IDEA",
                "FACULTY_PROJECT",
                "PROJECT_BANK"
            ],
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        maxTeamSize: {
            type: Number,
            default: 4,
            min: 2,
            max: 4
        },

        visibilityStatus: {
            type: String,
            enum: [
                "AVAILABLE",
                "RESERVED",
                "ALLOCATED",
                "HIDDEN"
            ],
            default: "AVAILABLE"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IProject>(
    "Project",
    projectSchema
);