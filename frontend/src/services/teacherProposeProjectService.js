import { apiFetch, ENDPOINTS } from "./api";

export async function createTeacherProject(projectData) {
  return apiFetch(ENDPOINTS.projects, {
    method: "POST",
    body: JSON.stringify(projectData),
  });
}