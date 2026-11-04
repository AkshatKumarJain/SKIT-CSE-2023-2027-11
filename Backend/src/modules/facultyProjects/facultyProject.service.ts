import mongoose from "mongoose";
import projectModel from "../projects/project.model";
import projectApplicationModel from "../projectApplications/projectApplication.model";
import { ApplicationStatus } from "../projectApplications/projectApplication.type";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const fail = (message: string, status: number, code: string): never => {
  throw new AppError(message, status, code);
};

// Statuses reached only after the mentor/faculty has approved.
// Own idea: ADMIN_REVIEW -> MENTOR_REVIEW -> ADMIN_FINAL_REVIEW -> APPROVED
// Faculty project: FACULTY_REVIEW -> ADMIN_FINAL_REVIEW -> APPROVED
// Project bank: MENTOR_REVIEW -> ADMIN_FINAL_REVIEW -> APPROVED

const MENTORED_STATUSES: ApplicationStatus[] = ["ADMIN_FINAL_REVIEW", "APPROVED"];

class FacultyProjectsService {
  private getFacultyObjectId(facultyId: string) {
    if (!mongoose.isValidObjectId(facultyId)) {
      fail("Invalid authenticated faculty id", 401, ERROR_CODES.UNAUTHORIZED);
    }
    return new mongoose.Types.ObjectId(facultyId);
  }

  // GET /api/faculty-dashboard/uploaded-projects

  async getUploadedProjects(facultyId: string) {
    const facultyObjectId = this.getFacultyObjectId(facultyId);
    return projectModel
      .find({
        createdBy: facultyObjectId,
        source: "FACULTY_PROJECT",
      })
      .populate("createdBy", "name email")
      .populate("facultyId", "name email")
      .sort({ createdAt: -1 })
      .lean();
  }

  // GET /api/faculty-dashboard/mentored-projects
  // Only applications the faculty has ALREADY approved as mentor appear here.
  // Anything still waiting for that approval (ADMIN_REVIEW, MENTOR_REVIEW,
  // FACULTY_REVIEW) or rejected is excluded; those live in the approval queues
  // (/project-applications/mentor and /project-applications/faculty).

  async getMentoredProjects(facultyId: string) {
    const facultyObjectId = this.getFacultyObjectId(facultyId);
    return projectApplicationModel
      .find({
        mentorId: facultyObjectId,
        status: { $in: MENTORED_STATUSES },
      })
      .populate("projectId", "title domain description source visibilityStatus")
      .populate({
        path: "teamId",
        populate: [
          { path: "leaderId", select: "name email branch" },
          { path: "memberIds", select: "name email branch" },
        ],
      })
      .populate("studentId", "name email branch")
      .sort({ updatedAt: -1 })
      .lean();
  }
}

export default new FacultyProjectsService();