import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import selectionService from "../src/modules/projectSelections/projectSelection.service";
import selectionModel from "../src/modules/projectSelections/projectSelection.model";
import { ERROR_CODES } from "../src/errors/errorCodes";
import { expectAppError, oid } from "./helpers";

const S = selectionModel as any;
const V = ERROR_CODES.VALIDATION_ERROR;
const START = "2026-10-01T00:00:00.000Z";
const END = "2026-10-15T00:00:00.000Z";

afterEach(() => mock.restoreAll());

/** `existing` answers the {phase} lookup, `overlap` the {isActive} overlap lookup. */
const mockFindOne = (existing: unknown, overlap: unknown) =>
  mock.method(S, "findOne", async (filter: any) => (filter.isActive ? overlap : existing));

describe("projectSelections", () => {
  it("rejects end date on/before start date", async () => {
    mockFindOne(null, null);
    await expectAppError(selectionService.createPhase({ phase: "OWN_IDEA", startDate: END, endDate: START }), 400, V);
  });

  it("rejects a window overlapping another active phase, else creates it active", async () => {
    mockFindOne(null, { phase: "FACULTY_PROJECT" });
    await expectAppError(selectionService.createPhase({ phase: "OWN_IDEA", startDate: START, endDate: END }), 409, V);
    mock.restoreAll();
    mockFindOne(null, null);
    const create = mock.method(S, "create", async (d: any) => d);
    await selectionService.createPhase({ phase: "OWN_IDEA", startDate: START, endDate: END });
    const saved = create.mock.calls[0]!.arguments[0] as any;
    assert.equal(saved.isActive, true);
    assert.ok(saved.startDate instanceof Date && saved.endDate instanceof Date);
  });

  it("isSelectionOpen is true only when an active window covers now", async () => {
    const exists = mock.method(S, "exists", async () => ({ _id: oid() }));
    assert.equal(await selectionService.isSelectionOpen("PROJECT_BANK"), true);
    assert.equal((exists.mock.calls[0]!.arguments[0] as any).isActive, true);
    exists.mock.mockImplementation(async () => null);
    assert.equal(await selectionService.isSelectionOpen("PROJECT_BANK"), false);
  });
});
