import mongoose from "mongoose";
import { ITeacher } from "./teacher.type";

const teacherProfile = new mongoose.Schema<ITeacher>({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'userModel',
        required: true,
        unique: true
    },
    designation: {
        type: String,
        required: true
    },
    specialization: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    isMentor: {
        type: Boolean,
        default: false
    },
    isLabFaculty: {
        type: Boolean,
        default: false
    }
        
}, { timestamps: true });

export default mongoose.model<ITeacher>("Teacher", teacherProfile);