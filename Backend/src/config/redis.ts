import { createClient } from "redis";

const redisURL = process.env.REDIS_URL || "redis://localhost:6379"

const redis = createClient({url: redisURL});

async function run(){
    // open connection to redis server
    await redis.connect();
    console.log("Redis is connected");
    console.log("ping", await redis.ping());
}

run().catch((error) => {
    console.error("Redis connection failed! ", error);
    process.exit(1);
})