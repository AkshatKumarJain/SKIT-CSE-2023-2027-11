import { Request, Response } from "express";
import projectSelectionService from "./projectSelection.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const requireParam = (req: Request, name: string): string => {
    const value = req.params[name];
    if (typeof value !== "string" || !value) {
        throw new AppError(`${name} is required`, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return value;
};

const requireAdmin = (req: Request) => {
    if (!req.user?.userId) throw new AppError("Authentication is required", 401, ERROR_CODES.UNAUTHORIZED);
    if (req.user.role !== "admin") throw new AppError("Only admin can manage selection periods", 403, ERROR_CODES.FORBIDDEN);
    return req.user.userId;
};

class ProjectSelectionController {
    async createPhase(req: Request, res: Response): Promise<Response> {
        requireAdmin(req);
        const phase = await projectSelectionService.createPhase(req.body);
        return res.status(201).json({ message: "Project selection phase created successfully", data: phase });
    }

    async getCurrentPhase(req: Request, res: Response): Promise<Response> {
        if (!req.user?.userId) throw new AppError("Authentication is required", 401, ERROR_CODES.UNAUTHORIZED);
        const phase = await projectSelectionService.getCurrentPhase();
        return res.status(200).json({ message: "Current project selection phase fetched", data: phase });
    }

    async getAllPhases(req: Request, res: Response): Promise<Response> {
        if (!req.user?.userId) throw new AppError("Authentication is required", 401, ERROR_CODES.UNAUTHORIZED);
        const phases = await projectSelectionService.getAllPhases();
        return res.status(200).json({ message: "Selection phases fetched successfully", data: phases });
    }

    async updatePhase(req: Request, res: Response): Promise<Response> {
        requireAdmin(req);
        const phase = await projectSelectionService.updatePhase(requireParam(req, "phaseId"), req.body);
        return res.status(200).json({ message: "Selection phase updated successfully", data: phase });
    }
}

export = new ProjectSelectionController();
