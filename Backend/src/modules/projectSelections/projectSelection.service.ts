import projectSelectionModel
    from "./projectSelection.model";

import { AppError }
    from "../../errors/AppError";

import { ERROR_CODES }
    from "../../errors/errorCodes";


class ProjectSelectionService {


    // CREATE / SET PHASE

    async createPhase(data: any) {

        const existing =
            await projectSelectionModel.findOne({
                phase: data.phase
            });


        if (existing) {

            throw new AppError(
                "Selection phase already exists",
                400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        if (
            new Date(data.startDate) >=
            new Date(data.endDate)
        ) {

            throw new AppError(
                "End date must be after start date",
                400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        return await projectSelectionModel.create({
            phase: data.phase,

            startDate: data.startDate,

            endDate: data.endDate,

            isActive:
                data.isActive ?? true
        });
    }


    // CURRENT PHASE

    async getCurrentPhase() {

        const now = new Date();


        const phase =
            await projectSelectionModel.findOne({

                isActive: true,

                startDate: {
                    $lte: now
                },

                endDate: {
                    $gte: now
                }

            });


        if (!phase) {

            return {
                currentPhase: null,

                ownIdea: false,

                facultyProjects: false,

                projectBank: false
            };
        }


        return {

            currentPhase: phase.phase,

            ownIdea:
                phase.phase === "OWN_IDEA",

            facultyProjects:
                phase.phase === "FACULTY_PROJECT",

            projectBank:
                phase.phase === "PROJECT_BANK"
        };
    }


    // GET ALL PHASES

    async getAllPhases() {

        return await projectSelectionModel
            .find()
            .sort({
                startDate: 1
            });
    }


    // UPDATE PHASE

    async updatePhase(
        phaseId: string,
        data: any
    ) {

        const phase =
            await projectSelectionModel
                .findByIdAndUpdate(
                    phaseId,
                    data,
                    {
                        new: true,
                        runValidators: true
                    }
                );


        if (!phase) {

            throw new AppError(
                "Selection phase not found",
                404,
                ERROR_CODES.NOT_FOUND
            );
        }


        return phase;
    }
}


export = new ProjectSelectionService();