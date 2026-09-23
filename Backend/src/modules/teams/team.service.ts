import mongoose from "mongoose";
import User from "../users/user.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import Team from "./team.model";
import { ITeam, MAX_ADDITIONAL_MEMBERS, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "./team.type";
import TeamRequest from "../teamRequests/teamRequest.model";

const fail = (message: string, statusCode: number, code: string): never => {
    throw new AppError(message, statusCode, code);
};

const activeTeamFilter = {
    status: { $in: ["FORMING", "COMPLETED"] },
};

export type UserWithClass = {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
    branch?: string | null;
    section?: string | null;
    class?: string | null;
};

const getClassValue = (user: UserWithClass): string | undefined => {
    const branch = typeof user.branch === "string" ? user.branch.trim().toLowerCase() : "";
    const section = typeof user.section === "string" ? user.section.trim().toLowerCase() : "";
    const className = typeof user.class === "string" ? user.class.trim().toLowerCase() : "";

    if (className) return `class:${className}`;
    if (branch || section) return `branch:${branch}|section:${section}`;
    return undefined;
};

export const validateSameClass = (leader: UserWithClass, student: UserWithClass): void => {
    const leaderClass = getClassValue(leader);
    const studentClass = getClassValue(student);

    if (!leaderClass || !studentClass) {
        fail(
            "Same-class validation requires class, or branch and section, to be present on User",
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
    }

    if (leaderClass !== studentClass) {
        fail("Student does not belong to the same class/group as the team leader", 400, ERROR_CODES.VALIDATION_ERROR);
    }
};

export const validateStudentTeamAvailability = async (studentId: string): Promise<void> => {
    const activeTeam = await Team.exists({
        ...activeTeamFilter,
        $or: [{ leaderId: studentId }, { memberIds: studentId }],
    });

    if (activeTeam) {
        fail("Student is already in an active team", 409, ERROR_CODES.VALIDATION_ERROR);
    }
};

export const validateMemberEligibility = async (leaderId: string, studentId: string): Promise<UserWithClass> => {
    if (!mongoose.isValidObjectId(studentId)) {
        fail("Invalid student id", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (leaderId === studentId) {
        fail("Team leader cannot be added as a member", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const student = await User.findById(studentId).select("name email role branch section class").lean() as UserWithClass | null;
    if (!student) fail("Student not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);
    if (student.role !== "student") fail("Selected user is not a student", 400, ERROR_CODES.VALIDATION_ERROR);

    await validateStudentTeamAvailability(studentId);

    const leader = await User.findById(leaderId).select("name email role branch section class").lean() as UserWithClass | null;
    if (!leader) fail("Team leader not found", 404, ERROR_CODES.USER_NOT_FOUND);

    validateSameClass(leader, student);
    return student;
};

const serializeTeam = (team: ITeam) => team;

class TeamService {
    async createTeam(studentId: string) {
        const student = await User.findById(studentId).select("_id role");
        if (!student) fail("Student not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);
        if (student.role !== "student") fail("Only students can create teams", 403, ERROR_CODES.FORBIDDEN);

        await validateStudentTeamAvailability(studentId);

        const team = await Team.create({
            leaderId: student._id,
            memberIds: [],
            status: "FORMING",
        });

        return serializeTeam(team.toObject() as ITeam);
    }

    async getMyTeam(studentId: string) {
        const team = await Team.findOne({
            ...activeTeamFilter,
            $or: [{ leaderId: studentId }, { memberIds: studentId }],
        })
            .populate("leaderId", "name email role")
            .populate("memberIds", "name email role")
            .lean();

        return team;
    }

    async getAvailableMembers(studentId: string, teamId: string) {
        if (!mongoose.isValidObjectId(teamId)) fail("Invalid team id", 400, ERROR_CODES.VALIDATION_ERROR);

        const team = await Team.findById(teamId).lean();
        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
        if (team.leaderId.toString() !== studentId) fail("Only the team leader can manage members", 403, ERROR_CODES.FORBIDDEN);
        if (team.status !== "FORMING") fail("Only a forming team can add members", 400, ERROR_CODES.VALIDATION_ERROR);

        const totalSize = 1 + team.memberIds.length;
        if (totalSize >= MAX_TEAM_SIZE) return [];

        const activeTeams = await Team.find({
            ...activeTeamFilter,
            $or: [{ leaderId: { $exists: true } }, { memberIds: { $exists: true } }],
        }).select("leaderId memberIds").lean();

        const unavailableIds = new Set<string>([
            studentId,
            ...team.memberIds.map((id) => id.toString()),
            ...activeTeams.flatMap((item) => [item.leaderId.toString(), ...item.memberIds.map((id) => id.toString())]),
        ]);

        const pendingRequests = await TeamRequest.find({ teamId: team._id, status: "PENDING" }).select("requestedStudentId").lean();
        pendingRequests.forEach((request) => unavailableIds.add(request.requestedStudentId.toString()));

        const users = await User.find({
            role: "student",
            _id: { $nin: [...unavailableIds] },
        }).select("name email role branch section class").lean();

        const leader = await User.findById(studentId).select("name email role branch section class").lean() as UserWithClass | null;
        if (!leader) fail("Student not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);

        return (users as UserWithClass[]).filter((student) => {
            try {
                validateSameClass(leader, student);
                return true;
            } catch {
                return false;
            }
        });
    }

    async getTeam(studentId: string, teamId: string) {
        if (!mongoose.isValidObjectId(teamId)) fail("Invalid team id", 400, ERROR_CODES.VALIDATION_ERROR);

        const team = await Team.findById(teamId)
            .populate("leaderId", "name email role")
            .populate("memberIds", "name email role")
            .lean();

        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);

        const isParticipant = team.leaderId._id?.toString?.() === studentId ||
            team.memberIds.some((member: { _id: mongoose.Types.ObjectId }) => member._id.toString() === studentId);
        if (!isParticipant) fail("You are not a member of this team", 403, ERROR_CODES.FORBIDDEN);

        return team;
    }

    async completeTeam(studentId: string, teamId: string) {
        if (!mongoose.isValidObjectId(teamId)) fail("Invalid team id", 400, ERROR_CODES.VALIDATION_ERROR);

        const team = await Team.findById(teamId);
        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
        if (team.leaderId.toString() !== studentId) fail("Only the team leader can complete the team", 403, ERROR_CODES.FORBIDDEN);
        if (team.status !== "FORMING") fail("Only a forming team can be completed", 400, ERROR_CODES.VALIDATION_ERROR);

        const totalSize = 1 + team.memberIds.length;
        if (totalSize < MIN_TEAM_SIZE) fail("A team must contain at least 2 students", 400, ERROR_CODES.VALIDATION_ERROR);
        if (totalSize > MAX_TEAM_SIZE || team.memberIds.length > MAX_ADDITIONAL_MEMBERS) {
            fail("A team can contain a maximum of 4 students", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const pendingRequest = await TeamRequest.exists({ teamId: team._id, status: "PENDING" });
        if (pendingRequest) fail("Resolve all pending team requests before completing the team", 400, ERROR_CODES.VALIDATION_ERROR);

        team.status = "COMPLETED";
        await team.save();

        return team.toObject();
    }
}

export default new TeamService();
