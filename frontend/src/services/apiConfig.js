const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");

export const API_REQUEST_HEADERS =
  new URL(API_BASE_URL).hostname.endsWith("ngrok-free.dev")
    ? { "ngrok-skip-browser-warning": "true" }
    : {};
