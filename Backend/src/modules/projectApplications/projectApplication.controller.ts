import { Request, Response } from "express";

import projectApplicationService
    from "./projectApplication.service";

import { AppError }
    from "../../errors/AppError";

import { ERROR_CODES }
    from "../../errors/errorCodes";


class ProjectApplicationController {

    
    // --------- OWN IDEA --------


    async submitOwnIdea(
        req: Request,
        res: Response
    ): Promise<Response> {

        const studentId = req.user?.userId;

        if (!studentId) {

            throw new AppError(
                "Authentication required",
                401,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        const application =
            await projectApplicationService
                .submitOwnIdea(
                    studentId,
                    req.body
                );


        return res.status(201).json({

            message:
                "Project proposal submitted successfully",

            data: application

        });
    }


    
    // --------FACULTY PROJECT-------------
    

    async applyFacultyProject(
        req: Request,
        res: Response
    ): Promise<Response> {

        const studentId = req.user?.userId;

        if (!studentId) {

            throw new AppError(
                "Authentication required",
                401,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        const application =
            await projectApplicationService
                .applyFacultyProject(
                    studentId,
                    req.body
                );


        return res.status(201).json({

            message:
                "Faculty project application submitted successfully",

            data: application

        });
    }


    
    // --------PROJECT BANK-------------
    

    async applyProjectBank(
        req: Request,
        res: Response
    ): Promise<Response> {

        const studentId = req.user?.userId;

        if (!studentId) {

            throw new AppError(
                "Authentication required",
                401,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        const application =
            await projectApplicationService
                .applyProjectBank(
                    studentId,
                    req.body
                );


        return res.status(201).json({

            message:
                "Project bank application submitted successfully",

            data: application

        });
    }


    
    // -------- MY APPLICATIONS -------------
    

    async getMyApplications(
        req: Request,
        res: Response
    ): Promise<Response> {

        const studentId = req.user?.userId;

        if (!studentId) {

            throw new AppError(
                "Authentication required",
                401,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        const applications =
            await projectApplicationService
                .getMyApplications(studentId);


        return res.status(200).json({

            message:
                "Applications fetched successfully",

            data: applications

        });
    }


    
    // -------- APPLICATION BY ID -------------
    

    async getApplicationById(
        req: Request,
        res: Response
    ): Promise<Response> {

        const { applicationId } = req.params;


        const application =
            await projectApplicationService
                .getApplicationById(
                    applicationId
                );


        return res.status(200).json({

            message:
                "Application fetched successfully",

            data: application

        });
    }
}


export = new ProjectApplicationController();