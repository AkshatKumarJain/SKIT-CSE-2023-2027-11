// Shared HTTP layer for every service that talks to the real backend.
//
// Backend responses look like { success: true, data, message? }.
// apiFetch unwraps `data` for callers and throws ApiError (with the backend's
// message) on any non-2xx response, so pages only need try/catch.

import { refreshAccessToken, clearAuthData } from "./authService";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://noncasuistical-rolf-unurged.ngrok-free.dev";

// Route prefixes each backend module is mounted on.
export const ENDPOINTS = {
  projects: "/api/projects",
  selections: "/api/project-selections",
  applications: "/api/applications",
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(path, options = {}, isRetry = false) {
  const method = options.method || "GET";
  const accessToken = localStorage.getItem("accessToken");

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Please check your connection and try again.",
      0
    );
  }

  // If access token has expired, refresh it and retry the original request once.
  if (response.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();

      return apiFetch(path, options, true);
    } catch {
      clearAuthData();

      throw new ApiError(
        "Your session has expired. Please log in again.",
        401
      );
    }
  }

  // Read as text first so non-JSON error bodies can still be reported.
  const raw = await response.text().catch(() => "");
  let body = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok || body?.success === false) {
    const fromBody =
      body?.message ||
      body?.error?.message ||
      (typeof body?.error === "string" ? body.error : null);

    const looksLikeText =
      !body && raw && !raw.trim().startsWith("<");

    const fromText = looksLikeText
      ? raw.trim().slice(0, 200)
      : null;

    const where = `${method} ${BASE_URL}${path}`;

    const hint =
      response.status >= 500 && !raw
        ? " (empty response - the backend may be down, or the dev proxy cannot reach it)"
        : "";

    throw new ApiError(
      fromBody ||
        fromText ||
        `Request failed with status ${response.status} on ${where}${hint}`,
      response.status
    );
  }

  return body &&
    typeof body === "object" &&
    "data" in body
    ? body.data
    : body;
}

// Still used by the parts that are mocked (team selection).
export function mockRequest(data, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}