import express from "express"; import {authMiddleware} from "redis-jwt-auth"; import type {RequestHandler} from "express"; import c from "./team.controller";
const auth=authMiddleware({required:true}) as RequestHandler; const r=express.Router();
r.post("/",auth,c.create); r.get("/my",auth,c.mine); r.get("/available-members",auth,c.available); r.get("/:teamId",auth,c.byId); r.patch("/:teamId/complete",auth,c.complete); r.post("/:teamId/requests",auth,c.request); r.get("/:teamId/requests",auth,c.requests); export default r;
