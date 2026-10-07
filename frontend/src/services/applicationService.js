import { apiFetch } from './api'

export function submitOwnIdea(payload) {
  return apiFetch('/api/project-applications/own-idea', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function applyFacultyProject(payload) {
  return apiFetch('/api/project-applications/faculty-project', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function applyProjectBank(payload) {
  return apiFetch('/api/project-applications/project-bank', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function getMyApplications() {
  return apiFetch('/api/project-applications/my')
}

export function getApplicationById(applicationId) {
  return apiFetch(`/api/project-applications/${applicationId}`)
}

export function getAvailableMentors() {
  return apiFetch('/api/project-applications/available-mentors').then(
    (list) =>
      (list || []).map((faculty) => ({
        id: faculty._id,
        name: faculty.name,
        department: faculty.department || '',
        specialization: faculty.specialization || '',
        email: faculty.email,
        phoneNo: faculty.phoneNo
      }))
  )
}