import { apiFetch } from './api'
import { getAvailableMentors } from './applicationService'

export function getFacultyMembers() {
  return getAvailableMentors()
}

export function getFacultyProjects() {
  return apiFetch('/api/projects/faculty')
}