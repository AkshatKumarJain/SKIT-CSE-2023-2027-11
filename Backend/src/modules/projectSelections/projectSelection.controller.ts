import { Request, Response } from "express";

import projectSelectionService from "./projectSelection.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const requireAdmin = (req: Request) => {
  if (!req.user?.userId)
    throw new AppError(
      "Authentication information is required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  if (req.user.role !== "admin")
    throw new AppError(
      "Only admin can manage project selection phases",
      403,
      ERROR_CODES.FORBIDDEN,
    );
};

class ProjectSelectionController {
  // CREATE PHASE

  async createPhase(req: Request, res: Response): Promise<Response> {
    requireAdmin(req);
    const phase = await projectSelectionService.createPhase(req.body);

    return res.status(201).json({
      success: true,
      message: "Project selection phase created successfully",

      data: phase,
    });
  }

  // CURRENT PHASE

  async getCurrentPhase(req: Request, res: Response): Promise<Response> {
    const phase = await projectSelectionService.getCurrentPhase();

    return res.status(200).json({
      success: true,
      message: "Current project selection phase fetched",

      data: phase,
    });
  }

  // ALL PHASES

  async getAllPhases(req: Request, res: Response): Promise<Response> {
    const phases = await projectSelectionService.getAllPhases();

    return res.status(200).json({
      success: true,
      message: "Selection phases fetched successfully",

      data: phases,
    });
  }

  // UPDATE PHASE

  async updatePhase(req: Request, res: Response): Promise<Response> {
    requireAdmin(req);
    const phase = await projectSelectionService.updatePhase(
      String(req.params.phaseId),
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Selection phase updated successfully",

      data: phase,
    });
  }
}

export = new ProjectSelectionController();
