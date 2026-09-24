import express from "express";
import { Request, Response } from "express";
import userService from "./user.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import userModel from "./user.model";
import { createUserDTO } from "./user.type";

class UserController {

    async createUser(req: Request, res: Response): Promise<Response> {
        const {name, email, password, role, department, semester, rollNumber, isTeamLeader, designation, specialization, skills, isMentor, isLabFaculty }: createUserDTO = req.body;
        if (!name || !email || !password || !role || !department) {
            throw new AppError("All fields are required!", 403, "")
        }
        
        // check if the password lenght is of atleast 6 characters.
        if (password.length < 6) {
            throw new AppError("Password length must be of atleast 6 characters.", 403, "")
        }
        
        // check if the length of password exceed 15 characters.
        if (password.length > 15) {
            throw new AppError("Password length cannot exceed 15 characters.", 403, "")
        }

        const createdUser = await userService.createUser(req.body);
        return res.status(201).json({
            message: "User created successfully",
            data: createdUser
        })

    }

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
}

export = new UserController();