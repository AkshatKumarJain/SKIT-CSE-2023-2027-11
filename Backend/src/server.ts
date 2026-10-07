import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import "dotenv/config";
import cors from "cors";

import { connectDB } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";

import userRouter from "./modules/users/user.route";
import userRouter from "./modules/users/user.route";
import studentRouter from "./modules/students/student.route";
import teacherRouter from "./modules/teachers/teacher.route";
import projectRoute from "./modules/projects/project.route";
import projectApplicationRoute from "./modules/projectApplications/projectApplication.route";
import projectSelectionRoute from "./modules/projectSelections/projectSelection.route";
import teamRoute from "./modules/teams/team.route";
import teamRequestRoute from "./modules/teamRequests/teamRequest.route";

import { connectRedis, disconnectRedis } from "./config/redis";

const app = express();

const PORT = process.env.PORT || 8000;

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        
        credentials: true,
    })
);

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        message: "Server is running",
    });
});

app.use("/api/user/", userRouter);
app.use("/api/projects/", projectRoute);
app.use("/api/project-applications/", projectApplicationRoute);
app.use("/api/project-selection/", projectSelectionRoute);
app.use("/api/teams/", teamRoute);
app.use("/api/team-requests/", teamRequestRoute);
app.use("/api/student/", studentRouter);
app.use("/api/teacher/", teacherRouter);

app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();

        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();

process.on("SIGINT", async () => {
    await disconnectRedis();
    process.exit(0);
});