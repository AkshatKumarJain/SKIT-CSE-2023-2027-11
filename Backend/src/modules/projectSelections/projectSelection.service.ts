import mongoose from "mongoose";
import projectSelectionModel from "./projectSelection.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { SelectionPhase } from "./projectSelection.type";

const fail = (message: string, status: number, code: string): never => {
    throw new AppError(message, status, code);
};

class ProjectSelectionService {
    private validateDates(startDate: string | Date | undefined, endDate: string | Date | undefined) {
        const rawStart = startDate;
        const rawEnd = endDate;
        if (!rawStart || !rawEnd) fail("startDate and endDate are required", 400, ERROR_CODES.VALIDATION_ERROR);
        const start = new Date(rawStart!);
        const end = new Date(rawEnd!);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) fail("Invalid selection dates", 400, ERROR_CODES.VALIDATION_ERROR);
        if (start >= end) fail("End date must be after start date", 400, ERROR_CODES.VALIDATION_ERROR);
        return { start, end };
    }

    private async ensureNoOverlap(phase: SelectionPhase, start: Date, end: Date, excludeId?: string) {
        const filter: {
            _id?: { $ne: string };
            isActive: true;
            startDate: { $lt: Date };
            endDate: { $gt: Date };
        } = {
            isActive: true,
            startDate: { $lt: end },
            endDate: { $gt: start }
        };
        if (excludeId) {
            if (!mongoose.isValidObjectId(excludeId)) fail("Invalid selection phase id", 400, ERROR_CODES.VALIDATION_ERROR);
            filter._id = { $ne: excludeId };
        }
        const overlap = await projectSelectionModel.findOne(filter);
        if (overlap && overlap.phase !== phase) fail("Selection phases cannot overlap", 409, ERROR_CODES.VALIDATION_ERROR);
    }

    async createPhase(data: { phase?: SelectionPhase; startDate?: string | Date; endDate?: string | Date; isActive?: boolean }) {
        const phase = data.phase;
        if (!phase) fail("phase is required", 400, ERROR_CODES.VALIDATION_ERROR);
        const existing = await projectSelectionModel.findOne({ phase: phase! });
        if (existing) fail("Selection phase already exists", 409, ERROR_CODES.VALIDATION_ERROR);
        const { start, end } = this.validateDates(data.startDate, data.endDate);
        const isActive = data.isActive ?? true;
        if (isActive) await this.ensureNoOverlap(phase!, start, end);
        return projectSelectionModel.create({ phase: phase!, startDate: start, endDate: end, isActive });
    }

    async isSelectionOpen(phase: SelectionPhase): Promise<boolean> {
        const now = new Date();
        return !!await projectSelectionModel.exists({ phase: phase!, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } });
    }

    async getCurrentPhase() {
        const now = new Date();
        const phases = await projectSelectionModel.find({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).sort({ startDate: 1 });
        const current = phases[0];
        return {
            currentPhase: current?.phase ?? null,
            ownIdea: current?.phase === "OWN_IDEA",
            facultyProjects: current?.phase === "FACULTY_PROJECT",
            projectBank: current?.phase === "PROJECT_BANK"
        };
    }

    async getAllPhases() {
        return projectSelectionModel.find().sort({ startDate: 1 });
    }

    async updatePhase(phaseId: string, data: { startDate?: string | Date; endDate?: string | Date; isActive?: boolean }) {
        if (!mongoose.isValidObjectId(phaseId)) fail("Invalid selection phase id", 400, ERROR_CODES.VALIDATION_ERROR);
        const phase = await projectSelectionModel.findById(phaseId);
        if (!phase) fail("Selection phase not found", 404, ERROR_CODES.NOT_FOUND);
        const validPhase = phase!;
        const start = data.startDate === undefined ? validPhase.startDate : new Date(data.startDate);
        const end = data.endDate === undefined ? validPhase.endDate : new Date(data.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) fail("Invalid selection dates", 400, ERROR_CODES.VALIDATION_ERROR);
        if (start >= end) fail("End date must be after start date", 400, ERROR_CODES.VALIDATION_ERROR);
        const isActive = data.isActive ?? validPhase.isActive;
        if (isActive) await this.ensureNoOverlap(validPhase.phase, start, end, phaseId);
        validPhase.startDate = start;
        validPhase.endDate = end;
        validPhase.isActive = isActive;
        return validPhase.save();
    }
}

export = new ProjectSelectionService();
