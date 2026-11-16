import { apiFetch } from "./api";
import { getAvailableMentors } from "./applicationService";

export function getFacultyMembers() {
  return getAvailableMentors();
}

// Existing function — keep the existing endpoint unchanged.
export function getFacultyProjects() {
  return apiFetch("/api/projects/faculty");
}

// Fetch projects uploaded by the logged-in faculty member.
// Fetch projects uploaded by the logged-in faculty member.
export async function getMyUploadedProjects() {
  const response = await apiFetch(
    "/api/faculty-projects/uploaded-projects/"
  );

  return Array.isArray(response) ? response : [];
}

// Fetch projects assigned to the logged-in faculty member for mentoring.
export async function getMyMentoredProjects() {
  const response = await apiFetch(
    "/api/faculty-projects/mentored-projects/"
  );

  return Array.isArray(response) ? response : [];
}