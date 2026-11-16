import { Request, Response, NextFunction } from "express";
import facultyProjectsService from "./facultyProject.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

class FacultyProjectsController {
  private getFacultyId(req: Request): string {
    const facultyId = req.user?.userId;

    if (!facultyId) {
      throw new AppError(
        "Authentication information is required",
        401,
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    if (req.user?.role !== "teacher") {
      throw new AppError(
        "Only faculty can access these projects",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    return facultyId;
  }

  uploadedProjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const facultyId = this.getFacultyId(req);

      const projects =
        await facultyProjectsService.getUploadedProjects(facultyId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  mentoredProjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const facultyId = this.getFacultyId(req);

      const projects =
        await facultyProjectsService.getMentoredProjects(facultyId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new FacultyProjectsController();
