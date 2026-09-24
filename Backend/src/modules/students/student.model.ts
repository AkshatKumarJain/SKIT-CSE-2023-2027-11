import mongoose from "mongoose";
import { IStudent } from "./student.type";

const studentProfile = new mongoose.Schema<IStudent>({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'userModel'
    },
    rollNumber: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        enum: [7, 8],
        required: true
    },
    isTeamLeader: {
        type: Boolean,
        default: false
    }
},
{ timestamps: true }
)

export default mongoose.model<IStudent>("Student", studentProfile);