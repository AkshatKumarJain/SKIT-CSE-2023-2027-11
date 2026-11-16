
import mongoose from "mongoose";
import projectApplicationService from "../projectApplication.service";
import projectApplicationModel from "../projectApplication.model";
import userModel from "../../users/user.model";

jest.mock("../projectApplication.model", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("../../users/user.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const teacherId = new mongoose.Types.ObjectId().toString();
const otherTeacherId = new mongoose.Types.ObjectId().toString();
const applicationId = new mongoose.Types.ObjectId().toString();

const mockUser = userModel as jest.Mocked<typeof userModel>;
const mockApplication = projectApplicationModel as jest.Mocked<
  typeof projectApplicationModel
>;

describe("Teacher / Faculty Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockUser.findOne as jest.Mock).mockResolvedValue({
      _id: teacherId,
      role: "teacher",
    });
  });

  describe("getFacultyApplications()", () => {
    test("should verify teacher before fetching applications", async () => {
      const query: any = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };

      (mockApplication.find as jest.Mock).mockReturnValue(query);

      await projectApplicationService.getFacultyApplications(teacherId);

      expect(mockUser.findOne).toHaveBeenCalledWith({
        _id: teacherId,
        role: "teacher",
      });

      expect(mockApplication.find).toHaveBeenCalledWith({
        facultyId: teacherId,
        status: "FACULTY_REVIEW",
      });
    });

    test("should reject access when teacher does not exist", async () => {
      (mockUser.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        projectApplicationService.getFacultyApplications(teacherId)
      ).rejects.toThrow("Teacher not found");

      expect(mockApplication.find).not.toHaveBeenCalled();
    });
  });

  describe("facultyApproval()", () => {
    test("should reject approval if application does not exist", async () => {
      (mockApplication.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        projectApplicationService.facultyApproval(
          applicationId,
          teacherId,
          { approved: true }
        )
      ).rejects.toThrow("Application not found");
    });

    test("should reject application in an incorrect stage", async () => {
      (mockApplication.findById as jest.Mock).mockResolvedValue({
        _id: applicationId,
        status: "MENTOR_REVIEW",
        facultyId: teacherId,
      });

      await expect(
        projectApplicationService.facultyApproval(
          applicationId,
          teacherId,
          { approved: true }
        )
      ).rejects.toThrow(
        "Application is not awaiting faculty approval"
      );
    });

    test("should prevent another teacher from approving the application", async () => {
      (mockApplication.findById as jest.Mock).mockResolvedValue({
        _id: applicationId,
        status: "FACULTY_REVIEW",
        facultyId: otherTeacherId,
      });

      await expect(
        projectApplicationService.facultyApproval(
          applicationId,
          teacherId,
          { approved: true }
        )
      ).rejects.toThrow(
        "Only the assigned faculty can approve this application"
      );
    });

    test("should reject invalid approval input", async () => {
      const application: any = {
        _id: applicationId,
        status: "FACULTY_REVIEW",
        facultyId: teacherId,
        approvalHistory: [],
        save: jest.fn(),
      };

      (mockApplication.findById as jest.Mock)
        .mockResolvedValueOnce(application)
        .mockResolvedValueOnce(application);

      await expect(
        projectApplicationService.facultyApproval(
          applicationId,
          teacherId,
          {}
        )
      ).rejects.toThrow("approved must be true or false");
    });
  });
});
