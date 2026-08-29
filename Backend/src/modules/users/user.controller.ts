import express from "express";
import { Request, Response } from "express";
import userService from "./user.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import userModel from "./user.model";

class UserController {
    async login(req: Request, res: Response): Promise<Response> {
        const {email, password} = req.body;
        if(!email || !password)
        {
            throw new AppError("email and password are required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        const token = await userService.login(email, password);
        return res.status(200).json({
            token,
            message: "Success"
        })
    }

    async logout(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.userId;
        if(!userId)
        {
            throw new AppError("userId is required", 404, ERROR_CODES.VALIDATION_ERROR);
        }
        const isLogout = await userService.logout(userId);
        return res.status(200).json({
            data: userId,
            message: "user logout successful"
        });
    }

    async refresh(req: Request, res: Response): Promise<Response> {
        const refreshToken = req.body;
        if(!refreshToken)
        {
            throw new AppError("Invalid or empty refresh token", 404, ERROR_CODES.VALIDATION_ERROR);
        }
        const rotatedToken = await userService.refresh(refreshToken);
        return res.status(200).json({
            message: "token rotated successfully",
            newRefreshToken: rotatedToken 
        });
    }
}

export = new UserController();