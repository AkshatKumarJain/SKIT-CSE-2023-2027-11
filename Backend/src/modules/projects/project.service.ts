import mongoose from "mongoose";
import projectModel from "./project.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const fail = (message: string, status: number, code: string): never => {
  throw new AppError(message, status, code);
};

type ListInput = string[] | string | undefined;

// Accepts an array of strings or a comma/newline separated string and returns a
// clean string[]; undefined means "not provided".
const cleanList = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,]/)
      : null;
  if (!items || items.some((item) => typeof item !== "string"))
    return fail(
      "specificFunctionalities, sdgGoals and technologies must be lists of text",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  return (items as string[]).map((item) => item.trim()).filter(Boolean);
};

const cleanTeamSize = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  const size = Number(value);
  if (!Number.isInteger(size) || size < 2 || size > 4)
    return fail(
      "maxTeamSize must be a whole number between 2 and 4",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  return size;
};

class ProjectService {
  async createProject(
    userId: string,
    role: string | undefined,
    data: {
      title?: string;
      domain?: string;
      description?: string;
      specificFunctionalities?: ListInput;
      sdgGoals?: ListInput;
      technologies?: ListInput;
      source?: "FACULTY_PROJECT" | "PROJECT_BANK";
      maxTeamSize?: number;
    },
  ) {
    const source = data.source;
    if (
      !source ||
      (source !== "FACULTY_PROJECT" && source !== "PROJECT_BANK")
    ) {
      fail(
        "Only FACULTY_PROJECT or PROJECT_BANK can be created through this API",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    const title = data.title?.trim();
    const domain = data.domain?.trim();
    const description = data.description?.trim();
    if (!title || !domain || !description) {
      fail(
        "Title, domain and description are required",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    if (source === "FACULTY_PROJECT" && role !== "teacher") {
      fail(
        "Only faculty can create faculty projects",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
    if (source === "PROJECT_BANK" && role !== "admin") {
      fail(
        "Only admin can create project bank projects",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
    const specificFunctionalities = cleanList(data.specificFunctionalities);
    const sdgGoals = cleanList(data.sdgGoals);
    const technologies = cleanList(data.technologies);
    const maxTeamSize = cleanTeamSize(data.maxTeamSize);
    // Faculty project: the creating faculty is the approver.
    // Project Bank project: admin does not pick a faculty; the student picks a
    // mentor when applying, so facultyId stays null.
    const facultyId: string | null =
      source === "FACULTY_PROJECT" ? userId : null;

    return projectModel.create({
      title: title!,
      domain: domain!,
      description: description!,
      specificFunctionalities: specificFunctionalities ?? [],
      sdgGoals: sdgGoals ?? [],
      technologies: technologies ?? [],
      source: source!,
      createdBy: userId,
      facultyId,
      maxTeamSize: maxTeamSize ?? 4,
      visibilityStatus: "AVAILABLE",
    });
  }

  // Admin uploads many Project Bank projects at once (rows parsed from an Excel
  // sheet). All-or-nothing: if any row is invalid nothing is inserted.
  async createProjectsBulk(
    userId: string,
    role: string | undefined,
    rows: unknown,
  ) {
    if (role !== "admin")
      fail(
        "Only admin can upload project bank projects",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    if (!Array.isArray(rows) || rows.length === 0)
      fail(
        "projects must be a non-empty array",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    const docs: Record<string, unknown>[] = [];
    const errors: string[] = [];
    (rows as unknown[]).forEach((raw, index) => {
      try {
        const row = (raw ?? {}) as Record<string, unknown>;
        const text = (value: unknown) =>
          typeof value === "string" ? value.trim() : "";
        const title = text(row.title);
        const domain = text(row.domain);
        const description = text(row.description);
        if (!title || !domain || !description)
          fail(
            "title, domain and description are required",
            400,
            ERROR_CODES.VALIDATION_ERROR,
          );
        docs.push({
          title,
          domain,
          description,
          specificFunctionalities: cleanList(row.specificFunctionalities) ?? [],
          sdgGoals: cleanList(row.sdgGoals) ?? [],
          technologies: cleanList(row.technologies) ?? [],
          source: "PROJECT_BANK",
          createdBy: userId,
          facultyId: null,
          maxTeamSize: cleanTeamSize(row.maxTeamSize) ?? 4,
          visibilityStatus: "AVAILABLE",
        });
      } catch (error) {
        errors.push(
          `Row ${index + 1}: ${error instanceof Error ? error.message : "invalid row"}`,
        );
      }
    });
    if (errors.length)
      fail(errors.join("; "), 400, ERROR_CODES.VALIDATION_ERROR);
    return projectModel.insertMany(docs);
  }

  async getAvailableProjects(source?: "FACULTY_PROJECT" | "PROJECT_BANK") {
    const filter: {
      visibilityStatus: "AVAILABLE";
      source?: "FACULTY_PROJECT" | "PROJECT_BANK";
    } = {
      visibilityStatus: "AVAILABLE",
    };
    if (source) filter.source = source;
    return projectModel
      .find(filter)
      .populate("createdBy", "name email phoneNo department")
      .populate("facultyId", "name email phoneNo department")
      .sort({ createdAt: -1 });
  }

  async getProjects(userRole: string | undefined) {
    if (userRole === "student") return this.getAvailableProjects();
    return projectModel
      .find()
      .populate("createdBy", "name email phoneNo department")
      .populate("facultyId", "name email phoneNo department")
      .sort({ createdAt: -1 });
  }

  async getProjectById(projectId: string, userRole: string | undefined) {
    if (!mongoose.isValidObjectId(projectId)) {
      fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    const project = await projectModel
      .findById(projectId)
      .populate("createdBy", "name email phoneNo department")
      .populate("facultyId", "name email phoneNo department");
    if (!project) fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
    const validProject = project!;
    if (
      userRole === "student" &&
      validProject.visibilityStatus !== "AVAILABLE"
    ) {
      fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
    }
    return validProject;
  }

  async updateProject(
    projectId: string,
    userId: string,
    role: string | undefined,
    data: {
      title?: string;
      domain?: string;
      description?: string;
      specificFunctionalities?: ListInput;
      sdgGoals?: ListInput;
      technologies?: ListInput;
      maxTeamSize?: number;
    },
  ) {
    if (!mongoose.isValidObjectId(projectId))
      fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
    const project = await projectModel.findById(projectId);
    if (!project) fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
    const validProject = project!;
    const owner = validProject.createdBy.toString() === userId;
    if (role !== "admin" && !owner)
      fail(
        "You are not allowed to update this project",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    if (validProject.visibilityStatus === "ALLOCATED")
      fail(
        "Allocated projects cannot be edited",
        409,
        ERROR_CODES.PROJECT_ALREADY_ALLOCATED,
      );
    // Whitelist: never let the request body change source, visibilityStatus,
    // createdBy or facultyId (the old Object.assign allowed all of them).
    for (const field of ["title", "domain", "description"] as const) {
      const value = data[field];
      if (value === undefined) continue;
      const text = typeof value === "string" ? value.trim() : "";
      if (!text)
        fail(`${field} cannot be empty`, 400, ERROR_CODES.VALIDATION_ERROR);
      validProject[field] = text;
    }
    const specificFunctionalities = cleanList(data.specificFunctionalities);
    const sdgGoals = cleanList(data.sdgGoals);
    const technologies = cleanList(data.technologies);
    const maxTeamSize = cleanTeamSize(data.maxTeamSize);
    if (specificFunctionalities)
      validProject.specificFunctionalities = specificFunctionalities;
    if (sdgGoals) validProject.sdgGoals = sdgGoals;
    if (technologies) validProject.technologies = technologies;
    if (maxTeamSize !== undefined) validProject.maxTeamSize = maxTeamSize;
    return validProject.save();
  }

  async hideProject(
    projectId: string,
    userId: string,
    role: string | undefined,
  ) {
    if (!mongoose.isValidObjectId(projectId))
      fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
    const project = await projectModel.findById(projectId);
    if (!project) fail("Project not found", 404, ERROR_CODES.PROJECT_NOT_FOUND);
    const validProject = project!;
    if (role !== "admin" && validProject.createdBy.toString() !== userId) {
      fail(
        "You are not allowed to hide this project",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
    if (
      validProject.visibilityStatus === "RESERVED" ||
      validProject.visibilityStatus === "ALLOCATED"
    ) {
      fail(
        "Reserved or allocated projects cannot be hidden",
        409,
        ERROR_CODES.PROJECT_NOT_AVAILABLE,
      );
    }
    validProject.visibilityStatus = "HIDDEN";
    return validProject.save();
  }

  async reserveProject(
    projectId: string,
    source: "FACULTY_PROJECT" | "PROJECT_BANK",
  ) {
    if (!mongoose.isValidObjectId(projectId))
      fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
    const project = await projectModel.findOneAndUpdate(
      { _id: projectId, source, visibilityStatus: "AVAILABLE" },
      { $set: { visibilityStatus: "RESERVED" } },
      { new: true },
    );
    if (!project)
      fail(
        "Project is no longer available",
        409,
        ERROR_CODES.PROJECT_NOT_AVAILABLE,
      );
    return project!;
  }

  async releaseProject(projectId: mongoose.Types.ObjectId | string) {
    await projectModel.updateOne(
      { _id: projectId, visibilityStatus: "RESERVED" },
      { $set: { visibilityStatus: "AVAILABLE" } },
    );
  }

  async allocateProject(projectId: mongoose.Types.ObjectId | string) {
    const project = await projectModel.findOneAndUpdate(
      { _id: projectId, visibilityStatus: "RESERVED" },
      { $set: { visibilityStatus: "ALLOCATED" } },
      { new: true },
    );
    if (!project)
      fail(
        "Reserved project could not be allocated",
        409,
        ERROR_CODES.PROJECT_NOT_AVAILABLE,
      );
    return project!;
  }

  async createOwnIdeaProject(data: {
    title: string;
    domain: string;
    description: string;
    specificFunctionalities?: string[];
    sdgGoals?: string[];
    technologies?: string[];
    createdBy: string;
    mentorId: string;
  }) {
    return projectModel.create({
      title: data.title,
      domain: data.domain,
      description: data.description,
      specificFunctionalities: data.specificFunctionalities ?? [],
      sdgGoals: data.sdgGoals ?? [],
      technologies: data.technologies ?? [],
      source: "OWN_IDEA",
      createdBy: data.createdBy,
      facultyId: null,
      maxTeamSize: 4,
      visibilityStatus: "ALLOCATED",
    });
  }
}

export = new ProjectService();
