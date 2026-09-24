import mongoose from "mongoose";
import {
    IProjectSelectionWindow
} from "./projectSelection.type";


const projectSelectionSchema =
    new mongoose.Schema<IProjectSelectionWindow>(
        {
            phase: {
                type: String,

                enum: [
                    "OWN_IDEA",
                    "FACULTY_PROJECT",
                    "PROJECT_BANK"
                ],

                required: true,

                unique: true
            },

            startDate: {
                type: Date,
                required: true
            },

            endDate: {
                type: Date,
                required: true
            },

            isActive: {
                type: Boolean,
                default: true
            }
        },
        {
            timestamps: true
        }
    );


export default mongoose.model<IProjectSelectionWindow>(
    "ProjectSelectionWindow",
    projectSelectionSchema
);