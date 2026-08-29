import mongoose from "mongoose"
import { HydratedDocument } from "mongoose";

export interface IUser{
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    profilePhotoUrl: string;
    profilePhotoPublicId: string
    role: "student" | "teacher" | "admin";
    phoneNo: string;
    // resetOTP: string;
    // resetOTPExpiresAt: number; // will not store otp in database instead use redis for storing and for ttl of otp
    comparePassword(password: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser>;