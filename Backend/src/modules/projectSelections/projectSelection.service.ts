import mongoose from "mongoose";
import projectSelectionModel from "./projectSelection.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { SelectionPhase, SELECTION_PHASES } from "./projectSelection.type";

const parseDate = (value: unknown, field: string): Date => {
    const date = new Date(String(value));
    if (!value || Number.isNaN(date.getTime())) {
        throw new AppError(`${field} must be a valid date`, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    return date;
};

class ProjectSelectionService {
    private async assertNoOverlap(startDate: Date, endDate: Date, excludedId?: string) {
        const filter: Record<string, unknown> = {
            isActive: true,
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
        };

        if (excludedId) {
            if (!mongoose.isValidObjectId(excludedId)) {
                throw new AppError("Invalid phase ID", 400, ERROR_CODES.VALIDATION_ERROR);
            }
            filter._id = { $ne: excludedId };
        }

        const overlap = await projectSelectionModel.findOne(filter).lean();
        if (overlap) {
            throw new AppError("Selection phases cannot overlap", 409, ERROR_CODES.VALIDATION_ERROR);
        }
    }

    async createPhase(data: {
        phase: SelectionPhase;
        startDate: string | Date;
        endDate: string | Date;
        isActive?: boolean;
    }) {
        if (!SELECTION_PHASES.includes(data.phase)) {
            throw new AppError("Invalid selection phase", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const startDate = parseDate(data.startDate, "startDate");
        const endDate = parseDate(data.endDate, "endDate");
        if (startDate >= endDate) {
            throw new AppError("End date must be after start date", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const existing = await projectSelectionModel.findOne({ phase: data.phase });
        if (existing) {
            throw new AppError("Selection phase already exists", 409, ERROR_CODES.VALIDATION_ERROR);
        }

        if (data.isActive !== false) await this.assertNoOverlap(startDate, endDate);

        return projectSelectionModel.create({
            phase: data.phase,
            startDate,
            endDate,
            isActive: data.isActive ?? true
        });
    }

    async isSelectionOpen(phase: SelectionPhase): Promise<boolean> {
        const now = new Date();
        return !!await projectSelectionModel.findOne({
            phase,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).select("_id").lean();
    }

    async getCurrentPhase() {
        const now = new Date();
        const phases = await projectSelectionModel.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ startDate: 1 });

        const phase = phases[0]?.phase ?? null;
        return {
            currentPhase: phase,
            ownIdea: phase === "OWN_IDEA",
            facultyProjects: phase === "FACULTY_PROJECT",
            projectBank: phase === "PROJECT_BANK"
        };
    }

    async getAllPhases() {
        return projectSelectionModel.find().sort({ startDate: 1 });
    }

    async updatePhase(
        phaseId: string,
        data: Partial<{
            phase: SelectionPhase;
            startDate: string | Date;
            endDate: string | Date;
            isActive: boolean;
        }>
    ) {
        if (!mongoose.isValidObjectId(phaseId)) {
            throw new AppError("Invalid phase ID", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const phase = await projectSelectionModel.findById(phaseId);
        if (!phase) throw new AppError("Selection phase not found", 404, ERROR_CODES.NOT_FOUND);

        if (data.phase && !SELECTION_PHASES.includes(data.phase)) {
            throw new AppError("Invalid selection phase", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const startDate = data.startDate === undefined ? phase.startDate : parseDate(data.startDate, "startDate");
        const endDate = data.endDate === undefined ? phase.endDate : parseDate(data.endDate, "endDate");
        if (startDate >= endDate) {
            throw new AppError("End date must be after start date", 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const isActive = data.isActive ?? phase.isActive;
        if (isActive) await this.assertNoOverlap(startDate, endDate, phaseId);

        phase.phase = data.phase ?? phase.phase;
        phase.startDate = startDate;
        phase.endDate = endDate;
        phase.isActive = isActive;
        return phase.save();
    }
}

export = new ProjectSelectionService();
