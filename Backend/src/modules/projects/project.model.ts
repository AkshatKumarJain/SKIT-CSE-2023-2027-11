import mongoose from "mongoose";
import {
  IProject,
  PROJECT_SOURCES,
  PROJECT_VISIBILITY_STATUSES,
} from "./project.type";

const projectSchema = new mongoose.Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    specificFunctionalities: { type: [String], default: [] },
    sdgGoals: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    source: {
      type: String,
      enum: PROJECT_SOURCES,
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    maxTeamSize: { type: Number, default: 4, min: 2, max: 4 },
    visibilityStatus: {
      type: String,
      enum: PROJECT_VISIBILITY_STATUSES,
      default: "AVAILABLE",
      index: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ source: 1, visibilityStatus: 1 });

export default mongoose.model<IProject>("Project", projectSchema);
