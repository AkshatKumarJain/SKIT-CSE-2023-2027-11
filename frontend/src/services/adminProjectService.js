import { apiFetch } from './api'

const API_PREFIX = ''

function mapProject(raw) {
  return {
    id: raw._id,
    title: raw.title,
    domain: raw.domain,
    description: raw.description,
    specificFunctionalities: raw.specificFunctionalities || [],
    technologies: raw.technologies || [],
    sdgGoals: raw.sdgGoals || [],
    visibilityStatus: raw.visibilityStatus,
    source: raw.source,
    facultyName: raw.facultyId?.name || '',
    facultyEmail: raw.facultyId?.email || '',
    createdByName: raw.createdBy?.name || '',
    createdAt: raw.createdAt
  }
}

export function getProjectBankProjects() {
  return apiFetch(`${API_PREFIX}/projects`).then((list) =>
    (list || [])
      .filter((project) => project.source === 'PROJECT_BANK')
      .map(mapProject)
  )
}

export function createProjectBankProject(payload) {
  return apiFetch(`${API_PREFIX}/projects`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, source: 'PROJECT_BANK' })
  }).then(mapProject)
}

export function hideProjectBankProject(projectId) {
  return apiFetch(`${API_PREFIX}/projects/${projectId}/hide`, {
    method: 'PATCH'
  })
}

export function getFacultyApprovers() {
  return apiFetch(`${API_PREFIX}/project-applications/available-mentors`).then(
    (list) =>
      (list || []).map((faculty) => ({
        id: faculty._id,
        name: faculty.name,
        email: faculty.email || ''
      }))
  )
}
