import mongoose from "mongoose";
import { IProjectSelectionWindow, SELECTION_PHASES } from "./projectSelection.type";

const projectSelectionSchema = new mongoose.Schema<IProjectSelectionWindow>(
    {
        phase: { type: String, enum: SELECTION_PHASES, required: true, unique: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

projectSelectionSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

export default mongoose.model<IProjectSelectionWindow>("ProjectSelectionWindow", projectSelectionSchema);
