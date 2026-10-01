import express from "express";
import Teacher from "./teacher.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import userModel from "../users/user.model";

class teacherService {
    async getTeacherProfile(userId: string) {
        const findUser = await userModel.findById(userId);
        if(!findUser)
        {
            throw new AppError("No such user exists!", 404, ERROR_CODES.USER_NOT_FOUND);
        }
        const findTeacher = await Teacher.findOne({userId})
        if(!findTeacher)
        {
            throw new AppError("No such Teacher exists!", 404, ERROR_CODES.TEACHER_NOT_FOUND);
        }
        const obj = {
            name: findUser.name, 
            email: findUser.email,
            phoneNumber: findUser.phoneNo,
            department: findUser.department,
            profilePhotoUrl: findUser.profilePhotoUrl,
            designation: findTeacher.designation,
            specialization: findTeacher.specialization
        }
        return obj;
    }
};

export = new teacherService();