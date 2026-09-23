import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
import userRouter from "./modules/users/user.route";

import projectRoute from "./modules/projects/project.route";
import projectApplicationRoute from "./modules/projectApplications/projectApplication.route";
import projectSelectionRoute from "./modules/projectSelections/projectSelection.route";


import { connectRedis, disconnectRedis } from "./config/redis";

const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());

connectRedis();

connectDB();

app.get("/health", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

const PORT = process.env.PORT || 8000;

app.use("/api/user/", userRouter);
app.use("/api/projects/", projectRoute);
app.use("/api/project-applications/", projectApplicationRoute);
app.use("/api/project-selection/", projectSelectionRoute);


// last
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
    await disconnectRedis();
    process.exit(1);
})