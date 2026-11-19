import mongoose from "mongoose";
import {
    IProjectPPT,
    PROJECT_PPT_STATUSES,
    PPT_REVIEW_DECISIONS,
} from "./projectPPT.type";

const reviewSchema = new mongoose.Schema(
    {
        decision: {
            type: String,
            enum: PPT_REVIEW_DECISIONS,
            default: "PENDING",
            required: true,
        },
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        comment: { type: String, trim: true, default: "" },
        reviewedAt: { type: Date, default: null },
    },
    { _id: false },
);

const versionSchema = new mongoose.Schema(
    {
        versionNumber: { type: Number, required: true, min: 1 },
        fileUrl: { type: String, required: true, trim: true },
        fileName: { type: String, required: true, trim: true },
        mimeType: { type: String, required: true, trim: true },
        fileSize: { type: Number, required: true, min: 1 },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        uploadedAt: { type: Date, default: Date.now, required: true },
        mentorReview: { type: reviewSchema, default: () => ({}) },
        coordinatorReview: { type: reviewSchema, default: () => ({}) },
    },
    { _id: false },
);

const projectPPTSchema = new mongoose.Schema<IProjectPPT>(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProjectApplication",
            required: true,
            unique: true,
            index: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: PROJECT_PPT_STATUSES,
            required: true,
            default: "PENDING_MENTOR_REVIEW",
            index: true,
        },
        latestVersionNumber: { type: Number, required: true, default: 1 },
        versions: { type: [versionSchema], required: true, default: [] },
    },
    { timestamps: true },
);

projectPPTSchema.index({ mentorId: 1, status: 1 });
projectPPTSchema.index({ status: 1, updatedAt: -1 });
projectPPTSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model<IProjectPPT>("ProjectPPT", projectPPTSchema);
