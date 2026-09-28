import mongoose from "mongoose";

export interface IStudent{
    userId: mongoose.Types.ObjectId;
    rollNumber: string;
    semester: 7 | 8;
    isTeamLeader: boolean;
}