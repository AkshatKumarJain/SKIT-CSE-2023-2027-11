import { Request, Response } from "express";
import projectApplicationService from "./projectApplication.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const requireAuthUser = (req: Request) => {
    if (!req.user?.userId || !req.user.role) {
        throw new AppError("Authentication information is required", 401, ERROR_CODES.UNAUTHORIZED);
    }
    return req.user;
};

const requireParam = (req: Request, name: string): string => {
    const value = req.params[name];
    if (typeof value !== "string" || !value) {
        throw new AppError(`${name} is required`, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return value;
};

const requireRole = (req: Request, role: "student" | "teacher" | "admin") => {
    const user = requireAuthUser(req);
    if (user.role !== role) {
        throw new AppError("You are not authorized for this action", 403, ERROR_CODES.FORBIDDEN);
    }
    return user;
};

class ProjectApplicationController {
    async createOwnIdea(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "student");
        const application = await projectApplicationService.createOwnIdeaApplication(user.userId, req.body);
        return res.status(201).json({ data: application, message: "Own Idea application submitted successfully" });
    }

    async applyForFacultyProject(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "student");
        const application = await projectApplicationService.applyForFacultyProject(user.userId, req.body);
        return res.status(201).json({ data: application, message: "Faculty project application submitted successfully" });
    }

    async applyForProjectBank(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "student");
        const application = await projectApplicationService.applyForProjectBank(user.userId, req.body);
        return res.status(201).json({ data: application, message: "Project bank application submitted successfully" });
    }

    async getMyApplications(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "student");
        const applications = await projectApplicationService.getStudentApplications(user.userId);
        return res.status(200).json({ data: applications, message: "Applications fetched successfully" });
    }

    async getAvailableTeamMembers(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "student");
        const members = await projectApplicationService.getAvailableTeamMembers(user.userId);
        return res.status(200).json({ data: members, message: "Available team members fetched successfully" });
    }

    async getAvailableMentors(req: Request, res: Response): Promise<Response> {
        requireRole(req, "student");
        const mentors = await projectApplicationService.getAvailableMentors();
        return res.status(200).json({ data: mentors, message: "Available mentors fetched successfully" });
    }

    async getAdminApplications(req: Request, res: Response): Promise<Response> {
        requireRole(req, "admin");
        const applications = await projectApplicationService.getAdminApplications();
        return res.status(200).json({ data: applications, message: "Admin applications fetched successfully" });
    }

    async adminApproval(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "admin");
        const { approved, comment } = req.body;
        const application = await projectApplicationService.adminApproval(requireParam(req, "applicationId"), user.userId, approved, comment);
        return res.status(200).json({ data: application, message: approved ? "Own Idea approved and sent to mentor" : "Application rejected by admin" });
    }

    async finalAdminApproval(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "admin");
        const { approved, comment } = req.body;
        const application = await projectApplicationService.finalAdminApproval(requireParam(req, "applicationId"), user.userId, approved, comment);
        return res.status(200).json({ data: application, message: approved ? "Project finally approved" : "Application rejected by admin" });
    }

    async getMentorApplications(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "teacher");
        const applications = await projectApplicationService.getMentorApplications(user.userId);
        return res.status(200).json({ data: applications, message: "Mentor applications fetched successfully" });
    }

    async mentorApproval(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "teacher");
        const { approved, comment } = req.body;
        const application = await projectApplicationService.mentorApproval(requireParam(req, "applicationId"), user.userId, approved, comment);
        return res.status(200).json({ data: application, message: approved ? "Mentor approval completed" : "Application rejected by mentor" });
    }

    async getFacultyApplications(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "teacher");
        const applications = await projectApplicationService.getFacultyApplications(user.userId);
        return res.status(200).json({ data: applications, message: "Faculty applications fetched successfully" });
    }

    async facultyApproval(req: Request, res: Response): Promise<Response> {
        const user = requireRole(req, "teacher");
        const { approved, comment } = req.body;
        const application = await projectApplicationService.facultyApproval(requireParam(req, "applicationId"), user.userId, approved, comment);
        return res.status(200).json({ data: application, message: approved ? "Faculty approval completed" : "Application rejected by faculty" });
    }

    async getApplicationById(req: Request, res: Response): Promise<Response> {
        const user = requireAuthUser(req);
        const application = await projectApplicationService.getApplicationById(requireParam(req, "applicationId"), user.userId, user.role!);
        return res.status(200).json({ data: application, message: "Application fetched successfully" });
    }
}

export = new ProjectApplicationController();
