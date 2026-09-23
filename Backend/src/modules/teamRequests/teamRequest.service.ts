import mongoose from "mongoose";
import User from "../users/user.model";
import Team from "../teams/team.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { MAX_TEAM_SIZE, validateMemberEligibility, validateSameClass, UserWithClass } from "../teams/team.service";
import TeamRequest from "./teamRequest.model";
import { sendTeamRequestEmail } from "./email.service";

const fail = (message: string, statusCode: number, code: string): never => {
    throw new AppError(message, statusCode, code);
};

const activeTeamFilter = { status: { $in: ["FORMING", "COMPLETED"] } };

class TeamRequestService {
    async createRequest(requesterId: string, teamId: string, requestedStudentId: string) {
        if (!mongoose.isValidObjectId(teamId) || !mongoose.isValidObjectId(requestedStudentId)) {
            fail("Invalid team or student id", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const team = await Team.findById(teamId);
        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
        if (team.status !== "FORMING") fail("Only a forming team can send member requests", 400, ERROR_CODES.VALIDATION_ERROR);
        if (team.leaderId.toString() !== requesterId) fail("Only the team leader can send member requests", 403, ERROR_CODES.FORBIDDEN);

        if (1 + team.memberIds.length >= MAX_TEAM_SIZE) {
            fail("Maximum team size of 4 has been reached", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        if (team.memberIds.some((id) => id.toString() === requestedStudentId)) {
            fail("Student is already a member of this team", 409, ERROR_CODES.VALIDATION_ERROR);
        }

        const requestedStudent = await validateMemberEligibility(requesterId, requestedStudentId);

        const duplicate = await TeamRequest.findOne({
            teamId: team._id,
            requestedStudentId,
            status: "PENDING",
        });
        if (duplicate) fail("A pending request already exists for this student", 409, ERROR_CODES.VALIDATION_ERROR);

        const requester = await User.findById(requesterId).select("name email role branch section class").lean();
        if (!requester) fail("Team leader not found", 404, ERROR_CODES.USER_NOT_FOUND);

        // Re-check class eligibility immediately before creating the request.
        validateSameClass(requester as UserWithClass, requestedStudent);

        const request = await TeamRequest.create({
            teamId: team._id,
            requesterId: requester._id,
            requestedStudentId: requestedStudent._id,
            status: "PENDING",
        });

        try {
            await sendTeamRequestEmail({
                to: requestedStudent.email,
                requestedStudentName: requestedStudent.name,
                leaderName: requester.name,
                teamId: team._id.toString(),
            });

            request.notifiedAt = new Date();
            await request.save();
        } catch (error) {
            // Keep the request PENDING so the student can still see it in-app
            // and the email can be retried. Email delivery never changes membership.
            throw error;
        }

        return this.getRequestById(requesterId, request._id.toString(), true);
    }

    async getTeamRequests(userId: string, teamId: string) {
        if (!mongoose.isValidObjectId(teamId)) fail("Invalid team id", 400, ERROR_CODES.VALIDATION_ERROR);
        const team = await Team.findById(teamId).lean();
        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);

        const isParticipant = team.leaderId.toString() === userId || team.memberIds.some((id) => id.toString() === userId);
        if (!isParticipant) fail("You are not a member of this team", 403, ERROR_CODES.FORBIDDEN);

        return TeamRequest.find({ teamId })
            .sort({ createdAt: -1 })
            .populate("requesterId", "name email role")
            .populate("requestedStudentId", "name email role")
            .lean();
    }

    async getMyRequests(userId: string) {
        return TeamRequest.find({ requestedStudentId: userId })
            .sort({ createdAt: -1 })
            .populate("teamId")
            .populate("requesterId", "name email role")
            .populate("requestedStudentId", "name email role")
            .lean();
    }

    async getRequestById(userId: string, requestId: string, allowRequester = false) {
        if (!mongoose.isValidObjectId(requestId)) fail("Invalid request id", 400, ERROR_CODES.VALIDATION_ERROR);
        const request = await TeamRequest.findById(requestId)
            .populate("teamId")
            .populate("requesterId", "name email role")
            .populate("requestedStudentId", "name email role")
            .lean();
        if (!request) fail("Team request not found", 404, ERROR_CODES.NOT_FOUND);

        const requesterId = request.requesterId._id.toString();
        const requestedId = request.requestedStudentId._id.toString();
        if (userId !== requestedId && !(allowRequester && userId === requesterId)) {
            fail("You are not authorized to view this request", 403, ERROR_CODES.FORBIDDEN);
        }
        return request;
    }

    async acceptRequest(userId: string, requestId: string) {
        if (!mongoose.isValidObjectId(requestId)) fail("Invalid request id", 400, ERROR_CODES.VALIDATION_ERROR);

        const request = await TeamRequest.findById(requestId);
        if (!request) fail("Team request not found", 404, ERROR_CODES.NOT_FOUND);
        if (request.requestedStudentId.toString() !== userId) fail("Only the requested student can accept this request", 403, ERROR_CODES.FORBIDDEN);
        if (request.status !== "PENDING") fail("Only a pending request can be accepted", 400, ERROR_CODES.VALIDATION_ERROR);

        const team = await Team.findById(request.teamId);
        if (!team) fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
        if (team.status !== "FORMING") fail("The team is no longer accepting members", 400, ERROR_CODES.VALIDATION_ERROR);
        if (1 + team.memberIds.length >= MAX_TEAM_SIZE) fail("The team has no available capacity", 400, ERROR_CODES.VALIDATION_ERROR);

        const alreadyInActiveTeam = await Team.exists({
            ...activeTeamFilter,
            $or: [{ leaderId: userId }, { memberIds: userId }],
            _id: { $ne: team._id },
        });
        if (alreadyInActiveTeam) fail("You are already in another active team", 409, ERROR_CODES.VALIDATION_ERROR);

        const student = await User.findById(userId).select("name email role branch section class").lean();
        const leader = await User.findById(team.leaderId).select("name email role branch section class").lean();
        if (!student || student.role !== "student") fail("Requested user is not a valid student", 400, ERROR_CODES.VALIDATION_ERROR);
        if (!leader) fail("Team leader not found", 404, ERROR_CODES.USER_NOT_FOUND);
        validateSameClass(leader as UserWithClass, student as UserWithClass);

        const updatedTeam = await Team.findOneAndUpdate(
            {
                _id: team._id,
                status: "FORMING",
                memberIds: { $ne: userId },
                $expr: { $lt: [{ $size: "$memberIds" }, MAX_TEAM_SIZE - 1] },
            },
            { $addToSet: { memberIds: new mongoose.Types.ObjectId(userId) } },
            { new: true }
        );

        if (!updatedTeam) fail("The team no longer has capacity or the student is already a member", 409, ERROR_CODES.VALIDATION_ERROR);

        request.status = "ACCEPTED";
        request.acceptedAt = new Date();
        await request.save();

        return {
            request: await TeamRequest.findById(request._id)
                .populate("requesterId", "name email role")
                .populate("requestedStudentId", "name email role")
                .lean(),
            team: await Team.findById(updatedTeam._id)
                .populate("leaderId", "name email role")
                .populate("memberIds", "name email role")
                .lean(),
        };
    }

    async rejectRequest(userId: string, requestId: string) {
        if (!mongoose.isValidObjectId(requestId)) fail("Invalid request id", 400, ERROR_CODES.VALIDATION_ERROR);

        const request = await TeamRequest.findById(requestId);
        if (!request) fail("Team request not found", 404, ERROR_CODES.NOT_FOUND);
        if (request.requestedStudentId.toString() !== userId) fail("Only the requested student can reject this request", 403, ERROR_CODES.FORBIDDEN);
        if (request.status !== "PENDING") fail("Only a pending request can be rejected", 400, ERROR_CODES.VALIDATION_ERROR);

        request.status = "REJECTED";
        request.rejectedAt = new Date();
        await request.save();

        return TeamRequest.findById(request._id)
            .populate("requesterId", "name email role")
            .populate("requestedStudentId", "name email role")
            .lean();
    }

    async cancelRequest(userId: string, requestId: string) {
        if (!mongoose.isValidObjectId(requestId)) fail("Invalid request id", 400, ERROR_CODES.VALIDATION_ERROR);

        const request = await TeamRequest.findById(requestId);
        if (!request) fail("Team request not found", 404, ERROR_CODES.NOT_FOUND);
        if (request.requesterId.toString() !== userId) fail("Only the team leader can cancel this request", 403, ERROR_CODES.FORBIDDEN);
        if (request.status !== "PENDING") fail("Only a pending request can be cancelled", 400, ERROR_CODES.VALIDATION_ERROR);

        request.status = "CANCELLED";
        request.cancelledAt = new Date();
        await request.save();

        return TeamRequest.findById(request._id)
            .populate("requesterId", "name email role")
            .populate("requestedStudentId", "name email role")
            .lean();
    }
}

export default new TeamRequestService();
