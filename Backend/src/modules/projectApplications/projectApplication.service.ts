import mongoose from "mongoose";
import projectApplicationModel from "./projectApplication.model";
import projectModel from "../projects/project.model";
import projectService from "../projects/project.service";
import userModel from "../users/user.model";
import projectSelectionService from "../projectSelections/projectSelection.service";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import {
    ACTIVE_APPLICATION_STATUSES,
    ApplicationSource,
    ApplicationStatus,
    ProjectDetails
} from "./projectApplication.type";

type TeamReference = {
    _id: mongoose.Types.ObjectId;
    leaderId: mongoose.Types.ObjectId;
    memberIds: mongoose.Types.ObjectId[];
    status: "FORMING" | "COMPLETED" | "CANCELLED";
};

type ApprovalInput = {
    approved?: boolean;
    comment?: string;
    rejectionReason?: string;
};

const fail = (message: string, status: number, code: string): never => {
    throw new AppError(message, status, code);
};

const getTeamModel = (): mongoose.Model<TeamReference> => {
    const model = mongoose.models.Team as mongoose.Model<TeamReference> | undefined;
    if (!model) {
        fail("Team model is not registered. Story 2 team module must be loaded before project applications.", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
    return model as mongoose.Model<TeamReference>;
};

class ProjectApplicationService {
    private async ensureStudent(studentId: string) {
        if (!mongoose.isValidObjectId(studentId)) fail("Invalid authenticated user id", 401, ERROR_CODES.UNAUTHORIZED);
        const student = await userModel.findById(studentId);
        if (!student) fail("Student not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);
        const validStudent = student;
        if (validStudent!.role !== "student") fail("Only students can submit project applications", 403, ERROR_CODES.FORBIDDEN);
        return student;
    }

    private async getEligibleTeam(studentId: string, teamId: string) {
        await this.ensureStudent(studentId);
        if (!mongoose.isValidObjectId(teamId)) fail("Invalid team id", 400, ERROR_CODES.VALIDATION_ERROR);

        const teamModel = getTeamModel();
        const team = await teamModel.findById(teamId);
        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
        const validTeam = team;
        if (validTeam!.status !== "COMPLETED") fail("Team must be completed before submitting a project application", 400, ERROR_CODES.VALIDATION_ERROR);

        const isLeader = validTeam!.leaderId.toString() === studentId;
        const isMember = validTeam!.memberIds.some((memberId) => memberId.toString() === studentId);
        if (!isMember && !isLeader) fail("You do not belong to this team", 403, ERROR_CODES.FORBIDDEN);
        if (!isLeader) fail("Only the team leader can submit a project application", 403, ERROR_CODES.FORBIDDEN);

        const totalSize = 1 + validTeam!.memberIds.length;
        if (totalSize < 2 || totalSize > 4) fail("Team must contain between 2 and 4 students", 400, ERROR_CODES.VALIDATION_ERROR);

        const active = await projectApplicationModel.exists({
            teamId: validTeam!._id,
            status: { $in: ACTIVE_APPLICATION_STATUSES }
        });
        if (active) fail("This team already has an active project application", 409, ERROR_CODES.VALIDATION_ERROR);

        return team;
    }

    private async validateMentor(mentorId: string, excludeApplicationId?: mongoose.Types.ObjectId) {
        if (!mongoose.isValidObjectId(mentorId)) fail("Invalid mentor id", 400, ERROR_CODES.VALIDATION_ERROR);
        const mentor = await userModel.findOne({ _id: mentorId, role: "teacher" });
        if (!mentor) fail("Selected mentor does not exist or is not a teacher", 404, ERROR_CODES.TEACHER_NOT_FOUND);

        const filter: {
            mentorId: string;
            status: { $in: ApplicationStatus[] };
            _id?: { $ne: mongoose.Types.ObjectId };
        } = {
            mentorId,
            status: { $in: ACTIVE_APPLICATION_STATUSES }
        };
        if (excludeApplicationId) filter._id = { $ne: excludeApplicationId };

        const count = await projectApplicationModel.countDocuments(filter);
        if (count >= 3) fail("Mentor capacity has reached 3 active applications", 409, ERROR_CODES.MENTOR_LIMIT_REACHED);
        return mentor;
    }

    private validateProjectDetails(details: Partial<ProjectDetails> | undefined): ProjectDetails {
        const title = details?.title?.trim();
        const domain = details?.domain?.trim();
        const problemStatement = details?.problemStatement?.trim();
        const description = details?.description?.trim();
        if (!title || !domain || !problemStatement || !description) {
            fail("Project title, domain, problem statement and description are required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        return {
            title: title as string,
            domain: domain as string,
            problemStatement: problemStatement as string,
            description: description as string,
            expectedOutcome: details?.expectedOutcome?.trim() ?? "",
            sdgGoals: details?.sdgGoals ?? [],
            technologyStack: details?.technologyStack ?? []
        };
    }

    private async ensureSelectionOpen(source: ApplicationSource) {
        const open = await projectSelectionService.isSelectionOpen(source);
        if (!open) fail(`${source} selection is currently closed`, 403, ERROR_CODES.VALIDATION_ERROR);
    }

    private async createApplication(data: {
        studentId: string;
        teamId: mongoose.Types.ObjectId;
        projectId?: mongoose.Types.ObjectId | null;
        source: ApplicationSource;
        mobileNumber?: string;
        projectDetails?: ProjectDetails;
        mentorId: string;
        facultyId?: mongoose.Types.ObjectId | null;
        status: ApplicationStatus;
    }) {
        return projectApplicationModel.create({
            studentId: data.studentId,
            teamId: data.teamId,
            projectId: data.projectId ?? null,
            source: data.source,
            ...(data.mobileNumber?.trim() ? { mobileNumber: data.mobileNumber.trim() } : {}),
            ...(data.projectDetails ? { projectDetails: data.projectDetails } : {}),
            mentorId: data.mentorId,
            facultyId: data.facultyId ?? null,
            status: data.status,
            rejectionReason: null,
            approvalHistory: [],
            submittedAt: new Date(),
            approvedAt: null
        });
    }

    async createOwnIdeaApplication(studentId: string, data: {
        teamId?: string;
        mobileNumber?: string;
        projectDetails?: Partial<ProjectDetails>;
        mentorId?: string;
    }) {
        await this.ensureSelectionOpen("OWN_IDEA");
        const teamId = data.teamId;
        const mentorId = data.mentorId;
        if (!teamId) fail("teamId is required", 400, ERROR_CODES.VALIDATION_ERROR);
        if (!mentorId) fail("mentorId is required", 400, ERROR_CODES.VALIDATION_ERROR);
        const team = await this.getEligibleTeam(studentId, teamId!);
        const validTeam = team!;
        const details = this.validateProjectDetails(data.projectDetails);
        await this.validateMentor(mentorId!);

        return this.createApplication({
            studentId,
            teamId: validTeam._id,
            source: "OWN_IDEA",
            ...(data.mobileNumber ? { mobileNumber: data.mobileNumber } : {}),
            projectDetails: details,
            mentorId: mentorId!,
            facultyId: null,
            projectId: null,
            status: "ADMIN_REVIEW"
        });
    }

    private async getSelectableExistingProject(studentId: string, teamId: string, projectId: string, source: "FACULTY_PROJECT" | "PROJECT_BANK") {
        await this.ensureSelectionOpen(source);
        const team = await this.getEligibleTeam(studentId, teamId);
        if (!mongoose.isValidObjectId(projectId)) fail("Invalid project id", 400, ERROR_CODES.VALIDATION_ERROR);
        const project = await projectModel.findOne({ _id: projectId, source, visibilityStatus: "AVAILABLE" });
        if (!project) fail("Project is not available", 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
        return { team, project };
    }

    async applyForFacultyProject(studentId: string, data: { teamId?: string; projectId?: string; mobileNumber?: string; mentorId?: string }) {
        const teamId = data.teamId;
        const projectId = data.projectId;
        const mentorId = data.mentorId;
        if (!teamId || !projectId || !mentorId) fail("teamId, projectId and mentorId are required", 400, ERROR_CODES.VALIDATION_ERROR);
        const { team } = await this.getSelectableExistingProject(studentId, teamId!, projectId!, "FACULTY_PROJECT");
        const validTeam = team!;
        await this.validateMentor(mentorId!);

        const reserved = await projectService.reserveProject(projectId!, "FACULTY_PROJECT");
        const validReserved = reserved!;
        try {
            return await this.createApplication({
                studentId,
                teamId: validTeam._id,
                projectId: validReserved._id,
                source: "FACULTY_PROJECT",
                ...(data.mobileNumber ? { mobileNumber: data.mobileNumber } : {}),
                mentorId: mentorId!,
                facultyId: validReserved.facultyId ?? null,
                status: "MENTOR_REVIEW"
            });
        } catch (error) {
            await projectService.releaseProject(validReserved._id);
            throw error;
        }
    }

    async applyForProjectBank(studentId: string, data: { teamId?: string; projectId?: string; mobileNumber?: string; mentorId?: string }) {
        const teamId = data.teamId;
        const projectId = data.projectId;
        const mentorId = data.mentorId;
        if (!teamId || !projectId || !mentorId) fail("teamId, projectId and mentorId are required", 400, ERROR_CODES.VALIDATION_ERROR);
        const { team } = await this.getSelectableExistingProject(studentId, teamId!, projectId!, "PROJECT_BANK");
        const validTeam = team!;
        await this.validateMentor(mentorId!);

        const reserved = await projectService.reserveProject(projectId!, "PROJECT_BANK");
        const validReserved = reserved!;
        if (!validReserved.facultyId) {
            await projectService.releaseProject(validReserved._id);
            fail("This Project Bank project does not have an assigned faculty approver", 400, ERROR_CODES.TEACHER_NOT_FOUND);
        }
        try {
            return await this.createApplication({
                studentId,
                teamId: validTeam._id,
                projectId: validReserved._id,
                source: "PROJECT_BANK",
                ...(data.mobileNumber ? { mobileNumber: data.mobileNumber } : {}),
                mentorId: mentorId!,
                facultyId: validReserved.facultyId!,
                status: "FACULTY_REVIEW"
            });
        } catch (error) {
            await projectService.releaseProject(validReserved._id);
            throw error;
        }
    }

    async getAvailableMentors() {
        const mentors = await userModel.find({ role: "teacher" }).select("name email phoneNo").sort({ name: 1 }).lean();
        const counts = await projectApplicationModel.aggregate([
            { $match: { status: { $in: ACTIVE_APPLICATION_STATUSES } } },
            { $group: { _id: "$mentorId", count: { $sum: 1 } } }
        ]);
        const countMap = new Map<string, number>();
        for (const item of counts) if (item._id) countMap.set(item._id.toString(), item.count);
        return mentors.filter((mentor) => (countMap.get(mentor._id.toString()) ?? 0) < 3);
    }

    async getMyApplications(studentId: string) {
        await this.ensureStudent(studentId);
        return this.populateList({ studentId });
    }

    async getAvailableApplicationsForAdmin() {
        return this.populateList({});
    }

    async getMentorApplications(mentorId: string) {
        await this.validateMentor(mentorId, undefined);
        return this.populateList({ mentorId, status: "MENTOR_REVIEW" });
    }

    async getFacultyApplications(facultyId: string) {
        await this.ensureTeacher(facultyId);
        return this.populateList({ facultyId, status: "FACULTY_REVIEW" });
    }

    async getApplicationById(applicationId: string, userId: string, role: string | undefined) {
        if (!mongoose.isValidObjectId(applicationId)) fail("Invalid application id", 400, ERROR_CODES.VALIDATION_ERROR);
        const application = await this.populateOne(applicationId);
        if (!application) fail("Application not found", 404, ERROR_CODES.NOT_FOUND);
        const validApplication = application!;
        const owner = validApplication.studentId.toString() === userId;
        const mentor = validApplication.mentorId?.toString() === userId;
        const faculty = validApplication.facultyId?.toString() === userId;
        if (role !== "admin" && !owner && !mentor && !faculty) fail("You are not allowed to view this application", 403, ERROR_CODES.FORBIDDEN);
        return validApplication;
    }

    private async ensureTeacher(userId: string) {
        const teacher = await userModel.findOne({ _id: userId, role: "teacher" });
        if (!teacher) fail("Teacher not found", 404, ERROR_CODES.TEACHER_NOT_FOUND);
        return teacher;
    }

    private populateList(filter: Record<string, unknown>) {
        return projectApplicationModel.find(filter)
            .sort({ createdAt: -1 })
            .populate("studentId", "name email phoneNo")
            .populate("mentorId", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .populate("projectId")
            .populate({
                path: "teamId",
                populate: [
                    { path: "leaderId", select: "name email phoneNo" },
                    { path: "memberIds", select: "name email phoneNo" }
                ]
            });
    }

    private populateOne(applicationId: mongoose.Types.ObjectId | string) {
        return projectApplicationModel.findById(applicationId)
            .populate("studentId", "name email phoneNo")
            .populate("mentorId", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .populate("projectId")
            .populate({
                path: "teamId",
                populate: [
                    { path: "leaderId", select: "name email phoneNo" },
                    { path: "memberIds", select: "name email phoneNo" }
                ]
            });
    }

    private async findApplication(applicationId: string) {
        if (!mongoose.isValidObjectId(applicationId)) fail("Invalid application id", 400, ERROR_CODES.VALIDATION_ERROR);
        const application = await projectApplicationModel.findById(applicationId);
        if (!application) fail("Application not found", 404, ERROR_CODES.NOT_FOUND);
        return application;
    }

    private async recordDecision(applicationId: string, actorId: string, stage: ApplicationStatus, input: ApprovalInput) {
        const application = (await this.findApplication(applicationId))!;
        if (application.status !== stage) fail(`Application is not in ${stage} stage`, 409, ERROR_CODES.VALIDATION_ERROR);
        const approved = input.approved === true;
        const rejected = input.approved === false;
        if (!approved && !rejected) fail("approved must be true or false", 400, ERROR_CODES.VALIDATION_ERROR);

        application.approvalHistory.push({
            stage,
            action: approved ? "APPROVED" : "REJECTED",
            approvedBy: new mongoose.Types.ObjectId(actorId),
            ...(input.comment?.trim() ? { comment: input.comment.trim() } : {}),
            actedAt: new Date()
        });

        if (rejected) {
            application.status = "REJECTED";
            application.rejectionReason = input.rejectionReason?.trim() || input.comment?.trim() || "Application rejected";
            if (application.projectId) await projectService.releaseProject(application.projectId);
            return application.save();
        }
        return application;
    }

    async adminApproval(applicationId: string, adminId: string, input: ApprovalInput) {
        await this.ensureAdmin(adminId);
        const application = await this.recordDecision(applicationId, adminId, "ADMIN_REVIEW", input);
        if (application.status === "REJECTED") return this.populateOne(application._id);
        application.status = "ADMIN_APPROVED";
        application.status = "MENTOR_REVIEW";
        await application.save();
        return this.populateOne(application._id);
    }

    async mentorApproval(applicationId: string, mentorId: string, input: ApprovalInput) {
        await this.ensureTeacher(mentorId);
        const application = (await this.findApplication(applicationId))!;
        if (application.status !== "MENTOR_REVIEW") fail("Application is not awaiting mentor approval", 409, ERROR_CODES.VALIDATION_ERROR);
        if (!application.mentorId || application.mentorId.toString() !== mentorId) fail("Only the assigned mentor can approve this application", 403, ERROR_CODES.FORBIDDEN);
        if (input.approved === true) await this.validateMentor(mentorId, application._id);

        const decided = (await this.recordDecision(applicationId, mentorId, "MENTOR_REVIEW", input))!;
        if (decided.status === "REJECTED") return this.populateOne(decided._id);
        decided.status = "MENTOR_APPROVED";
        decided.status = "ADMIN_FINAL_REVIEW";
        await decided.save();
        return this.populateOne(decided._id);
    }

    async facultyApproval(applicationId: string, facultyId: string, input: ApprovalInput) {
        await this.ensureTeacher(facultyId);
        const application = (await this.findApplication(applicationId))!;
        if (application.status !== "FACULTY_REVIEW") fail("Application is not awaiting faculty approval", 409, ERROR_CODES.VALIDATION_ERROR);
        if (!application.facultyId || application.facultyId.toString() !== facultyId) fail("Only the assigned faculty can approve this application", 403, ERROR_CODES.FORBIDDEN);

        const decided = (await this.recordDecision(applicationId, facultyId, "FACULTY_REVIEW", input))!;
        if (decided.status === "REJECTED") return this.populateOne(decided._id);
        decided.status = "FACULTY_APPROVED";
        decided.status = "ADMIN_FINAL_REVIEW";
        await decided.save();
        return this.populateOne(decided._id);
    }

    async finalAdminApproval(applicationId: string, adminId: string, input: ApprovalInput) {
        await this.ensureAdmin(adminId);
        const application = (await this.findApplication(applicationId))!;
        if (application.status !== "ADMIN_FINAL_REVIEW") fail("Application is not awaiting final admin approval", 409, ERROR_CODES.VALIDATION_ERROR);

        const decided = (await this.recordDecision(applicationId, adminId, "ADMIN_FINAL_REVIEW", input))!;
        if (decided.status === "REJECTED") return this.populateOne(decided._id);

        let projectId = decided.projectId;
        if (decided.source === "OWN_IDEA") {
            const details = decided.projectDetails!;
            const mentorId = decided.mentorId!;
            if (!details || !mentorId) fail("Own Idea project details are incomplete", 400, ERROR_CODES.VALIDATION_ERROR);
            const project = await projectService.createOwnIdeaProject({
                title: details.title,
                domain: details.domain,
                problemStatement: details.problemStatement,
                description: details.description,
                ...(details.expectedOutcome ? { expectedOutcome: details.expectedOutcome } : {}),
                ...(details.sdgGoals ? { sdgGoals: details.sdgGoals } : {}),
                ...(details.technologyStack ? { technologyStack: details.technologyStack } : {}),
                createdBy: decided.studentId.toString(),
                mentorId: mentorId.toString()
            });
            projectId = project._id;
        } else {
            if (!projectId) fail("Application is missing its project", 400, ERROR_CODES.PROJECT_NOT_FOUND);
            await projectService.allocateProject(projectId!);
        }

        decided.projectId = projectId!;
        decided.status = "APPROVED";
        decided.approvedAt = new Date();
        await decided.save();
        return this.populateOne(decided._id);
    }

    private async ensureAdmin(userId: string) {
        const admin = await userModel.findOne({ _id: userId, role: "admin" });
        if (!admin) fail("Only admin can perform this action", 403, ERROR_CODES.FORBIDDEN);
        return admin;
    }
}

export = new ProjectApplicationService();
