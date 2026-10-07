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
        const {refreshToken} = req.body;
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

    async forgotPassword(req: Request, res: Response): Promise<Response>{
        const {email} = req.body;
        if(!email)
        {
            throw new AppError("email is required", 400, ERROR_CODES.VALIDATION_ERROR)
        }

            await userService.forgotPassword(email);

            return res.status(200).json({
                message: "If this email exists, email will be sent."
            })
        }
    
    async resetPassword(req: Request, res: Response): Promise<Response>{
        const {newPassword, email} = req.body;
        if(!newPassword)
            {
                throw new AppError("new Password is required", 400, ERROR_CODES.VALIDATION_ERROR);
            }
        if(!email)
        {
            throw new AppError("email is required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        
        await userService.resetPassword(newPassword, email);
        
        return res.status(201).json({
            message: "Password has been changed successfully"
        });
    }

    async updateUserProfile(req: Request, res: Response): Promise<Response> {
        const userId = req.user!.userId;
        if(!userId)
        {
            throw new AppError("Empty token", 400, ERROR_CODES.INVALID_TOKEN);
        }

        const phoneNumber = req.body?.phoneNumber;
        const file = req?.file

        
        console.log("req.body:", req.body);
        console.log("req.file:", req.file);
        
        if (!phoneNumber && !req.file) {
          return res.status(200).json({
            message: "Nothing to update"
          });
        }

        const updateProfile = await userService.updateUserProfile({ userId, phoneNumber, file });
        if(!updateProfile)
        {
            throw new AppError("Couldn't update profile", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
        }
        return res.status(201).json({
            message: "User Profile updated successfully",
            data: updateProfile
        })
        
    }
}

export = new UserController();