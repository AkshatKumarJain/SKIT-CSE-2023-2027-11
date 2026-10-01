import mongoose from "mongoose";
import teamModel from "./team.model";
import requestModel from "../teamRequests/teamRequest.model";
import userModel from "../users/user.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import {
  MAX_ADDITIONAL_MEMBERS,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
} from "./team.type";
import transporter from "../../config/nodemailer";

const active = ["FORMING", "COMPLETED"] as const;
const sid = (x: mongoose.Types.ObjectId | string) => x.toString();

class TeamService {
  private fail(
    message: string,
    status = 400,
    code: string = ERROR_CODES.VALIDATION_ERROR,
  ): never {
    throw new AppError(message, status, code);
  }
  private async student(uid: string) {
    const u = await userModel.findById(uid);
    if (!u) this.fail("Student not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);
    if (u.role !== "student")
      this.fail(
        "Only students can perform team actions",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    return u;
  }
  private async activeTeam(uid: mongoose.Types.ObjectId | string) {
    return teamModel.findOne({
      status: { $in: active },
      $or: [{ leaderId: uid }, { memberIds: uid }],
    });
  }
  private department(u: unknown) {
    const b = (u as Record<string, unknown>).department;
    return typeof b === "string" && b.trim() ? b.trim().toLowerCase() : null;
  }
  private sameClass(a: unknown, b: unknown) {
    const x = this.department(a),
      y = this.department(b);
    if (!x || !y)
      this.fail("Same-class validation requires department information");
    if (x !== y)
      this.fail("Requested student is not in the same class/department");
  }
  private async leaderTeam(uid: string, tid: string) {
    if (!mongoose.isValidObjectId(tid)) this.fail("Invalid team id");
    const t = await teamModel.findById(tid);
    if (!t) this.fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
    if (sid(t.leaderId) !== uid)
      this.fail(
        "Only the team leader can perform this action",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    if (t.status === "CANCELLED") this.fail("Team is cancelled");
    return t;
  }
  async create(uid: string) {
    const u = await this.student(uid);
    if (await this.activeTeam(u._id))
      this.fail("Student already belongs to an active team");
    return teamModel.create({
      leaderId: u._id,
      memberIds: [],
      status: "FORMING",
    });
  }
  async mine(uid: string) {
    await this.student(uid);
    const t = await this.activeTeam(uid);
    if (!t) this.fail("No active team found", 404, ERROR_CODES.NOT_FOUND);
    return t.populate([
      { path: "leaderId", select: "name email department phoneNo" },
      { path: "memberIds", select: "name email department phoneNo" },
    ]);
  }
  async byId(uid: string, tid: string) {
    if (!mongoose.isValidObjectId(tid)) this.fail("Invalid team id");
    const t = await teamModel.findById(tid);
    if (!t) this.fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
    if (sid(t.leaderId) !== uid && !t.memberIds.some((x) => sid(x) === uid))
      this.fail(
        "You are not a member of this team",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    return t.populate([
      { path: "leaderId", select: "name email department phoneNo" },
      { path: "memberIds", select: "name email department phoneNo" },
    ]);
  }
  async available(uid: string) {
    const u = await this.student(uid);
    const t = await this.activeTeam(u._id);
    if (!t || sid(t.leaderId) !== uid || t.status !== "FORMING") return [];
    if (1 + t.memberIds.length >= MAX_TEAM_SIZE) return [];
    const b = this.department(u);
    if (!b) this.fail("Same-class validation requires department information");
    const students = await userModel
      .find({
        role: "student",
        department: b,
        _id: { $nin: [u._id, ...t.memberIds] },
      })
      .select("name email department phoneNo")
      .sort({ name: 1 });
    const result = [];
    for (const s of students)
      if (!(await this.activeTeam(s._id))) result.push(s);
    return result;
  }
  async request(uid: string, tid: string, studentId: string) {
    const t = await this.leaderTeam(uid, tid);
    if (t.status !== "FORMING")
      this.fail("Member requests are closed for this team");
    if (!mongoose.isValidObjectId(studentId)) this.fail("Invalid student id");
    if (t.memberIds.length >= MAX_ADDITIONAL_MEMBERS)
      this.fail("Maximum 3 additional members allowed");
    const leader = await this.student(uid),
      member = await this.student(studentId);
    if (sid(member._id) === uid) this.fail("Leader cannot be a member");
    if (t.memberIds.some((x) => sid(x) === sid(member._id)))
      this.fail("Student is already a team member");
    if (await this.activeTeam(member._id))
      this.fail("Student already belongs to another active team");
    this.sameClass(leader, member);
    if (
      await requestModel.exists({
        teamId: t._id,
        requestedStudentId: member._id,
        status: "PENDING",
      })
    )
      this.fail("Duplicate pending request");

    const created = await requestModel.create({
      teamId: t._id,
      requesterId: t.leaderId,
      requestedStudentId: member._id,
      status: "PENDING",
    });

    // Notification only - this email never carries an accept/reject
    // action. The requested student must log in and respond through
    // the authenticated /api/team-requests/:requestId/accept|reject APIs.
    // Best-effort: a failed send must never fail request creation.
    try {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
        to: member.email,
        subject: "New team-member request",
        text: `Team Leader ${leader.name} has sent you a team-member request. Please log in to the Project Allocation & Tracking application to view and respond to this request.`,
      });
    } catch (err) {
      console.error("[team-request email] Failed to send notification:", err);
    }

    return created;
  }
  async teamRequests(uid: string, tid: string) {
    const t = await this.leaderTeam(uid, tid);
    return requestModel
      .find({ teamId: t._id })
      .sort({ createdAt: -1 })
      .populate("requestedStudentId", "name email department phoneNo");
  }
  async received(uid: string) {
    await this.student(uid);
    return requestModel
      .find({ requestedStudentId: uid })
      .sort({ createdAt: -1 })
      .populate("teamId")
      .populate("requesterId", "name email department phoneNo");
  }
  private async pending(uid: string, rid: string) {
    if (!mongoose.isValidObjectId(rid)) this.fail("Invalid request id");
    const r = await requestModel.findById(rid);
    if (!r) this.fail("Team request not found", 404, ERROR_CODES.NOT_FOUND);
    if (r.status !== "PENDING") this.fail("Request has already been processed");
    if (sid(r.requestedStudentId) !== uid)
      this.fail(
        "Only the requested student can respond",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    return r;
  }
  async accept(uid: string, rid: string) {
    const r = await this.pending(uid, rid);
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const fresh = await requestModel
          .findOne({ _id: r._id, status: "PENDING" })
          .session(session);
        if (!fresh) this.fail("Request has already been processed");
        const t = await teamModel
          .findOne({
            _id: fresh.teamId,
            status: "FORMING",
            $expr: { $lt: [{ $size: "$memberIds" }, MAX_ADDITIONAL_MEMBERS] },
          })
          .session(session);
        if (!t)
          this.fail("Team has reached maximum capacity or is unavailable");
        const member = await userModel.findById(uid).session(session);
        if (!member || member.role !== "student")
          this.fail("Student not found", 404, ERROR_CODES.STUDENT_NOT_FOUND);
        if (
          await teamModel
            .findOne({
              _id: { $ne: t._id },
              status: { $in: active },
              $or: [{ leaderId: member._id }, { memberIds: member._id }],
            })
            .session(session)
        )
          this.fail("Student already belongs to another active team");
        const leader = await userModel.findById(t.leaderId).session(session);
        if (!leader)
          this.fail(
            "Team leader not found",
            404,
            ERROR_CODES.STUDENT_NOT_FOUND,
          );
        this.sameClass(leader, member);
        const updated = await teamModel.findOneAndUpdate(
          {
            _id: t._id,
            status: "FORMING",
            $expr: { $lt: [{ $size: "$memberIds" }, MAX_ADDITIONAL_MEMBERS] },
            memberIds: { $ne: member._id },
          },
          { $addToSet: { memberIds: member._id } },
          { new: true, session },
        );
        if (!updated) this.fail("Maximum team size of 4 students reached");
        fresh.status = "ACCEPTED";
        await fresh.save({ session });
        result = fresh;
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
  async reject(uid: string, rid: string) {
    const r = await this.pending(uid, rid);
    r.status = "REJECTED";
    return r.save();
  }
  async cancel(uid: string, rid: string) {
    if (!mongoose.isValidObjectId(rid)) this.fail("Invalid request id");
    const r = await requestModel.findById(rid);
    if (!r) this.fail("Team request not found", 404, ERROR_CODES.NOT_FOUND);
    if (r.status !== "PENDING")
      this.fail("Only pending requests can be cancelled");
    const t = await teamModel.findById(r.teamId);
    if (!t) this.fail("Team not found", 404, ERROR_CODES.NOT_FOUND);
    if (sid(t.leaderId) !== uid)
      this.fail(
        "Only the team leader can cancel this request",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    r.status = "CANCELLED";
    return r.save();
  }
  async complete(uid: string, tid: string) {
    const t = await this.leaderTeam(uid, tid);
    if (t.status !== "FORMING") this.fail("Team is not in forming state");
    const n = 1 + t.memberIds.length;
    if (n < MIN_TEAM_SIZE || n > MAX_TEAM_SIZE)
      this.fail("Team must contain between 2 and 4 students");
    t.status = "COMPLETED";
    return t.save();
  }
}
export = new TeamService();
