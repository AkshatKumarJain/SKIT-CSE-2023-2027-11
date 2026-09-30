import express from "express";
import studentService from "./student.service";
import { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

class studentController{
    async getStudentProfile(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.userId;
        if(!userId)
        {
            throw new AppError("No user found", 404, ERROR_CODES.USER_NOT_FOUND)
        }
        const getProfile = await studentService.getStudentProfile(userId);
        return res.status(200).json({
            message: "Student profile fetched successfully",
            data: getProfile
        })
    }
}

export = new studentController();