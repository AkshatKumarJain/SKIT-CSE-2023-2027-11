import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): Response => {
    console.log(err);

    if(err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message
        });
    }

    return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: 
            process.env.NODE_ENV === "production" ? "something went wrong" : err instanceof Error ? err.message : "Unknown error"
    });
};