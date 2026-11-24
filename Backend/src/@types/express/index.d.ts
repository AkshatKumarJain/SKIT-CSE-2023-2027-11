import "express";
import type { JwtPayload } from "redis-jwt-auth" with { "resolution-mode": "import" };

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};


// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         userId: string;
//         role?: string;
//         email?: string;
//         tokenType?: "access" | "refresh";
//         jti?: string;
//         iat?: number;
//         exp?: number;
//       } | undefined;
//     }
//   }
// }
