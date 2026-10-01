import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import projectService from "../src/modules/projects/project.service";
import projectModel from "../src/modules/projects/project.model";
import { ERROR_CODES } from "../src/errors/errorCodes";
import { expectAppError, oid } from "./helpers";

const P = projectModel as any;

afterEach(() => mock.restoreAll());

describe("projects", () => {
  const base = { title: " AI Tutor ", domain: " EdTech ", description: " Desc ", source: "FACULTY_PROJECT" as const };

  it("only teachers may create FACULTY_PROJECT; only admins PROJECT_BANK", async () => {
    await expectAppError(projectService.createProject(oid(), "student", base), 403, ERROR_CODES.FORBIDDEN);
    await expectAppError(
      projectService.createProject(oid(), "teacher", { ...base, source: "PROJECT_BANK" }),
      403,
      ERROR_CODES.FORBIDDEN,
    );
  });

  it("creates a faculty project owned by the teacher, trimmed, with defaults", async () => {
    const teacherId = oid();
    const create = mock.method(P, "create", async (d: any) => ({ _id: oid(), ...d }));
    await projectService.createProject(teacherId, "teacher", base);
    const saved = create.mock.calls[0]!.arguments[0] as any;
    assert.equal(saved.title, "AI Tutor");
    assert.equal(saved.domain, "EdTech");
    assert.equal(saved.facultyId, teacherId);
    assert.equal(saved.maxTeamSize, 4);
    assert.equal(saved.visibilityStatus, "AVAILABLE");
  });

  it("reserveProject atomically flips AVAILABLE -> RESERVED, 409 if already taken", async () => {
    const id = oid();
    const fn = mock.method(P, "findOneAndUpdate", async () => ({ _id: id, visibilityStatus: "RESERVED" }));
    await projectService.reserveProject(id, "FACULTY_PROJECT");
    assert.deepEqual(fn.mock.calls[0]!.arguments[0], { _id: id, source: "FACULTY_PROJECT", visibilityStatus: "AVAILABLE" });
    fn.mock.mockImplementation(async () => null);
    await expectAppError(projectService.reserveProject(id, "FACULTY_PROJECT"), 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
  });
});
