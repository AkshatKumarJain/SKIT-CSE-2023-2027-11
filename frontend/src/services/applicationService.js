import { apiFetch, ENDPOINTS } from './api'

const base = ENDPOINTS.applications

// POST body: { teamId, mentorId, mobileNumber?, projectDetails: {
//   title, domain, problemStatement, description, expectedOutcome?, sdgGoals?, technologyStack? } }
export function submitOwnIdea(payload) {
  return apiFetch(`${base}/own-idea`, { method: 'POST', body: JSON.stringify(payload) })
}

// POST body: { teamId, projectId, mentorId, mobileNumber? }
export function applyFacultyProject(payload) {
  return apiFetch(`${base}/faculty-project`, { method: 'POST', body: JSON.stringify(payload) })
}

// POST body: { teamId, projectId, mentorId, mobileNumber? }
export function applyProjectBank(payload) {
  return apiFetch(`${base}/project-bank`, { method: 'POST', body: JSON.stringify(payload) })
}

export function getMyApplications() {
  return apiFetch(`${base}/my`)
}

export function getApplicationById(applicationId) {
  return apiFetch(`${base}/${applicationId}`)
}

// Teachers who still have mentor capacity (student-only route)
export function getAvailableMentors() {
  return apiFetch(`${base}/available-mentors`)
}
