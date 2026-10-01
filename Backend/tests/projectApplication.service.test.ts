import { describe, it, afterEach, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import applicationService from "../src/modules/projectApplications/projectApplication.service";
import applicationModel from "../src/modules/projectApplications/projectApplication.model";
import projectModel from "../src/modules/projects/project.model";
import projectService from "../src/modules/projects/project.service";
import selectionService from "../src/modules/projectSelections/projectSelection.service";
import teamModel from "../src/modules/teams/team.model"; // registers mongoose.models.Team
import userModel from "../src/modules/users/user.model";
import { ERROR_CODES } from "../src/errors/errorCodes";
import { expectAppError, oid } from "./helpers";

const A = applicationModel as any;
const P = projectModel as any;
const T = teamModel as any;
const U = userModel as any;
const V = ERROR_CODES.VALIDATION_ERROR;

type Ctx = { studentId: string; teamId: string; mentorId: string; projectId: string; facultyId: string };
let ctx: Ctx;

beforeEach(() => {
  ctx = { studentId: oid(), teamId: oid(), mentorId: oid(), projectId: oid(), facultyId: oid() };
});
afterEach(() => mock.restoreAll());

/** Eligible leader + COMPLETED team of 2, free mentor, open window. */
const setupEligible = () => {
  mock.method(selectionService, "isSelectionOpen", async () => true);
  mock.method(U, "findById", async () => ({ _id: ctx.studentId, role: "student" }));
  mock.method(T, "findById", async () => ({
    _id: ctx.teamId,
    leaderId: ctx.studentId,
    memberIds: [oid()],
    status: "COMPLETED",
  }));
  mock.method(A, "exists", async () => null);
  mock.method(U, "findOne", async () => ({ _id: ctx.mentorId, role: "teacher" }));
  mock.method(A, "countDocuments", async () => 0);
  return mock.method(A, "create", async (d: any) => ({ _id: oid(), ...d }));
};

const ownIdea = () => ({
  teamId: ctx.teamId,
  mentorId: ctx.mentorId,
  projectDetails: { title: " Smart Farm ", domain: " IoT ", description: " Desc ", technologyStack: ["ESP32"] },
});

describe("projectApplications", () => {
  it("fails with 403 when the selection window is closed", async () => {
    mock.method(selectionService, "isSelectionOpen", async () => false);
    await expectAppError(applicationService.createOwnIdeaApplication(ctx.studentId, ownIdea()), 403, V);
  });

  it("OWN_IDEA application starts in ADMIN_REVIEW with trimmed details", async () => {
    const create = setupEligible();
    await applicationService.createOwnIdeaApplication(ctx.studentId, ownIdea());
    const saved = create.mock.calls[0]!.arguments[0] as any;
    assert.equal(saved.source, "OWN_IDEA");
    assert.equal(saved.status, "ADMIN_REVIEW");
    assert.equal(saved.projectId, null);
    assert.equal(saved.projectDetails.title, "Smart Farm");
    assert.deepEqual(saved.projectDetails.technologies, ["ESP32"]);
  });

  it("faculty project: releases the reservation if saving the application fails", async () => {
    setupEligible();
    mock.method(A, "create", async () => {
      throw new Error("db down");
    });
    mock.method(P, "findOne", async () => ({ _id: ctx.projectId }));
    mock.method(projectService, "reserveProject", async () => ({ _id: ctx.projectId, facultyId: ctx.facultyId }) as any);
    const release = mock.method(projectService, "releaseProject", async () => undefined);
    await assert.rejects(
      () =>
        applicationService.applyForFacultyProject(ctx.studentId, {
          teamId: ctx.teamId,
          projectId: ctx.projectId,
          mentorId: ctx.mentorId,
        }),
      /db down/,
    );
    assert.equal(release.mock.callCount(), 1);
  });
});
