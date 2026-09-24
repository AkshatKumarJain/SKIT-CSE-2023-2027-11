import mongoose from "mongoose";

export interface ITeacher{
    userId: mongoose.Types.ObjectId;
    designation: string;
    specialization: string[];
    skills: string[];
    isMentor: boolean;
    isLabFaculty: boolean;
}