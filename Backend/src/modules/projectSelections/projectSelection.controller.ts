import { Request, Response } from "express";
import projectSelectionService from "./projectSelection.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const requireAdmin = (req: Request) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
    if (req.user?.role !== "admin") throw new AppError("Only admin can manage selection periods", 403, ERROR_CODES.FORBIDDEN);
    return userId;
};

const requireAuth = (req: Request) => {
    if (!req.user?.userId) throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
};

class ProjectSelectionController {
    async createPhase(req: Request, res: Response): Promise<Response> {
        requireAdmin(req);
        return res.status(201).json({ success: true, data: await projectSelectionService.createPhase(req.body) });
    }

    async getCurrentPhase(req: Request, res: Response): Promise<Response> {
        requireAuth(req);
        return res.json({ success: true, data: await projectSelectionService.getCurrentPhase() });
    }

    async getAllPhases(req: Request, res: Response): Promise<Response> {
        requireAuth(req);
        return res.json({ success: true, data: await projectSelectionService.getAllPhases() });
    }

    async updatePhase(req: Request, res: Response): Promise<Response> {
        requireAdmin(req);
        return res.json({ success: true, data: await projectSelectionService.updatePhase(String(req.params.phaseId), req.body) });
    }
}

export = new ProjectSelectionController();
