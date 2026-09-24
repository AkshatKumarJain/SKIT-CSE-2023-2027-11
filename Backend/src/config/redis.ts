import { createClient } from "redis";

const redisURL = process.env.REDIS_URL || "redis://localhost:6379"

// const redis = createClient({url: redisURL});

// async function run(){
//     // open connection to redis server
//     await redis.connect();
//     console.log("Redis is connected");
//     console.log("ping", await redis.ping());
// }

// run().catch((error) => {
//     console.error("Redis connection failed! ", error);
//     process.exit(1);
// })

export const redisClient = createClient({url: redisURL});

redisClient.on("connect", () => {
    console.log("redis client connected")
});

redisClient.on("ready", () => {
    console.log("redis client ready")
});

redisClient.on("error", (error) => {
    console.log("error while connecting redis: ", error)
});

redisClient.on("end", () => {
    console.log("redis client connection closed")
});

export async function connectRedis(){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }
    const pong = await redisClient.ping();
    console.log("redis client got connected ", pong);
}

export async function disconnectRedis(){
    if(redisClient.isOpen){
        await redisClient.quit();
        console.log("redis client got disconnected");
    }
    else
        console.log("redis client was already disconnected");
}