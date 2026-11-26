import express from "express";
import { IUser } from "./user.type";
import userModel from "./user.model";
import { AppError } from "../../errors/AppError";
import { errorHandler } from "../../middlewares/errorHandler";
import { ERROR_CODES } from "../../errors/errorCodes";
import { loadAuth } from "../../config/auth";
import { access } from "node:fs";
import crypto from "node:crypto";
import { redisClient } from "../../config/redis";
import { sendEmail } from "../../config/nodemailer";
import { IUpdateProfile } from "./user.type";
import { uploadOnCloudinary } from "../../config/cloudinary";
import bcrypt from "bcrypt"
import Student from "../students/student.model";
import Teacher from "../teachers/teacher.model";
const PASSWORD_RESET_TTL_SECONDS = 5 * 60;
// Earlier reset records used the wrong expiry unit. Only accept newly issued links.
const PASSWORD_RESET_KEY_PREFIX = "password-reset:v2:";

const CONSUME_RESET_TOKEN_SCRIPT = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
    end
    return 0
`;

function invalidResetToken() {
    return new AppError("Invalid or expired reset link. Request a new link.", 400, ERROR_CODES.INVALID_TOKEN);
}

class UserService {

    async createUser(data: any) {
        const { name, email, password, role, department, semester, rollNumber, isTeamLeader, designation, specialization, skills, isMentor, isLabFaculty } = data;

        // check if user already exists or not
        const findUser = await userModel.findOne({ email: email });
        if (findUser) {
            throw new AppError("User Email already exists.", 403, ERROR_CODES.USER_ALREADY_EXISTS);
        }

        const createdUser = await userModel.create({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role ? data.role: undefined,
            department: data.department,
            // semester: data.semester ? data.semester: undefined
        } as IUser);
        if (!createdUser) {
            throw new AppError("Cannot create User", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
        await createdUser.save();

        if(createdUser.role==='student')
        {
            if(!semester || !rollNumber)
            {
                throw new AppError("All fields are required", 403, "")
            }
            const createdStudentProfile = await Student.create({userId: createdUser._id, rollNumber, semester, isTeamLeader: isTeamLeader ?? false});
            // createdStudentProfile.semester = semester;

            if(!createdStudentProfile)
            {
                throw new AppError("Could not create student profile.", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
            }
            await createdStudentProfile.save();
            console.log("student profile created");
            return createdStudentProfile;
        }

        else if(createdUser.role==='teacher')
        {
            if(!designation)
            {
                throw new AppError("Designation is required", 403, ERROR_CODES.VALIDATION_ERROR);
            }
            const createdTeacherProfile = await Teacher.create({userId: createdUser._id, designation, specialization: specialization ?? [], skills: skills ?? [], isMentor: isMentor ?? false, isLabFaculty: isLabFaculty ?? false})
            if(!createdTeacherProfile)
            {
                throw new AppError("Could not create teacher profile.", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
            }
            await createdTeacherProfile.save();
            console.log("teacher profile created");
            return createdTeacherProfile;
        }

        // this.sendMail(email, username);

        return createdUser;
    }
    async login(email: string, password: string) {
        const findUser = await userModel.findOne({email: email});
        if(!findUser)
        {
            throw new AppError("User with this email doesn't exist", 404, ERROR_CODES.USER_NOT_FOUND);
        }
        const checkPassword = await findUser.comparePassword(password);
        if(!checkPassword)
        {
            throw new AppError("email or password is incorrect", 401, ERROR_CODES.INVALID_CREDENTIALS);
        }
        const { issueTokens } = await loadAuth();
        const { accessToken, refreshToken } = await issueTokens({ userId: findUser._id.toString(), role: findUser.role });
        if(!accessToken || !refreshToken)
        {
            throw new AppError("couldn't get tokens", 500, "");
        }
        return {accessToken, refreshToken};
    }

    async logout(userId: string) {
        const { revokeAll } = await loadAuth();
        const isRevoked = await revokeAll(userId.toString());
        if(!isRevoked)
        {
            throw new AppError("Something went wrong", 500, "");
        }
        return isRevoked;
    }

    async refresh(refreshToken: string){
        if (!refreshToken) {
            throw new AppError("Refresh token is required", 400, "REFRESH_TOKEN_REQUIRED");
        }

        try {
            // The auth package owns refresh-token storage and rotation. Do not
            // scan the application's Redis client before calling it.
            const { rotateRefreshToken } = await loadAuth();
            const rotatedTokens = await rotateRefreshToken(refreshToken);
            if (!rotatedTokens?.accessToken || !rotatedTokens?.refreshToken) {
                throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
            }
            return rotatedTokens;
        } catch (error) {
            if (error instanceof AppError) throw error;

            const message = error instanceof Error ? error.message : "";
            const invalidRefreshTokenErrors = [
                "Invalid or expired refresh token",
                "Invalid refresh token payload",
                "Invalid refresh token type",
                "Refresh token missing jti",
                "Refresh token invalid or already used",
            ];

            if (invalidRefreshTokenErrors.includes(message)) {
                throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
            }

            throw error;
        }
    }

    async forgotPassword(email: string) {
        const user = await userModel.findOne({ email });
        if (!user) return;

        const cacheKey = `${PASSWORD_RESET_KEY_PREFIX}${user._id}`;
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        await redisClient.setEx(cacheKey, PASSWORD_RESET_TTL_SECONDS, tokenHash);

        const appBaseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
        const resetUrl = `${appBaseUrl}/reset-password/${rawToken}`;

        const emailResult = await sendEmail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Reset password email",
            text: `Open this link to reset your password. It expires in 5 minutes: ${resetUrl}`,
        });

        if (!emailResult) {
            throw new AppError("could not send email", 503, "EMAIL_DELIVERY_FAILED");
        }
    }

    async resetPassword(newPassword: string, email: string, token: string) {
        if (!/^[a-f0-9]{64}$/.test(token)) {
            throw invalidResetToken();
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            throw invalidResetToken();
        }

        const cacheKey = `${PASSWORD_RESET_KEY_PREFIX}${user._id}`;
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        if (await redisClient.get(cacheKey) !== tokenHash) {
            throw invalidResetToken();
        }

        if (await user.comparePassword(newPassword)) {
            throw new AppError("New password must be different from the current password.", 422, ERROR_CODES.INVALID_CREDENTIALS);
        }

        // Claim the matching token atomically before saving so it can only be used once.
        const consumed = await redisClient.eval(CONSUME_RESET_TOKEN_SCRIPT, {
            keys: [cacheKey],
            arguments: [tokenHash],
        });
        if (consumed !== 1) {
            throw invalidResetToken();
        }

        user.password = newPassword;
        await user.save();
    }

    async updateUserProfile({userId, phoneNo, file}: IUpdateProfile) {
        const updatedData: any = {};
        if(phoneNo) updatedData.phoneNo = phoneNo;
        
        if(file)
        {
            const image = await this.uploadImage(file);
            console.log("CLOUDINARY URL RECEIVED ", image.url);
            updatedData.profilePhotoUrl = image.url;
            updatedData.profilePhotoPublicId = image.publicId;
        }

        console.log("updated object ", updatedData);


        const updatedUserProfile = await userModel.findByIdAndUpdate(userId, 
            {$set: updatedData},
            {returnDocument: "after"}
        );

        if(!updatedUserProfile)
        {
            throw new AppError("User not found", 400, ERROR_CODES.USER_NOT_FOUND);
        }
        return updatedUserProfile;
    }    

    async uploadImage(file: Express.Multer.File) {
        if(!file)
        {
            throw new AppError("File not provided", 403, ERROR_CODES.VALIDATION_ERROR);
        }
        const localFilePath = file.path;
        const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

        if(!cloudinaryResponse)
        {
            throw new AppError("Cloudinary upload failed", 400, ERROR_CODES.FILE_UPLOAD_FAILED);
        }

        return {
            url: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError("All fields are required", 400, ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (newPassword !== confirmPassword) {
        throw new AppError("New password and confirm password do not match", 400, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // if (newPassword.length < 8) {
    //     throw new AppError("Password must be at least 8 characters long", 400, ERROR_CODES.INVALID_CREDENTIALS);
    // }

    const user = await userModel.findById(userId).select("+password");

    if (!user) {
        throw new AppError("User not found", 404, ERROR_CODES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordValid) {
        throw new AppError("Current password is incorrect", 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    const isSamePassword = await bcrypt.compare(
        newPassword,
        user.password
    );

    if (isSamePassword) {
        throw new AppError("New password must be different from the current password", 400, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // user.password = await bcrypt.hash(newPassword, 12);
    user.password = newPassword;
    await user.save();

    // Invalidate refresh-token sessions after changing the password.
    await this.logout(userId);
}
}

export = new UserService();
