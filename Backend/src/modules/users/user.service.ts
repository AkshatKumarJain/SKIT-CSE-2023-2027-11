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
// import http from "http";

class UserService {
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
}

export = new UserService();