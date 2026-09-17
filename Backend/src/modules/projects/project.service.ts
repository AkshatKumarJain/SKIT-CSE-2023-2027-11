import mongoose from "mongoose";
import projectModel from "./project.model";
import userModel from "../users/user.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { ProjectSource, ProjectVisibilityStatus } from "./project.type";

const teacherFields = "name email phoneNo";

const assertObjectId = (value: string, message: string): mongoose.Types.ObjectId => {
    if (!mongoose.isValidObjectId(value)) {
        throw new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return new mongoose.Types.ObjectId(value);
};

class ProjectService {
    async createProject(
        userId: string,
        role: string,
        data: {
            title: string;
            description: string;
            domain: string;
            sdgGoals?: string[];
            technologyStack?: string[];
            expectedOutcome?: string;
            source: "FACULTY_PROJECT" | "PROJECT_BANK";
            maxTeamSize?: number;
        }
    ) {
        const { title, description, domain, source } = data;

        if (!title?.trim() || !description?.trim() || !domain?.trim()) {
            throw new AppError("Title, description and domain are required", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        if (source !== "FACULTY_PROJECT" && source !== "PROJECT_BANK") {
            throw new AppError("Invalid project source", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        if (source === "FACULTY_PROJECT" && role !== "teacher") {
            throw new AppError("Only teachers can create faculty projects", 403, ERROR_CODES.FORBIDDEN);
        }

        if (source === "PROJECT_BANK" && role !== "admin") {
            throw new AppError("Only admins can create project bank projects", 403, ERROR_CODES.FORBIDDEN);
        }

        const maxTeamSize = data.maxTeamSize ?? 4;
        if (!Number.isInteger(maxTeamSize) || maxTeamSize < 1 || maxTeamSize > 4) {
            throw new AppError("Maximum team size must be between 1 and 4", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        let facultyId: mongoose.Types.ObjectId | null = null;
        if (source === "FACULTY_PROJECT") {
            facultyId = assertObjectId(userId, "Invalid authenticated user ID");
        }

        return projectModel.create({
            title: title.trim(),
            description: description.trim(),
            domain: domain.trim(),
            sdgGoals: data.sdgGoals ?? [],
            technologyStack: data.technologyStack ?? [],
            expectedOutcome: data.expectedOutcome ?? "",
            source,
            createdBy: assertObjectId(userId, "Invalid authenticated user ID"),
            facultyId,
            maxTeamSize,
            visibilityStatus: "AVAILABLE"
        });
    }

    async getAvailableProjects(source?: "FACULTY_PROJECT" | "PROJECT_BANK") {
        const filter: Record<string, unknown> = { visibilityStatus: "AVAILABLE" };
        if (source) filter.source = source;

        return projectModel.find(filter)
            .populate("createdBy", teacherFields)
            .populate("facultyId", teacherFields)
            .sort({ createdAt: -1 });
    }

    async getProjectsForRole(role: string, source?: "FACULTY_PROJECT" | "PROJECT_BANK") {
        if (role === "student") return this.getAvailableProjects(source);

        const filter: Record<string, unknown> = {};
        if (source) filter.source = source;
        return projectModel.find(filter)
            .populate("createdBy", teacherFields)
            .populate("facultyId", teacherFields)
            .sort({ createdAt: -1 });
    }

    async getProjectById(projectId: string, role: string) {
        if (!mongoose.isValidObjectId(projectId)) {
            throw new AppError("Invalid project ID", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const project = await projectModel.findById(projectId)
            .populate("createdBy", teacherFields)
            .populate("facultyId", teacherFields);

        if (!project) throw new AppError("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);

        if (role === "student" && project.visibilityStatus !== "AVAILABLE") {
            throw new AppError("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
        }

        return project;
    }

    async updateProject(
        projectId: string,
        userId: string,
        role: string,
        data: Partial<Pick<IProjectInput, "title" | "description" | "domain" | "sdgGoals" | "technologyStack" | "expectedOutcome" | "maxTeamSize" | "visibilityStatus">>
    ) {
        if (!mongoose.isValidObjectId(projectId)) {
            throw new AppError("Invalid project ID", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const project = await projectModel.findById(projectId);
        if (!project) throw new AppError("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);

        const isOwner = project.createdBy.toString() === userId;
        if (role !== "admin" && !isOwner) {
            throw new AppError("You are not allowed to update this project", 403, ERROR_CODES.FORBIDDEN);
        }

        if (data.maxTeamSize !== undefined && (!Number.isInteger(data.maxTeamSize) || data.maxTeamSize < 1 || data.maxTeamSize > 4)) {
            throw new AppError("Maximum team size must be between 1 and 4", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        if (data.visibilityStatus === "RESERVED" || data.visibilityStatus === "ALLOCATED") {
            throw new AppError("Workflow-managed project visibility cannot be set manually", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        Object.assign(project, data);
        return project.save();
    }

    async hideProject(projectId: string, userId: string, role: string) {
        return this.updateProject(projectId, userId, role, { visibilityStatus: "HIDDEN" });
    }

    async reserveAvailableProject(projectId: string, source: ProjectSource) {
        if (!mongoose.isValidObjectId(projectId)) {
            throw new AppError("Invalid project ID", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const project = await projectModel.findOneAndUpdate(
            {
                _id: projectId,
                source,
                visibilityStatus: "AVAILABLE"
            },
            { $set: { visibilityStatus: "RESERVED" } },
            { new: true }
        );

        if (!project) {
            throw new AppError("Project is no longer available", 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
        }

        return project;
    }

    async releaseProject(projectId: mongoose.Types.ObjectId | null | undefined) {
        if (!projectId) return;
        await projectModel.findOneAndUpdate(
            { _id: projectId, visibilityStatus: "RESERVED" },
            { $set: { visibilityStatus: "AVAILABLE" } }
        );
    }

    async allocateProject(projectId: mongoose.Types.ObjectId | null | undefined) {
        if (!projectId) return;
        const updated = await projectModel.findOneAndUpdate(
            { _id: projectId, visibilityStatus: "RESERVED" },
            { $set: { visibilityStatus: "ALLOCATED" } },
            { new: true }
        );
        if (!updated) {
            throw new AppError("Reserved project could not be allocated", 409, ERROR_CODES.ALLOCATION_FAILED);
        }
    }
}

type IProjectInput = {
    title: string;
    description: string;
    domain: string;
    sdgGoals: string[];
    technologyStack: string[];
    expectedOutcome?: string;
    maxTeamSize: number;
    visibilityStatus: ProjectVisibilityStatus;
};

export = new ProjectService();
