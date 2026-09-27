import mongoose from "mongoose";
import {
    APPLICATION_SOURCES,
    IProjectApplication,
    APPLICATION_STATUSES,
} from "./projectApplication.type";

const projectApplicationSchema = new mongoose.Schema<IProjectApplication>(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
        source: { type: String, enum: APPLICATION_SOURCES, required: true, index: true },
        mobileNumber: { type: String, trim: true },
        projectDetails: { type: ProjectDetailsSchema, default: undefined },
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
