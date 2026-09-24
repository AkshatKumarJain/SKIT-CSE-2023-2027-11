import { Request, Response } from "express";
import projectService from "./project.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const auth = (req: Request) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
    return userId;
};

class ProjectController {
    async create(req: Request, res: Response): Promise<Response> {
        const userId = auth(req);
        const project = await projectService.createProject(userId, req.user?.role, req.body);
        return res.status(201).json({ success: true, data: project });
    }

    async list(req: Request, res: Response): Promise<Response> {
        auth(req);
        return res.json({ success: true, data: await projectService.getProjects(req.user?.role) });
    }

    async faculty(req: Request, res: Response): Promise<Response> {
        auth(req);
        return res.json({ success: true, data: await projectService.getAvailableProjects("FACULTY_PROJECT") });
    }

    async bank(req: Request, res: Response): Promise<Response> {
        auth(req);
        return res.json({ success: true, data: await projectService.getAvailableProjects("PROJECT_BANK") });
    }

    async byId(req: Request, res: Response): Promise<Response> {
        auth(req);
        return res.json({ success: true, data: await projectService.getProjectById(String(req.params.projectId), req.user?.role) });
    }

    async update(req: Request, res: Response): Promise<Response> {
        const userId = auth(req);
        return res.json({ success: true, data: await projectService.updateProject(String(req.params.projectId), userId, req.user?.role, req.body) });
    }

    async hide(req: Request, res: Response): Promise<Response> {
        const userId = auth(req);
        return res.json({ success: true, data: await projectService.hideProject(String(req.params.projectId), userId, req.user?.role) });
    }
}

export = new ProjectController();
