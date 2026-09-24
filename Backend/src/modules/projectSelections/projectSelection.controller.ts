import {
    Request,
    Response
} from "express";

import projectSelectionService
    from "./projectSelection.service";


class ProjectSelectionController {


    // CREATE PHASE

    async createPhase(
        req: Request,
        res: Response
    ): Promise<Response> {

        const phase =
            await projectSelectionService
                .createPhase(req.body);


        return res.status(201).json({

            message:
                "Project selection phase created successfully",

            data: phase

        });
    }


    // CURRENT PHASE

    async getCurrentPhase(
        req: Request,
        res: Response
    ): Promise<Response> {

        const phase =
            await projectSelectionService
                .getCurrentPhase();


        return res.status(200).json({

            message:
                "Current project selection phase fetched",

            data: phase

        });
    }


    // ALL PHASES

    async getAllPhases(
        req: Request,
        res: Response
    ): Promise<Response> {

        const phases =
            await projectSelectionService
                .getAllPhases();


        return res.status(200).json({

            message:
                "Selection phases fetched successfully",

            data: phases

        });
    }


    // UPDATE PHASE

    async updatePhase(
        req: Request,
        res: Response
    ): Promise<Response> {

        const { phaseId } =
            req.params;


        const phase =
            await projectSelectionService
                .updatePhase(
                    phaseId,
                    req.body
                );


        return res.status(200).json({

            message:
                "Selection phase updated successfully",

            data: phase

        });
    }
}


export = new ProjectSelectionController();