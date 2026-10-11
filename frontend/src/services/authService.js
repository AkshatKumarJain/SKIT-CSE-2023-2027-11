import { setUserRole, clearUserRole } from "./auth";

const API_BASE_URL =
  "https://congested-coherent-calculate.ngrok-free.dev";

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

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/user/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Token refresh failed");
  }

  const newAccessToken = data.newRefreshToken?.accessToken;
  const newRefreshToken = data.newRefreshToken?.refreshToken;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error("New tokens not received.");
  }

  localStorage.setItem("accessToken", newAccessToken);
  localStorage.setItem("refreshToken", newRefreshToken);

  return data;
}

export async function logoutUser() {
  let accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error("User is not logged in.");
  }

  let response = await fetch(`${API_BASE_URL}/api/user/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    await refreshAccessToken();

    accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("New access token not found.");
    }

    response = await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Logout failed");
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  clearUserRole();

  return data;
}

export async function forgotPassword(email) {
  const response = await fetch(
    `${API_BASE_URL}/api/user/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Failed to send reset instructions."
    );
  }

  return data;
}

export async function resetPassword(email, newPassword) {
  const response = await fetch(
    `${API_BASE_URL}/api/user/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        newPassword,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Failed to reset password."
    );
  }

  return data;
}

export function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  clearUserRole();
}