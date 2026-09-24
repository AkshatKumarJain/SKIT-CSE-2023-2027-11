import { Request, Response } from "express";
import projectService from "./project.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

class ProjectController {

    async createProject(
        req: Request,
        res: Response
    ): Promise<Response> {

        const userId = req.user?.userId;

        if (!userId) {
            throw new AppError(
                "User authentication required",
                401,
                ERROR_CODES.VALIDATION_ERROR
            );
        }

        const project = await projectService.createProject(
            req.body,
            userId
        );

        return res.status(201).json({
            message: "Project created successfully",
            data: project
        });
    }


    async getProjects(
        req: Request,
        res: Response
    ): Promise<Response> {

        const source = req.query.source as string | undefined;

        const projects =
            await projectService.getAvailableProjects(source);

        return res.status(200).json({
            message: "Projects fetched successfully",
            data: projects
        });
    }


    async getProjectById(
        req: Request,
        res: Response
    ): Promise<Response> {

        const { projectId } = req.params;

        const project =
            await projectService.getProjectById(projectId);

        return res.status(200).json({
            message: "Project fetched successfully",
            data: project
        });
    }


    async getFacultyProjects(
        req: Request,
        res: Response
    ): Promise<Response> {

        const projects =
            await projectService.getFacultyProjects();

        return res.status(200).json({
            message: "Faculty projects fetched successfully",
            data: projects
        });
    }


    async getProjectBank(
        req: Request,
        res: Response
    ): Promise<Response> {

        const projects =
            await projectService.getProjectBank();

        return res.status(200).json({
            message: "Project bank fetched successfully",
            data: projects
        });
    }


    async updateProject(
        req: Request,
        res: Response
    ): Promise<Response> {

        const { projectId } = req.params;

        const project =
            await projectService.updateProject(
                projectId,
                req.body
            );

        return res.status(200).json({
            message: "Project updated successfully",
            data: project
        });
    }


    async hideProject(
        req: Request,
        res: Response
    ): Promise<Response> {

        const { projectId } = req.params;

        const project =
            await projectService.hideProject(projectId);

        return res.status(200).json({
            message: "Project hidden successfully",
            data: project
        });
    }
}

export = new ProjectController();