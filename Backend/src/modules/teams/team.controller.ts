import { Request, Response } from "express";
import { AsyncHandler } from "../../middlewares/asyncHandler";
import teamService from "./team.service";

const getUserId = (req: Request): string => req.user?.userId || "";

const requireStudent = (req: Request): string => {
    const userId = getUserId(req);
    if (!userId) throw new Error("Authenticated user id is missing");
    return userId;
};

class TeamController {
    create = AsyncHandler(async (req: Request, res: Response) => {
        const team = await teamService.createTeam(requireStudent(req));
        res.status(201).json({ message: "Team created successfully", team });
    });

    myTeam = AsyncHandler(async (req: Request, res: Response) => {
        const team = await teamService.getMyTeam(requireStudent(req));
        res.status(200).json({ team });
    });

    availableMembers = AsyncHandler(async (req: Request, res: Response) => {
        const students = await teamService.getAvailableMembers(requireStudent(req), req.params.teamId);
        res.status(200).json({ students });
    });

    getById = AsyncHandler(async (req: Request, res: Response) => {
        const team = await teamService.getTeam(requireStudent(req), req.params.teamId);
        res.status(200).json({ team });
    });

    complete = AsyncHandler(async (req: Request, res: Response) => {
        const team = await teamService.completeTeam(requireStudent(req), req.params.teamId);
        res.status(200).json({ message: "Team completed successfully", team });
    });
}

export default new TeamController();
