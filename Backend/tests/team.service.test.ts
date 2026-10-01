import { describe, it, afterEach, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import teamService from "../src/modules/teams/team.service";
import teamModel from "../src/modules/teams/team.model";
import userModel from "../src/modules/users/user.model";
import { ERROR_CODES } from "../src/errors/errorCodes";
import { doc, expectAppError, oid, query } from "./helpers";

const T = teamModel as any;
const U = userModel as any;
const V = ERROR_CODES.VALIDATION_ERROR;

let leaderId: string, teamId: string;
beforeEach(() => {
  leaderId = oid();
  teamId = oid();
});
afterEach(() => mock.restoreAll());

const makeTeam = (extra: Record<string, unknown> = {}) =>
  doc({ _id: teamId, leaderId, memberIds: [] as any[], status: "FORMING", ...extra });

describe("teams", () => {
  it("create: 403 for non-students", async () => {
    mock.method(U, "findById", () => query({ _id: leaderId, role: "teacher" }));
    await expectAppError(teamService.create(leaderId), 403, ERROR_CODES.FORBIDDEN);
  });

  it("create: makes a FORMING team led by the student", async () => {
    mock.method(U, "findById", () => query({ _id: leaderId, role: "student" }));
    mock.method(T, "findOne", async () => null);
    const create = mock.method(T, "create", async (d: any) => d);
    await teamService.create(leaderId);
    assert.deepEqual(create.mock.calls[0]!.arguments[0], { leaderId, memberIds: [], status: "FORMING" });
  });

  it("complete: needs 2-4 students, then marks the team COMPLETED", async () => {
    mock.method(T, "findById", async () => makeTeam({ memberIds: [] }));
    await expectAppError(teamService.complete(leaderId, teamId), 400, V);
    mock.restoreAll();

    const team = makeTeam({ memberIds: [oid()] });
    mock.method(T, "findById", async () => team);
    await teamService.complete(leaderId, teamId);
    assert.equal(team.status, "COMPLETED");
    assert.equal(team.save.mock.callCount(), 1);
  });
});
