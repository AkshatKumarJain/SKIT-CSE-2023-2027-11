import { Request, Response } from "express";
import { AsyncHandler } from "../../middlewares/asyncHandler";
import teamRequestService from "./teamRequest.service";

const getUserId = (req: Request): string => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("Authenticated user id is missing");
    return userId;
};

class TeamRequestController {
    create = AsyncHandler(async (req: Request, res: Response) => {
        const { requestedStudentId } = req.body as { requestedStudentId?: string };
        const request = await teamRequestService.createRequest(getUserId(req), req.params.teamId, requestedStudentId || "");
        res.status(201).json({ message: "Team request created and notification sent", request });
    });

    listForTeam = AsyncHandler(async (req: Request, res: Response) => {
        const requests = await teamRequestService.getTeamRequests(getUserId(req), req.params.teamId);
        res.status(200).json({ requests });
    });

    myRequests = AsyncHandler(async (req: Request, res: Response) => {
        const requests = await teamRequestService.getMyRequests(getUserId(req));
        res.status(200).json({ requests });
    });

    accept = AsyncHandler(async (req: Request, res: Response) => {
        const result = await teamRequestService.acceptRequest(getUserId(req), req.params.requestId);
        res.status(200).json({ message: "Team request accepted", ...result });
    });

    reject = AsyncHandler(async (req: Request, res: Response) => {
        const request = await teamRequestService.rejectRequest(getUserId(req), req.params.requestId);
        res.status(200).json({ message: "Team request rejected", request });
    });

    cancel = AsyncHandler(async (req: Request, res: Response) => {
        const request = await teamRequestService.cancelRequest(getUserId(req), req.params.requestId);
        res.status(200).json({ message: "Team request cancelled", request });
    });
}

export default new TeamRequestController();
