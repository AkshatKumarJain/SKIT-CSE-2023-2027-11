import { Request, Response } from "express";
import projectPPTService from "./projectPPT.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const authenticatedUser = (req: Request) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
    return userId;
};

const requireRole = (
    req: Request,
    role: "student" | "teacher" | "admin" | "lab_coordinator",
) => {
    const userId = authenticatedUser(req);
    if (req.user?.role !== role)
        throw new AppError(`Only ${role} users can perform this action`, 403, ERROR_CODES.FORBIDDEN);
    return userId;
};

class ProjectPPTController {
    async submitOrRevise(req: Request, res: Response): Promise<Response> {
        const studentId = requireRole(req, "student");
        return res.status(201).json({
            success: true,
            message: "PPT uploaded successfully and sent for mentor review",
            data: await projectPPTService.submitOrRevise(studentId, req.body),
        });
    }

    async myPPTs(req: Request, res: Response): Promise<Response> {
        const studentId = requireRole(req, "student");
        return res.json({ success: true, data: await projectPPTService.getMyPPTs(studentId) });
    }

    async mentorQueue(req: Request, res: Response): Promise<Response> {
        const mentorId = requireRole(req, "teacher");
        return res.json({ success: true, data: await projectPPTService.getMentorQueue(mentorId) });
    }

    async mentorReview(req: Request, res: Response): Promise<Response> {
        const mentorId = requireRole(req, "teacher");
        return res.json({
            success: true,
            message: "Mentor review submitted",
            data: await projectPPTService.mentorReview(String(req.params.pptId), mentorId, req.body),
        });
    }

    async coordinatorQueue(req: Request, res: Response): Promise<Response> {
        requireRole(req, "lab_coordinator");
        return res.json({ success: true, data: await projectPPTService.getCoordinatorQueue() });
    }

    async coordinatorReview(req: Request, res: Response): Promise<Response> {
        const coordinatorId = requireRole(req, "lab_coordinator");
        return res.json({
            success: true,
            message: "Coordinator review submitted",
            data: await projectPPTService.coordinatorReview(String(req.params.pptId), coordinatorId, req.body),
        });
    }

    async adminApproved(req: Request, res: Response): Promise<Response> {
        requireRole(req, "admin");
        return res.json({ success: true, data: await projectPPTService.getAdminApprovedPPTs() });
    }

    async byId(req: Request, res: Response): Promise<Response> {
        const userId = authenticatedUser(req);
        return res.json({
            success: true,
            data: await projectPPTService.getById(String(req.params.pptId), userId, req.user?.role),
        });
    }
}

export = new ProjectPPTController();
