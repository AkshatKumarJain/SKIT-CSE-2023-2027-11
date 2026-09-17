import mongoose from "mongoose";
import {
    IProjectApplication,
    APPLICATION_SOURCES,
    APPLICATION_STATUSES
} from "./projeectApplication.type";

const projectApplicationSchema = new mongoose.Schema<IProjectApplication>(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
            index: true
        },
        source: {
            type: String,
            enum: APPLICATION_SOURCES,
            required: true,
            index: true
        },
        mobileNumber: {
            type: String,
            required: true,
            trim: true
        },
        projectDetails: {
            title: { type: String, required: true, trim: true },
            description: { type: String, required: true, trim: true },
            domain: { type: String, required: true, trim: true },
            sdgGoals: { type: [String], default: [] },
            technologyStack: { type: [String], default: [] },
            expectedOutcome: { type: String, default: "", trim: true }
        },
        teamMembers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        status: {
            type: String,
            enum: APPLICATION_STATUSES,
            default: "ADMIN_REVIEW",
            required: true,
            index: true
        },
        rejectionReason: { type: String, default: null, trim: true },
        approvalHistory: [{
            stage: { type: String, required: true },
            action: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            comment: { type: String, default: "" },
            actedAt: { type: Date, default: Date.now }
        }],
        submittedAt: { type: Date, default: Date.now, required: true },
        approvedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

projectApplicationSchema.index({ status: 1, mentorId: 1 });
projectApplicationSchema.index({ status: 1, facultyId: 1 });
projectApplicationSchema.index({ status: 1, teamMembers: 1 });

export default mongoose.model<IProjectApplication>("ProjectApplication", projectApplicationSchema);
