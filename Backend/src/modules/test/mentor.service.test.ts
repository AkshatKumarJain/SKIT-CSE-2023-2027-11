
import mongoose from "mongoose";
import projectApplicationService from "../projectApplication.service";
import projectApplicationModel from "../projectApplication.model";
import userModel from "../../users/user.model";

jest.mock("../projectApplication.model", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock("../../users/user.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const mentorId = new mongoose.Types.ObjectId().toString();
const anotherMentorId = new mongoose.Types.ObjectId().toString();
const applicationId = new mongoose.Types.ObjectId().toString();

const mockUser = userModel as any;
const mockApplication = projectApplicationModel as any;

describe("Mentor Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUser.findOne.mockResolvedValue({
      _id: mentorId,
      role: "teacher",
    });
  });

  describe("getMentorApplications()", () => {
    test("should fetch applications assigned to mentor", async () => {
      const query: any = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };

      mockApplication.find.mockReturnValue(query);

      await projectApplicationService.getMentorApplications(mentorId);

      expect(mockUser.findOne).toHaveBeenCalledWith({
        _id: mentorId,
        role: "teacher",
      });

      expect(mockApplication.find).toHaveBeenCalledWith({
        mentorId,
        status: "MENTOR_REVIEW",
      });

      // Listing applications must not enforce assignment capacity.
      expect(mockApplication.countDocuments).not.toHaveBeenCalled();
    });

    test("should reject access if mentor is not a teacher", async () => {
      mockUser.findOne.mockResolvedValue(null);

      await expect(
        projectApplicationService.getMentorApplications(mentorId)
      ).rejects.toThrow("Teacher not found");

      expect(mockApplication.find).not.toHaveBeenCalled();
    });
  });

  describe("mentorApproval()", () => {
    test("should reject approval if application does not exist", async () => {
      mockApplication.findById.mockResolvedValue(null);

      await expect(
        projectApplicationService.mentorApproval(
          applicationId,
          mentorId,
          { approved: true }
        )
      ).rejects.toThrow("Application not found");
    });

    test("should reject application in an incorrect stage", async () => {
      mockApplication.findById.mockResolvedValue({
        _id: applicationId,
        status: "FACULTY_REVIEW",
        mentorId,
      });

      await expect(
        projectApplicationService.mentorApproval(
          applicationId,
          mentorId,
          { approved: true }
        )
      ).rejects.toThrow(
        "Application is not awaiting mentor approval"
      );
    });

    test("should prevent an unassigned mentor from approving", async () => {
      mockApplication.findById.mockResolvedValue({
        _id: applicationId,
        status: "MENTOR_REVIEW",
        mentorId: anotherMentorId,
      });

      await expect(
        projectApplicationService.mentorApproval(
          applicationId,
          mentorId,
          { approved: true }
        )
      ).rejects.toThrow(
        "Only the assigned mentor can approve this application"
      );
    });

    test("should reject invalid approval input", async () => {
      const application: any = {
        _id: applicationId,
        status: "MENTOR_REVIEW",
        mentorId,
        approvalHistory: [],
        save: jest.fn(),
      };

      mockApplication.findById
        .mockResolvedValueOnce(application)
        .mockResolvedValueOnce(application);

      await expect(
        projectApplicationService.mentorApproval(
          applicationId,
          mentorId,
          {}
        )
      ).rejects.toThrow("approved must be true or false");
    });
  });
});
