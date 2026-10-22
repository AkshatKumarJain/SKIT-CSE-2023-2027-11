
import { apiFetch } from "./api";

export async function changePassword({
    currentPassword,
    newPassword,
    confirmPassword,
}) {
    return apiFetch("/api/user/change-password", {
        method: "PATCH",
        body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
        }),
    });
}
