import mongoose from "mongoose";
import projectModel from "./project.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import userModel from "../users/user.model";

const fail = (message: string, status: number, code: string): never => {
    throw new AppError(message, status, code);
};

class ProjectService {
    async createProject(
        userId: string,
        role: string | undefined,
        data: {
            title?: string;
            domain?: string;
            problemStatement?: string;
            description?: string;
            expectedOutcome?: string;
            sdgGoals?: string[];
            technologyStack?: string[];
            source?: "FACULTY_PROJECT" | "PROJECT_BANK";
            maxTeamSize?: number;
            facultyId?: string;
        }
    ) {
        const source = data.source;
        if (!source || (source !== "FACULTY_PROJECT" && source !== "PROJECT_BANK")) {
            fail("Only FACULTY_PROJECT or PROJECT_BANK can be created through this API", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        const title = data.title?.trim();
        const domain = data.domain?.trim();
        const description = data.description?.trim();
        if (!title || !domain || !description) {
            fail("Title, domain and description are required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        if (source === "FACULTY_PROJECT" && role !== "teacher") {
            fail("Only faculty can create faculty projects", 403, ERROR_CODES.FORBIDDEN);
        }
        if (source === "PROJECT_BANK" && role !== "admin") {
            fail("Only admin can create project bank projects", 403, ERROR_CODES.FORBIDDEN);
        }
        let facultyId: string | null = source === "FACULTY_PROJECT" ? userId : null;
        if (source === "PROJECT_BANK") {
            const assignedFacultyId = data.facultyId;
            if (!assignedFacultyId || !mongoose.isValidObjectId(assignedFacultyId)) {
                fail("Project Bank projects require an assigned faculty approver", 400, ERROR_CODES.TEACHER_NOT_FOUND);
            }
            const faculty = await userModel.findOne({ _id: assignedFacultyId!, role: "teacher" });
            if (!faculty) fail("Assigned faculty approver was not found", 404, ERROR_CODES.TEACHER_NOT_FOUND);
            facultyId = assignedFacultyId!;
        }

        return projectModel.create({
            title: title!,
            domain: domain!,
            problemStatement: data.problemStatement?.trim() ?? "",
            description: description!,
            expectedOutcome: data.expectedOutcome?.trim() ?? "",
            sdgGoals: data.sdgGoals ?? [],
            technologyStack: data.technologyStack ?? [],
            source: source!,
            createdBy: userId,
            facultyId,
            maxTeamSize: data.maxTeamSize ?? 4,
            visibilityStatus: "AVAILABLE"
        });
    }

    async getAvailableProjects(source?: "FACULTY_PROJECT" | "PROJECT_BANK") {
        const filter: { visibilityStatus: "AVAILABLE"; source?: "FACULTY_PROJECT" | "PROJECT_BANK" } = {
            visibilityStatus: "AVAILABLE"
        };
        if (source) filter.source = source;
        return projectModel.find(filter)
            .populate("createdBy", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .sort({ createdAt: -1 });
    }

    async getProjects(userRole: string | undefined) {
        if (userRole === "student") return this.getAvailableProjects();
        return projectModel.find()
            .populate("createdBy", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .sort({ createdAt: -1 });
    }

    async getProjectById(projectId: string, userRole: string | undefined) {
        if (!mongoose.isValidObjectId(projectId)) {
            fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        const project = await projectModel.findById(projectId)
            .populate("createdBy", "name email phoneNo")
            .populate("facultyId", "name email phoneNo");
        if (!project) fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
        const validProject = project!;
        if (userRole === "student" && validProject.visibilityStatus !== "AVAILABLE") {
            fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
        }
        return validProject;
    }

    async updateProject(projectId: string, userId: string, role: string | undefined, data: {
        title?: string;
        domain?: string;
        problemStatement?: string;
        description?: string;
        expectedOutcome?: string;
        sdgGoals?: string[];
        technologyStack?: string[];
        maxTeamSize?: number;
    }) {
        if (!mongoose.isValidObjectId(projectId)) fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
        const project = await projectModel.findById(projectId);
        if (!project) fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
        const validProject = project!;
        const owner = validProject.createdBy.toString() === userId;
        if (role !== "admin" && !owner) fail("You are not allowed to update this project", 403, ERROR_CODES.FORBIDDEN);
        if (validProject.visibilityStatus === "ALLOCATED") fail("Allocated projects cannot be edited", 409, ERROR_CODES.PROJECT_ALREADY_ALLOCATED);
        Object.assign(validProject, data);
        return validProject.save();
    }

    async hideProject(projectId: string, userId: string, role: string | undefined) {
        if (!mongoose.isValidObjectId(projectId)) fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
        const project = await projectModel.findById(projectId);
        if (!project) fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
        const validProject = project!;
        if (role !== "admin" && validProject.createdBy.toString() !== userId) {
            fail("You are not allowed to hide this project", 403, ERROR_CODES.FORBIDDEN);
        }
        if (validProject.visibilityStatus === "RESERVED" || validProject.visibilityStatus === "ALLOCATED") {
            fail("Reserved or allocated projects cannot be hidden", 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
        }
        validProject.visibilityStatus = "HIDDEN";
        return validProject.save();
    }

    async reserveProject(projectId: string, source: "FACULTY_PROJECT" | "PROJECT_BANK") {
        if (!mongoose.isValidObjectId(projectId)) fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
        const project = await projectModel.findOneAndUpdate(
            { _id: projectId, source, visibilityStatus: "AVAILABLE" },
            { $set: { visibilityStatus: "RESERVED" } },
            { new: true }
        );
        if (!project) fail("Project is no longer available", 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
        return project!;
    }

    async releaseProject(projectId: mongoose.Types.ObjectId | string) {
        await projectModel.updateOne(
            { _id: projectId, visibilityStatus: "RESERVED" },
            { $set: { visibilityStatus: "AVAILABLE" } }
        );
    }

    async allocateProject(projectId: mongoose.Types.ObjectId | string) {
        const project = await projectModel.findOneAndUpdate(
            { _id: projectId, visibilityStatus: "RESERVED" },
            { $set: { visibilityStatus: "ALLOCATED" } },
            { new: true }
        );
        if (!project) fail("Reserved project could not be allocated", 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
        return project!;
    }

    async createOwnIdeaProject(data: {
        title: string;
        domain: string;
        problemStatement: string;
        description: string;
        expectedOutcome?: string;
        sdgGoals?: string[];
        technologyStack?: string[];
        createdBy: string;
        mentorId: string;
    }) {
        return projectModel.create({
            title: data.title,
            domain: data.domain,
            problemStatement: data.problemStatement,
            description: data.description,
            expectedOutcome: data.expectedOutcome ?? "",
            sdgGoals: data.sdgGoals ?? [],
            technologyStack: data.technologyStack ?? [],
            source: "OWN_IDEA",
            createdBy: data.createdBy,
            facultyId: null,
            maxTeamSize: 4,
            visibilityStatus: "ALLOCATED"
        });
    }
}

export = new ProjectService();
