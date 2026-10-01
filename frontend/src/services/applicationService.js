import { apiFetch } from './api'

export function submitOwnIdea(payload) {
  return apiFetch('/project-applications/own-idea', { method: 'POST', body: JSON.stringify(payload) })
}

export function applyFacultyProject(payload) {
  return apiFetch('/project-applications/faculty-project', { method: 'POST', body: JSON.stringify(payload) })
}

export function applyProjectBank(payload) {
  return apiFetch('/project-applications/project-bank', { method: 'POST', body: JSON.stringify(payload) })
}

export function getMyApplications() {
  return apiFetch('/project-applications/my')
}

export function getApplicationById(applicationId) {
  return apiFetch(`/project-applications/${applicationId}`)
}

export function getAvailableMentors() {
  return apiFetch('/project-applications/available-mentors')
}

export function getFacultyApplications() {
  return apiFetch('/project-applications/faculty')
}

export function approveFacultyApplication(applicationId, approved, comment = '', rejectionReason = '') {
  return apiFetch(`/project-applications/${applicationId}/faculty-approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approved, comment, rejectionReason })
  })
}
