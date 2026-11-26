import type { RequestHandler } from "express";

type AuthModule = typeof import("redis-jwt-auth", {
    with: { "resolution-mode": "import" },
});

let authModule: Promise<AuthModule> | undefined;

export function loadAuth() {
    // Native import selects the ESM entry point in both development and production.
    return authModule ??= import("redis-jwt-auth");
}

export function authMiddleware(options?: Parameters<AuthModule["authMiddleware"]>[0]): RequestHandler {
    return async (req, res, next) => (await loadAuth()).authMiddleware(options)(req, res, next);
}

export function authorizeRole(...roles: string[]): RequestHandler {
    return async (req, res, next) => (await loadAuth()).authorizeRole(...roles)(req, res, next);
}
