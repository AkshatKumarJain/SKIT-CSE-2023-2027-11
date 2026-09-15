import express from "express";
import "dotenv/config"
import cors from "cors";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import userRouter from "./modules/users/user.route.js";
import {connectRedis, disconnectRedis} from "./config/redis.js";

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


// last
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
    await disconnectRedis();
    process.exit(1);
})