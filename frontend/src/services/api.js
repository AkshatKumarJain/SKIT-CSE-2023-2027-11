// Shared HTTP layer for every service that talks to the real backend.
//
// Backend responses look like { success: true, data, message? }.
// apiFetch unwraps `data` for callers and throws ApiError (with the backend's
// message) on any non-2xx response, so pages only need try/catch.

<<<<<<< HEAD
const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api'
=======
import { refreshAccessToken, clearAuthData } from "./authService";

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "/api";
>>>>>>> 18febcf9d91ad5b2a1780fad832778020fa6eb29

// Route prefixes each backend module is mounted on. If your Express app mounts
// them differently (e.g. app.use('/api/project-applications', ...)), change them here only.
export const ENDPOINTS = {
<<<<<<< HEAD
  projects: '/projects',
  selections: '/project-selections',
  applications: '/applications'
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, options = {}) {
  const method = options.method || 'GET'
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    })
  } catch {
    throw new ApiError('Unable to reach the server. Please check your connection and try again.', 0)
  }

  // Read as text first so non-JSON error bodies (plain text, empty) can still be reported.
  const raw = await response.text().catch(() => '')
  let body = null
  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    body = null
=======
  projects: "/projects",
  selections: "/project-selections",
  applications: "/applications",
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

  // Read as text first so non-JSON error bodies (plain text, empty) can still be reported.
  const raw = await response.text().catch(() => "");
  let body = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
>>>>>>> 18febcf9d91ad5b2a1780fad832778020fa6eb29
  }

  if (!response.ok || body?.success === false) {
    const fromBody =
      body?.message ||
      body?.error?.message ||
<<<<<<< HEAD
      (typeof body?.error === 'string' ? body.error : null)
    const looksLikeText = !body && raw && !raw.trim().startsWith('<')
    const fromText = looksLikeText ? raw.trim().slice(0, 200) : null
    const where = `${method} ${BASE_URL}${path}`
    const hint =
      response.status >= 500 && !raw
        ? ' (empty response - the backend may be down, or the dev proxy cannot reach it)'
        : ''
    throw new ApiError(
      fromBody || fromText || `Request failed with status ${response.status} on ${where}${hint}`,
      response.status
    )
  }

  return body && typeof body === 'object' && 'data' in body ? body.data : body
=======
      (typeof body?.error === "string" ? body.error : null);

    const looksLikeText =
      !body && raw && !raw.trim().startsWith("<");

    const fromText = looksLikeText ? raw.trim().slice(0, 200) : null;

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

  return body && typeof body === "object" && "data" in body
    ? body.data
    : body;
>>>>>>> 18febcf9d91ad5b2a1780fad832778020fa6eb29
}

// Still used by the parts that are mocked (team selection).
export function mockRequest(data, delay = 350) {
  return new Promise((resolve) => {
<<<<<<< HEAD
    setTimeout(() => resolve(data), delay)
  })
}
=======
    setTimeout(() => resolve(data), delay);
  });
}
>>>>>>> 18febcf9d91ad5b2a1780fad832778020fa6eb29
