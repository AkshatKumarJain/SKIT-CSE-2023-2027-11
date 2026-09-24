import { Request, Response } from "express";
import projectApplicationService from "./projectApplication.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const user = (req: Request) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
    return userId;
};

const requireRole = (req: Request, role: "student" | "teacher" | "admin") => {
    const userId = user(req);
    if (req.user?.role !== role) throw new AppError(`Only ${role} users can perform this action`, 403, ERROR_CODES.FORBIDDEN);
    return userId;
};

class ProjectApplicationController {
    async createOwnIdea(req: Request, res: Response): Promise<Response> {
        const studentId = requireRole(req, "student");
        const application = await projectApplicationService.createOwnIdeaApplication(studentId, req.body);
        return res.status(201).json({ success: true, data: application, message: "Own Idea application submitted successfully" });
    }

    async applyForFacultyProject(req: Request, res: Response): Promise<Response> {
        const studentId = requireRole(req, "student");
        const application = await projectApplicationService.applyForFacultyProject(studentId, req.body);
        return res.status(201).json({ success: true, data: application, message: "Faculty project application submitted successfully" });
    }

    async applyForProjectBank(req: Request, res: Response): Promise<Response> {
        const studentId = requireRole(req, "student");
        const application = await projectApplicationService.applyForProjectBank(studentId, req.body);
        return res.status(201).json({ success: true, data: application, message: "Project Bank application submitted successfully" });
    }

    async getMyApplications(req: Request, res: Response): Promise<Response> {
        const studentId = requireRole(req, "student");
        return res.json({ success: true, data: await projectApplicationService.getMyApplications(studentId) });
    }

    async getAvailableMentors(req: Request, res: Response): Promise<Response> {
        requireRole(req, "student");
        return res.json({ success: true, data: await projectApplicationService.getAvailableMentors() });
    }

    async getApplicationById(req: Request, res: Response): Promise<Response> {
        const userId = user(req);
        return res.json({ success: true, data: await projectApplicationService.getApplicationById(String(req.params.applicationId), userId, req.user?.role) });
    }

    async getAdminApplications(req: Request, res: Response): Promise<Response> {
        requireRole(req, "admin");
        return res.json({ success: true, data: await projectApplicationService.getAvailableApplicationsForAdmin() });
    }

    async adminApproval(req: Request, res: Response): Promise<Response> {
        const adminId = requireRole(req, "admin");
        return res.json({ success: true, data: await projectApplicationService.adminApproval(String(req.params.applicationId), adminId, req.body) });
    }

    async mentorApplications(req: Request, res: Response): Promise<Response> {
        const mentorId = requireRole(req, "teacher");
        return res.json({ success: true, data: await projectApplicationService.getMentorApplications(mentorId) });
    }

    async mentorApproval(req: Request, res: Response): Promise<Response> {
        const mentorId = requireRole(req, "teacher");
        return res.json({ success: true, data: await projectApplicationService.mentorApproval(String(req.params.applicationId), mentorId, req.body) });
    }

    async facultyApplications(req: Request, res: Response): Promise<Response> {
        const facultyId = requireRole(req, "teacher");
        return res.json({ success: true, data: await projectApplicationService.getFacultyApplications(facultyId) });
    }

    async facultyApproval(req: Request, res: Response): Promise<Response> {
        const facultyId = requireRole(req, "teacher");
        return res.json({ success: true, data: await projectApplicationService.facultyApproval(String(req.params.applicationId), facultyId, req.body) });
    }

    async finalAdminApproval(req: Request, res: Response): Promise<Response> {
        const adminId = requireRole(req, "admin");
        return res.json({ success: true, data: await projectApplicationService.finalAdminApproval(String(req.params.applicationId), adminId, req.body) });
    }
}

export = new ProjectApplicationController();
