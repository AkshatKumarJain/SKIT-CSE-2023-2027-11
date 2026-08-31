import express from "express";
import "dotenv/config"
import { connectDB } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
import userRouter from "./modules/users/user.route";

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


// last
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});