import { Request, Response } from "express";
import projectService from "./project.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const requireParam = (req: Request, name: string): string => {
    const value = req.params[name];
    if (typeof value !== "string" || !value) {
        throw new AppError(`${name} is required`, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return value;
};

const requireUser = (req: Request) => {
    if (!req.user?.userId || !req.user.role) {
        throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
    }
    return req.user;
};

class ProjectController {
    async createProject(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const project = await projectService.createProject(user.userId, user.role!, req.body);
        return res.status(201).json({ data: project, message: "Project created successfully" });
    }

    async getAllProjects(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const projects = await projectService.getProjectsForRole(user.role!);
        return res.status(200).json({ data: projects, message: "Projects fetched successfully" });
    }

    async getFacultyProjects(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const projects = await projectService.getProjectsForRole(user.role!, "FACULTY_PROJECT");
        return res.status(200).json({ data: projects, message: "Faculty projects fetched successfully" });
    }

    async getBankProjects(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const projects = await projectService.getProjectsForRole(user.role!, "PROJECT_BANK");
        return res.status(200).json({ data: projects, message: "Project bank projects fetched successfully" });
    }

    async getProjectById(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const project = await projectService.getProjectById(requireParam(req, "projectId"), user.role!);
        return res.status(200).json({ data: project, message: "Project fetched successfully" });
    }

    async updateProject(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const project = await projectService.updateProject(requireParam(req, "projectId"), user.userId, user.role!, req.body);
        return res.status(200).json({ data: project, message: "Project updated successfully" });
    }

    async hideProject(req: Request, res: Response): Promise<Response> {
        const user = requireUser(req);
        const project = await projectService.hideProject(requireParam(req, "projectId"), user.userId, user.role!);
        return res.status(200).json({ data: project, message: "Project hidden successfully" });
    }
}

export = new ProjectController();
