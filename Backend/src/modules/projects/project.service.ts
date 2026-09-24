import projectModel from "./project.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

class ProjectService {

    // Create project
    async createProject(data: any, userId: string) {

        const project = await projectModel.create({
            ...data,
            createdBy: userId
        });

        return project;
    }


    // Get available projects
    async getAvailableProjects(source?: string) {

        const query: any = {
            visibilityStatus: "AVAILABLE"
        };

        if (source) {
            query.source = source;
        }

        const projects = await projectModel
            .find(query)
            .populate("facultyId", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return projects;
    }


    // Get project by ID
    async getProjectById(projectId: string) {

        const project = await projectModel
            .findById(projectId)
            .populate("facultyId", "name email")
            .populate("createdBy", "name email");

        if (!project) {
            throw new AppError(
                "Project not found",
                404,
                ERROR_CODES.NOT_FOUND
            );
        }

        return project;
    }


    // Get faculty projects
    async getFacultyProjects() {

        return await projectModel
            .find({
                source: "FACULTY_PROJECT",
                visibilityStatus: "AVAILABLE"
            })
            .populate("facultyId", "name email")
            .sort({ createdAt: -1 });
    }


    // Get project bank
    async getProjectBank() {

        return await projectModel
            .find({
                source: "PROJECT_BANK",
                visibilityStatus: "AVAILABLE"
            })
            .populate("facultyId", "name email")
            .sort({ createdAt: -1 });
    }


    // Update project
    async updateProject(
        projectId: string,
        data: any
    ) {

        const project = await projectModel.findByIdAndUpdate(
            projectId,
            data,
            {
                new: true,
                runValidators: true
            }
        );

        if (!project) {
            throw new AppError(
                "Project not found",
                404,
                ERROR_CODES.NOT_FOUND
            );
        }

        return project;
    }


    // Hide project
    async hideProject(projectId: string) {

        const project = await projectModel.findByIdAndUpdate(
            projectId,
            {
                visibilityStatus: "HIDDEN"
            },
            {
                new: true
            }
        );

        if (!project) {
            throw new AppError(
                "Project not found",
                404,
                ERROR_CODES.NOT_FOUND
            );
        }

        return project;
    }
}

export = new ProjectService();