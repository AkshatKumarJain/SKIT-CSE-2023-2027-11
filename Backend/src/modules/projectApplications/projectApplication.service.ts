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
    IProjectApplication
} from "./projectApplication.type";

const ACTIVE_STATUSES = ACTIVE_APPLICATION_STATUSES;
const MAX_ADDITIONAL_MEMBERS = 3;
const MAX_TEAM_SIZE = 4;

const assertId = (value: string | undefined, message: string): string => {
    if (!value || !mongoose.isValidObjectId(value)) {
        throw new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return value;
};

const getUserBranch = (user: unknown): string | undefined => {
    if (!user || typeof user !== "object") return undefined;
    const branch = (user as { branch?: unknown }).branch;
    return typeof branch === "string" && branch.trim() ? branch.trim() : undefined;
};

/**
 * Branch compatibility is deliberately centralized. The current repository's
 * User model does not define a branch field or a compatibility configuration,
 * so the service refuses cross-branch selection rather than assuming that all
 * branches are compatible. If branch configuration is later added, this is
 * the single function that should consume it.
 */
const getEligibleBranches = (leaderBranch: string | undefined): string[] => {
    if (!leaderBranch) return [];
    const configured = process.env.BRANCH_COMPATIBILITY?.split(";") ?? [];
    const match = configured.find((group) => {
        const [leader] = group.split(":");
        return leader?.trim().toLowerCase() === leaderBranch.trim().toLowerCase();
    });
    if (!match) return [];
    const [, branches = ""] = match.split(":");
    return branches.split(",").map((branch) => branch.trim()).filter(Boolean);
};

class ProjectApplicationService {
    private async getLeader(studentId: string) {
        const leader = await userModel.findOne({ _id: studentId, role: "student" }).lean();
        if (!leader) throw new AppError("Student account not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);
        return leader;
    }

    private async checkExistingApplication(studentId: string) {
        const existing = await projectApplicationModel.findOne({
            $or: [
                { studentId },
                { teamMembers: studentId }
            ],
            status: { $in: ACTIVE_STATUSES }
        }).select("_id").lean();

        if (existing) {
            throw new AppError("Student already has an active project application", 409, ERROR_CODES.VALIDATION_ERROR);
        }
    }

    private async validateTeamMembers(studentId: string, memberIds: unknown[]) {
        if (!Array.isArray(memberIds)) {
            throw new AppError("teamMembers must be an array", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        if (memberIds.length > MAX_ADDITIONAL_MEMBERS) {
            throw new AppError("A maximum of 3 additional team members is allowed", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const ids = memberIds.map((id) => {
            if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
                throw new AppError("Invalid team member ID", 400, ERROR_CODES.VALIDATION_ERROR);
            }
            return id;
        });

        if (new Set(ids).size !== ids.length) {
            throw new AppError("Duplicate team members are not allowed", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        if (ids.includes(studentId)) {
            throw new AppError("Leader cannot be a team member", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        if (ids.length === 0) return [];

        const leader = await this.getLeader(studentId);
        const leaderBranch = getUserBranch(leader);
        if (!leaderBranch) {
            throw new AppError("Branch compatibility is not configured for the leader", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const eligibleBranches = getEligibleBranches(leaderBranch);
        if (eligibleBranches.length === 0) {
            throw new AppError("No compatible branches are configured for the leader", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const members = await userModel.find({
            _id: { $in: ids },
            role: "student"
        }).lean();

        if (members.length !== ids.length) {
            throw new AppError("One or more selected team members are invalid students", 400, ERROR_CODES.STUDENT_NOT_FOUND);
        }

        for (const member of members) {
            const branch = getUserBranch(member);
            if (!branch || !eligibleBranches.some((allowed) => allowed.toLowerCase() === branch.toLowerCase())) {
                throw new AppError("One or more team members are from an incompatible branch", 400, ERROR_CODES.VALIDATION_ERROR);
            }
        }

        const occupied = await projectApplicationModel.findOne({
            $or: [
                { studentId: { $in: ids } },
                { teamMembers: { $in: ids } }
            ],
            status: { $in: ACTIVE_STATUSES }
        }).select("_id").lean();

        if (occupied) {
            throw new AppError("One or more selected students are already occupied by an active application", 409, ERROR_CODES.VALIDATION_ERROR);
        }

        return ids.map((id) => new mongoose.Types.ObjectId(id));
    }

    private async validateMentorAvailability(mentorId: string) {
        assertId(mentorId, "Invalid mentor ID");
        const mentor = await userModel.findOne({ _id: mentorId, role: "teacher" }).lean();
        if (!mentor) throw new AppError("Mentor not found", 404, ERROR_CODES.TEACHER_NOT_FOUND);

        const count = await projectApplicationModel.countDocuments({
            mentorId,
            status: { $in: ACTIVE_STATUSES }
        });
        if (count >= 3) throw new AppError("Mentor capacity has been reached", 409, ERROR_CODES.MENTOR_LIMIT_REACHED);
        return mentor;
    }

    private async validateFaculty(facultyId: string) {
        assertId(facultyId, "Invalid faculty ID");
        const faculty = await userModel.findOne({ _id: facultyId, role: "teacher" }).lean();
        if (!faculty) throw new AppError("Faculty not found", 404, ERROR_CODES.TEACHER_NOT_FOUND);
        return faculty;
    }

    private async validateSubmissionBase(studentId: string, source: ApplicationSource, data: { mobileNumber?: unknown; projectDetails?: unknown; teamMembers?: unknown[]; mentorId?: unknown; facultyId?: unknown }) {
        assertId(studentId, "Invalid authenticated student ID");
        const leader = await this.getLeader(studentId);
        if (!data.mobileNumber || typeof data.mobileNumber !== "string") {
            throw new AppError("mobileNumber is required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        await this.checkExistingApplication(studentId);
        await projectSelectionService.isSelectionOpen(source).then((open) => {
            if (!open) throw new AppError(`${source} selection phase is currently closed`, 403, ERROR_CODES.VALIDATION_ERROR);
        });
        return leader;
    }

    private normalizeProjectDetails(input: unknown) {
        if (!input || typeof input !== "object") {
            throw new AppError("Project details are required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        const details = input as Record<string, unknown>;
        const title = typeof details.title === "string" ? details.title.trim() : "";
        const description = typeof details.description === "string" ? details.description.trim() : "";
        const domain = typeof details.domain === "string" ? details.domain.trim() : "";
        if (!title || !description || !domain) {
            throw new AppError("Project title, description and domain are required", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        return {
            title,
            description,
            domain,
            sdgGoals: Array.isArray(details.sdgGoals) ? details.sdgGoals.filter((v): v is string => typeof v === "string") : [],
            technologyStack: Array.isArray(details.technologyStack) ? details.technologyStack.filter((v): v is string => typeof v === "string") : [],
            expectedOutcome: typeof details.expectedOutcome === "string" ? details.expectedOutcome.trim() : ""
        };
    }

    async getAvailableTeamMembers(studentId: string) {
        const leader = await this.getLeader(studentId);
        const leaderBranch = getUserBranch(leader);
        const eligibleBranches = getEligibleBranches(leaderBranch);
        if (!leaderBranch || eligibleBranches.length === 0) return [];

        const occupiedApps = await projectApplicationModel.find({
            status: { $in: ACTIVE_STATUSES },
            $or: [
                { studentId: { $exists: true } },
                { teamMembers: { $exists: true, $ne: [] } }
            ]
        }).select("studentId teamMembers").lean();

        const occupiedIds = new Set<string>();
        for (const app of occupiedApps) {
            occupiedIds.add(app.studentId.toString());
            for (const member of app.teamMembers) occupiedIds.add(member.toString());
        }
        occupiedIds.add(studentId);

        return userModel.find({
            role: "student",
            _id: { $nin: [...occupiedIds].map((id) => new mongoose.Types.ObjectId(id)) },
            branch: { $in: eligibleBranches }
        } as Record<string, unknown>).select("_id name branch phoneNo").sort({ name: 1 }).lean();
    }

    async getAvailableMentors() {
        const teachers = await userModel.find({ role: "teacher" }).select("_id name email phoneNo").lean();
        if (teachers.length === 0) return [];
        const counts = await projectApplicationModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
            { $match: { mentorId: { $ne: null }, status: { $in: ACTIVE_STATUSES } } },
            { $group: { _id: "$mentorId", count: { $sum: 1 } } }
        ]);
        const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
        return teachers.filter((teacher) => (countMap.get(teacher._id.toString()) ?? 0) < 3);
    }

    async createOwnIdeaApplication(studentId: string, data: {
        mobileNumber: string;
        projectDetails: Record<string, unknown>;
        teamMembers?: string[];
        mentorId: string;
    }) {
        await this.validateSubmissionBase(studentId, "OWN_IDEA", data);
        const mentorId = assertId(data.mentorId, "Mentor is required");
        await this.validateMentorAvailability(mentorId);
        const members = await this.validateTeamMembers(studentId, data.teamMembers ?? []);
        const details = this.normalizeProjectDetails(data.projectDetails);

        return projectApplicationModel.create({
            studentId: new mongoose.Types.ObjectId(studentId),
            projectId: null,
            source: "OWN_IDEA",
            mobileNumber: data.mobileNumber.trim(),
            projectDetails: details,
            teamMembers: members,
            mentorId: new mongoose.Types.ObjectId(mentorId),
            facultyId: null,
            status: "ADMIN_REVIEW",
            rejectionReason: null,
            approvalHistory: [],
            submittedAt: new Date(),
            approvedAt: null
        });
    }

    private async createExistingProjectApplication(
        studentId: string,
        source: "FACULTY_PROJECT" | "PROJECT_BANK",
        data: {
            projectId?: string;
            mobileNumber: string;
            projectDetails?: Record<string, unknown>;
            teamMembers?: string[];
            mentorId?: string;
            facultyId?: string;
        }
    ) {
        await this.validateSubmissionBase(studentId, source, data);
        const projectId = assertId(data.projectId, "Project ID is required");
        const project = await projectService.reserveAvailableProject(projectId, source);

        try {
            const members = await this.validateTeamMembers(studentId, data.teamMembers ?? []);
            const mentorId = assertId(data.mentorId, "Mentor is required");
            await this.validateMentorAvailability(mentorId);
            const facultyId = source === "PROJECT_BANK"
                ? assertId(data.facultyId, "Faculty is required for Project Bank applications")
                : project.facultyId?.toString();

            if (source === "PROJECT_BANK") await this.validateFaculty(facultyId!);

            const details = this.normalizeProjectDetails({
                title: project.title,
                description: project.description,
                domain: project.domain,
                sdgGoals: project.sdgGoals,
                technologyStack: project.technologyStack,
                expectedOutcome: project.expectedOutcome,
                ...data.projectDetails
            });

            return await projectApplicationModel.create({
                studentId: new mongoose.Types.ObjectId(studentId),
                projectId: project._id,
                source,
                mobileNumber: data.mobileNumber.trim(),
                projectDetails: details,
                teamMembers: members,
                mentorId: new mongoose.Types.ObjectId(mentorId),
                facultyId: facultyId ? new mongoose.Types.ObjectId(facultyId) : null,
                status: source === "FACULTY_PROJECT" ? "MENTOR_REVIEW" : "FACULTY_REVIEW",
                rejectionReason: null,
                approvalHistory: [],
                submittedAt: new Date(),
                approvedAt: null
            });
        } catch (error) {
            await projectService.releaseProject(project._id);
            throw error;
        }
    }

    async applyForFacultyProject(studentId: string, data: {
        projectId: string;
        mobileNumber: string;
        teamMembers?: string[];
        mentorId: string;
    }) {
        return this.createExistingProjectApplication(studentId, "FACULTY_PROJECT", data);
    }

    async applyForProjectBank(studentId: string, data: {
        projectId: string;
        mobileNumber: string;
        teamMembers?: string[];
        mentorId: string;
        facultyId: string;
    }) {
        return this.createExistingProjectApplication(studentId, "PROJECT_BANK", data);
    }

    private addHistory(application: IProjectApplication, stage: string, action: "APPROVED" | "REJECTED", actorId: string, comment?: string) {
        application.approvalHistory.push({
            stage,
            action,
            approvedBy: new mongoose.Types.ObjectId(actorId),
            comment: comment ?? "",
            actedAt: new Date()
        });
    }

    private assertApprovalPayload(approved: unknown): asserts approved is boolean {
        if (typeof approved !== "boolean") {
            throw new AppError("approved must be a boolean", 400, ERROR_CODES.VALIDATION_ERROR);
        }
    }

    async adminApproval(applicationId: string, adminId: string, approved: unknown, comment?: string) {
        assertId(applicationId, "Invalid application ID");
        assertId(adminId, "Invalid admin ID");
        this.assertApprovalPayload(approved);
        const application = await projectApplicationModel.findById(applicationId);
        if (!application) throw new AppError("Application not found", 404, ERROR_CODES.NOT_FOUND);
        if (application.source !== "OWN_IDEA" || application.status !== "ADMIN_REVIEW") {
            throw new AppError("Application is not awaiting initial admin approval", 409, ERROR_CODES.VALIDATION_ERROR);
        }

        if (!approved) {
            application.status = "REJECTED";
            application.rejectionReason = comment || "Rejected by admin";
            this.addHistory(application, "ADMIN_REVIEW", "REJECTED", adminId, comment);
            await application.save();
            return application;
        }

        await this.validateMentorAvailability(application.mentorId?.toString() ?? "");
        application.status = "ADMIN_APPROVED";
        this.addHistory(application, "ADMIN_REVIEW", "APPROVED", adminId, comment);
        application.status = "MENTOR_REVIEW";
        return application.save();
    }

    async mentorApproval(applicationId: string, mentorId: string, approved: unknown, comment?: string) {
        assertId(applicationId, "Invalid application ID");
        assertId(mentorId, "Invalid mentor ID");
        this.assertApprovalPayload(approved);
        const application = await projectApplicationModel.findById(applicationId);
        if (!application) throw new AppError("Application not found", 404, ERROR_CODES.NOT_FOUND);
        if (application.status !== "MENTOR_REVIEW") {
            throw new AppError("Application is not awaiting mentor approval", 409, ERROR_CODES.VALIDATION_ERROR);
        }
        if (!application.mentorId || application.mentorId.toString() !== mentorId) {
            throw new AppError("You are not the assigned mentor for this application", 403, ERROR_CODES.FORBIDDEN);
        }

        if (!approved) {
            application.status = "REJECTED";
            application.rejectionReason = comment || "Rejected by mentor";
            this.addHistory(application, "MENTOR_REVIEW", "REJECTED", mentorId, comment);
            await application.save();
            await projectService.releaseProject(application.projectId);
            return application;
        }

        const currentCount = await projectApplicationModel.countDocuments({
            mentorId,
            status: { $in: ACTIVE_STATUSES },
            _id: { $ne: application._id }
        });
        if (currentCount >= 3) throw new AppError("Mentor capacity has been reached", 409, ERROR_CODES.MENTOR_LIMIT_REACHED);

        application.status = "MENTOR_APPROVED";
        this.addHistory(application, "MENTOR_REVIEW", "APPROVED", mentorId, comment);
        application.status = "ADMIN_FINAL_REVIEW";
        return application.save();
    }

    async facultyApproval(applicationId: string, facultyId: string, approved: unknown, comment?: string) {
        assertId(applicationId, "Invalid application ID");
        assertId(facultyId, "Invalid faculty ID");
        this.assertApprovalPayload(approved);
        const application = await projectApplicationModel.findById(applicationId);
        if (!application) throw new AppError("Application not found", 404, ERROR_CODES.NOT_FOUND);
        if (application.source !== "PROJECT_BANK" || application.status !== "FACULTY_REVIEW") {
            throw new AppError("Application is not awaiting faculty approval", 409, ERROR_CODES.VALIDATION_ERROR);
        }
        if (!application.facultyId || application.facultyId.toString() !== facultyId) {
            throw new AppError("You are not the assigned faculty for this application", 403, ERROR_CODES.FORBIDDEN);
        }

        if (!approved) {
            application.status = "REJECTED";
            application.rejectionReason = comment || "Rejected by faculty";
            this.addHistory(application, "FACULTY_REVIEW", "REJECTED", facultyId, comment);
            await application.save();
            await projectService.releaseProject(application.projectId);
            return application;
        }

        application.status = "FACULTY_APPROVED";
        this.addHistory(application, "FACULTY_REVIEW", "APPROVED", facultyId, comment);
        application.status = "ADMIN_FINAL_REVIEW";
        return application.save();
    }

    async finalAdminApproval(applicationId: string, adminId: string, approved: unknown, comment?: string) {
        assertId(applicationId, "Invalid application ID");
        assertId(adminId, "Invalid admin ID");
        this.assertApprovalPayload(approved);
        const application = await projectApplicationModel.findById(applicationId);
        if (!application) throw new AppError("Application not found", 404, ERROR_CODES.NOT_FOUND);
        if (application.status !== "ADMIN_FINAL_REVIEW") {
            throw new AppError("Application is not awaiting final admin approval", 409, ERROR_CODES.VALIDATION_ERROR);
        }

        if (!approved) {
            application.status = "REJECTED";
            application.rejectionReason = comment || "Rejected by admin";
            this.addHistory(application, "ADMIN_FINAL_REVIEW", "REJECTED", adminId, comment);
            await application.save();
            await projectService.releaseProject(application.projectId);
            return application;
        }

        if (application.source === "OWN_IDEA") {
            const details = application.projectDetails;
                 if (!details) {
                     throw new AppError(
                      "Project details are required",
                         400,
                         ERROR_CODES.VALIDATION_ERROR
                        );
                    }

            const project = await projectModel.create({
                title: details.title,
                description: details.description,
                domain: details.domain,
                sdgGoals: details.sdgGoals,
                technologyStack: details.technologyStack,
                expectedOutcome: details.expectedOutcome ?? "",
                source: "OWN_IDEA",
                createdBy: application.studentId,
                facultyId: application.mentorId ?? null,
                maxTeamSize: application.teamMembers.length + 1,
                visibilityStatus: "ALLOCATED"
            });
            application.projectId = project._id;
        } else {
            await projectService.allocateProject(application.projectId);
        }

        this.addHistory(application, "ADMIN_FINAL_REVIEW", "APPROVED", adminId, comment);
        application.status = "APPROVED";
        application.approvedAt = new Date();
        return application.save();
    }

    async getStudentApplications(studentId: string) {
        return projectApplicationModel.find({
            $or: [{ studentId }, { teamMembers: studentId }]
        })
            .populate("studentId", "name email phoneNo")
            .populate("teamMembers", "name email phoneNo")
            .populate("mentorId", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .populate("projectId")
            .sort({ submittedAt: -1 });
    }

    async getAdminApplications() {
        return projectApplicationModel.find({ status: { $in: ["ADMIN_REVIEW", "ADMIN_FINAL_REVIEW"] } })
            .populate("studentId", "name email phoneNo")
            .populate("teamMembers", "name email phoneNo")
            .populate("mentorId", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .populate("projectId")
            .sort({ submittedAt: -1 });
    }

    async getMentorApplications(mentorId: string) {
        return projectApplicationModel.find({ mentorId, status: "MENTOR_REVIEW" })
            .populate("studentId", "name email phoneNo")
            .populate("teamMembers", "name email phoneNo")
            .populate("projectId")
            .sort({ submittedAt: -1 });
    }

    async getFacultyApplications(facultyId: string) {
        return projectApplicationModel.find({ facultyId, source: "PROJECT_BANK", status: "FACULTY_REVIEW" })
            .populate("studentId", "name email phoneNo")
            .populate("teamMembers", "name email phoneNo")
            .populate("projectId")
            .sort({ submittedAt: -1 });
    }

    async getApplicationById(applicationId: string, requesterId: string, role: string) {
        assertId(applicationId, "Invalid application ID");
        const application = await projectApplicationModel.findById(applicationId)
            .populate("studentId", "name email phoneNo")
            .populate("teamMembers", "name email phoneNo")
            .populate("mentorId", "name email phoneNo")
            .populate("facultyId", "name email phoneNo")
            .populate("projectId");
        if (!application) throw new AppError("Application not found", 404, ERROR_CODES.NOT_FOUND);

        if (role === "admin") return application;
        if (role === "student") {
            const leader = application.studentId._id.toString();
            const memberIds = application.teamMembers.map((member) => member._id.toString());
            if (leader !== requesterId && !memberIds.includes(requesterId)) {
                throw new AppError("You are not authorized to view this application", 403, ERROR_CODES.FORBIDDEN);
            }
            return application;
        }
        if (role === "teacher") {
            const mentor = application.mentorId?._id.toString();
            const faculty = application.facultyId?._id.toString();
            if (mentor !== requesterId && faculty !== requesterId) {
                throw new AppError("You are not authorized to view this application", 403, ERROR_CODES.FORBIDDEN);
            }
            return application;
        }
        throw new AppError("Unauthorized", 403, ERROR_CODES.FORBIDDEN);
    }
}

export = new ProjectApplicationService();
