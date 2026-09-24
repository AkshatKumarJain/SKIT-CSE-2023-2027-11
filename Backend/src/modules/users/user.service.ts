import express from "express";
import { IUser } from "./user.type";
import userModel from "./user.model";
import { AppError } from "../../errors/AppError";
import { errorHandler } from "../../middlewares/errorHandler";
import { ERROR_CODES } from "../../errors/errorCodes";
import { issueTokens, revokeAll, rotateRefreshToken } from "redis-jwt-auth";
import { access } from "node:fs";
import crypto from "crypto"
import { redisClient } from "../../config/redis";
import transporter from "../../config/nodemailer";
import { createUserDTO } from "./user.type";
import Student from "../students/student.model";
import { IStudent } from "../students/student.type";
import Teacher from "../teachers/teacher.model";
import { ITeacher } from "../teachers/teacher.type"; 
// import http from "http";
import { uploadOnCloudinary } from "../../config/cloudinary";
import { IUpdateProfile } from "./user.type";

class UserService {

    async createUser(data: createUserDTO) {
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

    // private async sendMail(email: string, username: string) {
    //     // send email to registered email
    //     const mailOptions = {
    //         from: process.env.SENDER_EMAIL,
    //         to: email,
    //         subject: `Welcome ${username} to lms.`,
    //         text: `Welcome to lms. Your account has been created with email id: ${email}.`
    //     }

    //     const mail = await transporter.sendMail(mailOptions);
    //     if (!mail) {
    //         console.log("couldn't send mail");
    //     }
    // }

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
        const { accessToken, refreshToken } = await issueTokens({ userId: findUser._id.toString(), role: findUser.role });
        if(!accessToken || !refreshToken)
        {
            throw new AppError("couldn't get tokens", 500, "");
        }
        return {accessToken, refreshToken};
    }

    async logout(userId: string) {
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

        const newRefreshToken = await rotateRefreshToken(refreshToken);

        if (!newRefreshToken) {
            throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
            }
        return newRefreshToken;
    }

    // private async getCacheKey() {
    //     const rawToken = crypto.randomBytes(32).toString('hex');
    //     const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    //     const cacheKey = "cache:resetOtp";

    //     const resetOTP = tokenHash;
    //     const resetOTPExpiresAt = Date.now() + 300 * 1000; // 5 minutes

    //     return {cacheKey, resetOTP, resetOTPExpiresAt};
    // }

    async forgotPassword(email: string){
        const findUser = await userModel.findOne({email: email});

        if(!findUser)
        {
            throw new AppError("If this email exists, the link has been sent", 200, "");
        }

        const cacheKey = `password-reset:${findUser._id}`; 
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const resetOTP = tokenHash;
        const resetOTPExpiresAt = Date.now() + 300 * 1000; // 5 minutes

        await redisClient.setEx(cacheKey, resetOTPExpiresAt, resetOTP);

        // await findUser.save();

        const AppBaseUrl = "http://localhost:5173";

        const resetUrl = `${AppBaseUrl}/reset-password/${rawToken}`;

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: findUser.email,
            subject: "Reset password email",
            text: `click the link below to reset your password. It will expire in 5 minutes.
            <a href="${resetUrl}">${resetUrl}</a>
            ` 
        }

        console.log(mailOptions);

        const sendEmail = await transporter.sendMail(mailOptions);

        if(!sendEmail)
        {
            throw new AppError("could not send email", 503, "EMAIL_DELIVERY_FAILED");
        }

        // return {
        //     message: "Mail sent successfully"
        // };
        return true;
    }

    async resetPassword(newPassword: string, email: string){
        const findUser = await userModel.findOne({email: email});

        if(!findUser)
        {
            throw new AppError("could not find user with this email", 404, "");
        }

        const isCachedAvailable = await redisClient.get(`password-reset:${findUser._id}`);

        if(!isCachedAvailable)
        {
            throw new Error("Invalid or expired token")
        }

        const oldPassword: string = findUser.password;

        if(oldPassword===newPassword)
        {
            throw new AppError("New password cannot be same as old password.", 422, "Unprocessable Entity");
        }

        findUser.password = newPassword;
        
        await findUser.save();

         await this.logout(findUser._id.toString());

        // return {
        //     message: "Password reset successful. Please login again.",
        // };
        return true;
    }

    async updateUserProfile({userId, name, file}: IUpdateProfile) {
        const updatedData: any = {};
        if(name) updatedData.name = name;
        
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
            {new: true}
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
}

export = new UserService();