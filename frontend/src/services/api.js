
 // Shared HTTP layer for every service that talks to the real backend.
//
// Backend responses look like { success: true, data, message? }.
// apiFetch unwraps `data` for callers and throws ApiError on non-2xx responses.

import { refreshAccessToken, clearAuthData } from "./authService";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://noncasuistical-rolf-unurged.ngrok-free.dev";

// Route prefixes each backend module is mounted on.
export const ENDPOINTS = {
  projects: "/api/projects",
  selections: "/api/project-selection",
  applications: "/api/applications",
  studentProfile: "/api/student/me",
  teacherProfile: "/api/teacher/me",
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Allow only one token refresh at a time for requests using apiFetch.
let refreshPromise = null;

function refreshAccessTokenOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}, isRetry = false) {
  const method = options.method || "GET";

  // Read the token immediately before each request so retries use the
  // latest access token saved by refreshAccessToken().
  const accessToken = localStorage.getItem("accessToken");

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
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

  // If the access token has expired, refresh it and retry the original
  // request once. Some backend middleware may return 403 instead of 401.
  if (
    (response.status === 401 || response.status === 403) &&
    !isRetry
  ) {
    try {
      await refreshAccessTokenOnce();
    } catch {
      clearAuthData();

      throw new ApiError(
        "Your session has expired. Please log in again.",
        response.status
      );
    }

    // Keep retry errors separate from refresh errors. A failed retry
    // should not automatically clear the user's authentication data.
    return apiFetch(path, options, true);
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
