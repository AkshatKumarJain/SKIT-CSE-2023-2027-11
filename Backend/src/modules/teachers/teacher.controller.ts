import express from "express";
import teacherService from "./teacher.service";
import { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

class teacherController{
    async getTeacherProfile(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.userId;
        if(!userId)
        {
            throw new AppError("No user found", 404, ERROR_CODES.USER_NOT_FOUND)
        }
        const getProfile = await teacherService.getTeacherProfile(userId);
        return res.status(200).json({
            message: "Student profile fetched successfully",
            data: getProfile
        })
    }
}

export = new teacherController();