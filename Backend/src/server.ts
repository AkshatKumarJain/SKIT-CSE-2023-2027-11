import express from "express";
import "dotenv/config"
import { connectDB } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
import userRouter from "./modules/users/user.route";
import projectRoute from "./modules/projects/project.route";
import projectApplicationRoute from "./modules/projectApplications/projectApplication.route";
import projectSelectionRoute from "./modules/projectSelections/projectSelection.route";
import teamRoute from "./modules/teams/team.route";
import teamRequestRoute from "./modules/teamRequests/teamRequest.route";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

connectDB();

const PORT = process.env.PORT || 8000;

app.use("/api/user/", userRouter);
app.use("/api/projects/", projectRoute);
app.use("/api/project-applications/", projectApplicationRoute);
app.use("/api/project-selection/", projectSelectionRoute);
app.use("/api/teams/", teamRoute);
app.use("/api/team-requests/", teamRequestRoute);

// last
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});