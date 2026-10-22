import mongoose from "mongoose";
import projectModel from "../projects/project.model";
import projectApplicationModel from "../projectApplications/projectApplication.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const fail = (message: string, status: number, code: string): never => {
  throw new AppError(message, status, code);
};

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
  async getMentoredProjects(facultyId: string) {
    const facultyObjectId = this.getFacultyObjectId(facultyId);
    return projectApplicationModel
      .find({ mentorId: facultyObjectId })
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
