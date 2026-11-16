import mongoose from "mongoose";
import "dotenv/config";

const mongo_uri = process.env.MONGO_URI;
const db_name = process.env.DB_NAME;

export const connectDB = async () => {
    try {
        if (!mongo_uri) {
            throw new Error("MONGO_URI is not defined");
        }

        if (!db_name) {
            throw new Error("DB_NAME is not defined");
        }
        
        await mongoose.connect(mongo_uri, {
            dbName: db_name
        });
        
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};