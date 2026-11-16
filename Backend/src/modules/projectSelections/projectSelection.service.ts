import mongoose from "mongoose";
import projectSelectionModel from "./projectSelection.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { SELECTION_PHASES, SelectionPhase } from "./projectSelection.type";

// Date-only values (YYYY-MM-DD) are interpreted in this timezone.
// Start = 00:00:00.000 of that day, end = 23:59:59.999 of that day,
// so the end date is inclusive for the whole day.

const SELECTION_TZ_OFFSET = "+05:30"; // IST
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

type DateInput = string | Date | null | undefined;

const fail = (message: string, status: number, code: string): never => {
  throw new AppError(message, status, code);
};

class ProjectSelectionService {
  private parseDate(
    value: DateInput,
    boundary: "start" | "end",
  ): Date | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (value instanceof Date) return value;
    if (DATE_ONLY.test(value)) {
      const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
      return new Date(`${value}T${time}${SELECTION_TZ_OFFSET}`);
    }
    return new Date(value);
  }

  // Resolves and validates a start/end pair. Missing values fall back to the
  // existing window (update) or are rejected (create).
  
  private resolveWindow(
    startDate: DateInput,
    endDate: DateInput,
    current?: { startDate: Date; endDate: Date },
  ) {
    const start = this.parseDate(startDate, "start") ?? current?.startDate;
    const end = this.parseDate(endDate, "end") ?? current?.endDate;
    if (!start || !end)
      fail(
        "startDate and endDate are required",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    if (Number.isNaN(start!.getTime()) || Number.isNaN(end!.getTime()))
      fail("Invalid selection dates", 400, ERROR_CODES.VALIDATION_ERROR);
    if (end! < start!)
      fail(
        "End date cannot be before start date",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    return { start: start!, end: end! };
  }

  async createPhase(data: {
    phase?: SelectionPhase;
    startDate?: string | Date;
    endDate?: string | Date;
    isActive?: boolean;
  }) {
    const phase = data.phase;
    if (!phase) fail("phase is required", 400, ERROR_CODES.VALIDATION_ERROR);
    if (!SELECTION_PHASES.includes(phase!))
      fail(
        `phase must be one of ${SELECTION_PHASES.join(", ")}`,
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    if (data.isActive !== undefined && typeof data.isActive !== "boolean")
      fail("isActive must be a boolean", 400, ERROR_CODES.VALIDATION_ERROR);
    const existing = await projectSelectionModel.findOne({ phase: phase! });
    if (existing)
      fail("Selection phase already exists", 409, ERROR_CODES.VALIDATION_ERROR);
    const { start, end } = this.resolveWindow(data.startDate, data.endDate);
    return projectSelectionModel.create({
      phase: phase!,
      startDate: start,
      endDate: end,
      isActive: data.isActive ?? true,
    });
  }

  async isSelectionOpen(phase: SelectionPhase): Promise<boolean> {
    const now = new Date();
    return !!(await projectSelectionModel.exists({
      phase: phase!,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }));
  }

  // Each phase is reported independently, so several can be open at once.

  async getCurrentPhase() {
    const now = new Date();
    const open = await projectSelectionModel.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    const openPhases = new Set<SelectionPhase>(open.map((p) => p.phase));
    return {
      ownIdea: openPhases.has("OWN_IDEA"),
      facultyProjects: openPhases.has("FACULTY_PROJECT"),
      projectBank: openPhases.has("PROJECT_BANK"),
    };
  }

  async getAllPhases() {
    return projectSelectionModel.find().sort({ startDate: 1 });
  }

  async updatePhase(
    phaseId: string,
    data: {
      startDate?: string | Date;
      endDate?: string | Date;
      isActive?: boolean;
      confirmShorten?: boolean;
    },
  ) {
    if (!mongoose.isValidObjectId(phaseId))
      fail("Invalid selection phase id", 400, ERROR_CODES.VALIDATION_ERROR);
    if (data.isActive !== undefined && typeof data.isActive !== "boolean")
      fail("isActive must be a boolean", 400, ERROR_CODES.VALIDATION_ERROR);
    const phase = await projectSelectionModel.findById(phaseId);
    if (!phase) fail("Selection phase not found", 404, ERROR_CODES.NOT_FOUND);
    const validPhase = phase!;

    const { start, end } = this.resolveWindow(
      data.startDate,
      data.endDate,
      validPhase,
    );
    const isActive = data.isActive ?? validPhase.isActive;

    // Shortening a window that is open right now can cut students off,
    // so the admin must explicitly confirm it.

    const now = new Date();
    const wasOpen =
      validPhase.isActive &&
      validPhase.startDate <= now &&
      validPhase.endDate >= now;
    if (
      wasOpen &&
      isActive &&
      end < validPhase.endDate &&
      data.confirmShorten !== true
    )
      fail(
        "Shortening an open selection window requires confirmation (confirmShorten: true)",
        409,
        ERROR_CODES.VALIDATION_ERROR,
      );

    // Only this phase's record is touched; applications are not modified.
    
    validPhase.startDate = start;
    validPhase.endDate = end;
    validPhase.isActive = isActive;
    return validPhase.save();
  }
}

export = new ProjectSelectionService();
