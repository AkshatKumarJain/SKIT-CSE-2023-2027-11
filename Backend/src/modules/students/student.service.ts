import express from "express";
import Student from "./student.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import userModel from "../users/user.model";

class studentService {
    async getStudentProfile(userId: string) {
        const findUser = await userModel.findById(userId);
        if(!findUser)
        {
            throw new AppError("No such user exists!", 404, ERROR_CODES.USER_NOT_FOUND);
        }
        const findStudent = await Student.findOne({userId})
        if(!findStudent)
        {
            throw new AppError("No such student exists!", 404, ERROR_CODES.STUDENT_NOT_FOUND);
        }
        const obj = {
            name: findUser.name, 
            email: findUser.email,
            phoneNumber: findUser.phoneNo,
            department: findUser.department,
            profilePhotoUrl: findUser.profilePhotoUrl,
            rollNumber: findStudent.rollNumber,
            semester: findStudent.semester
        }
        return obj;
    }
};

export = new studentService();