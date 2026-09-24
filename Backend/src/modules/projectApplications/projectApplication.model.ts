import mongoose from "mongoose";
import {
    APPLICATION_SOURCES,
    APPLICATION_STATUSES,
    IProjectApplication
} from "./projectApplication.type";

const projectDetailsSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true },
        domain: { type: String, trim: true },
        problemStatement: { type: String, trim: true },
        description: { type: String, trim: true },
        expectedOutcome: { type: String, trim: true, default: "" },
        sdgGoals: { type: [String], default: [] },
        technologyStack: { type: [String], default: [] }
    },
    { _id: false }
);

const approvalHistorySchema = new mongoose.Schema(
    {
        stage: { type: String, enum: APPLICATION_STATUSES, required: true },
        action: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String, trim: true },
        actedAt: { type: Date, required: true }
    },
    { _id: false }
);

const projectApplicationSchema = new mongoose.Schema<IProjectApplication>(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
        source: { type: String, enum: APPLICATION_SOURCES, required: true, index: true },
        mobileNumber: { type: String, trim: true },
        projectDetails: { type: projectDetailsSchema, default: undefined },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
        facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        status: { type: String, enum: APPLICATION_STATUSES, required: true, index: true },
        rejectionReason: { type: String, trim: true, default: null },
        approvalHistory: { type: [approvalHistorySchema], default: [] },
        submittedAt: { type: Date, default: Date.now, required: true },
        approvedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

projectApplicationSchema.index({ teamId: 1, status: 1 });
projectApplicationSchema.index({ mentorId: 1, status: 1 });
projectApplicationSchema.index({ facultyId: 1, status: 1 });

export default mongoose.model<IProjectApplication>("ProjectApplication", projectApplicationSchema);
