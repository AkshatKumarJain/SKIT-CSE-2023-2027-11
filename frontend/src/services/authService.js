import { setUserRole, clearUserRole } from "./auth";

const API_BASE_URL =
  "https://noncasuistical-rolf-unurged.ngrok-free.dev";

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  const accessToken = data.token?.accessToken;
  const refreshToken = data.token?.refreshToken;

  if (!accessToken) {
    throw new Error("Access token not received.");
  }

  localStorage.setItem("accessToken", accessToken);

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const role = payload.role;

    if (!role) {
      throw new Error("User role not found in access token.");
    }

    setUserRole(role);
  } catch (error) {
    clearUserRole();
    throw new Error("Failed to read user role from access token.");
  }

  return data;
}

export async function logoutUser() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error("User is not logged in.");
  }

  const response = await fetch(`${API_BASE_URL}/api/user/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  clearUserRole();

  return data;
}

export function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  clearUserRole();
}