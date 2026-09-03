import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role?: string;
        iat?: number;
        exp?: number;
      };
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