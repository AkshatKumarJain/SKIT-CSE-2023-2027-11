import mongoose from "mongoose";
import "dotenv/config"

const mongo_uri = process.env.MONGO_URI;
const db_name = process.env.DB_NAME;

export const connectDB = async () => {
    try {
        await mongoose.connect(`${mongo_uri}${db_name}`);
        console.log(`The database is connected at ${mongo_uri}${db_name}.`)
    } catch (error) {
        console.error("error: ", error);
    }
}
