import { apiFetch, ENDPOINTS } from "./api";
import { getUserRole } from "./auth";

export async function getMyProfile() {
    const role = getUserRole();

    if (role === "student") {
        return apiFetch(ENDPOINTS.studentProfile);
    }

    if (role === "teacher") {
        return apiFetch(ENDPOINTS.teacherProfile);
    }

    throw new Error("Profile is not available for this role.");
}

export async function updateMyProfile({ phoneNo, imageFile }) {
    const formData = new FormData();

    if (phoneNo) {
        formData.append("phoneNo", phoneNo);
    }

    if (imageFile) {
        formData.append("file", imageFile);
    }

    return apiFetch("/api/user/updateProfile", {
        method: "PUT",
        body: formData,
    });
}