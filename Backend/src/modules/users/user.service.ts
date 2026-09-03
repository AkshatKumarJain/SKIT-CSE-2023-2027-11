import express from "express";
import { IUser } from "./user.type";
import userModel from "./user.model";
import { AppError } from "../../errors/AppError";
import { errorHandler } from "../../middlewares/errorHandler";
import { ERROR_CODES } from "../../errors/errorCodes";
import { issueTokens, revokeAll, rotateRefreshToken } from "redis-jwt-auth";
import { access } from "node:fs";

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
}

export = new UserService();