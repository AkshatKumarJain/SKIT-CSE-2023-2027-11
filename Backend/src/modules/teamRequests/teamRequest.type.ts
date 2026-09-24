import mongoose,{HydratedDocument} from "mongoose";
export const TEAM_REQUEST_STATUSES=["PENDING","ACCEPTED","REJECTED","CANCELLED"] as const; export type TeamRequestStatus=typeof TEAM_REQUEST_STATUSES[number];
export interface ITeamRequest{_id:mongoose.Types.ObjectId;teamId:mongoose.Types.ObjectId;requesterId:mongoose.Types.ObjectId;requestedStudentId:mongoose.Types.ObjectId;status:TeamRequestStatus;createdAt?:Date;updatedAt?:Date;} export type TeamRequestDocument=HydratedDocument<ITeamRequest>;
