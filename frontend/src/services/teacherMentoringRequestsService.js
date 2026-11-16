
import { apiFetch } from "./api";

// Fetch requests for projects proposed by the logged-in teacher.
export async function getProposedProjectMentoringRequests() {
  const response = await apiFetch("/api/project-applications/faculty");

  return Array.isArray(response) ? response : [];
}

// Fetch student idea and Project Bank requests assigned to the teacher.
export async function getAssignedMentoringRequests() {
  const response = await apiFetch("/api/project-applications/mentor");

  return Array.isArray(response) ? response : [];
}

// Submit a decision for a teacher-proposed project request.
export function updateProposedProjectMentoringDecision(
  applicationId,
  approved,
  comment
) {
  return apiFetch(
    `/api/project-applications/${applicationId}/faculty-approval`,
    {
      method: "PATCH",
      body: JSON.stringify({ approved, comment }),
    }
  );
}

// Submit a decision for an assigned mentoring request.
export function updateAssignedMentoringDecision(
  applicationId,
  approved,
  comment
) {
  return apiFetch(
    `/api/project-applications/${applicationId}/mentor-approval`,
    {
      method: "PATCH",
      body: JSON.stringify({ approved, comment }),
    }
  );
}
