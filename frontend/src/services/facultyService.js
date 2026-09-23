import { apiFetch } from './api'

export function getFacultyMembers() {
  return apiFetch('/faculty')
}

export function getFacultyProjects() {
  return apiFetch('/faculty-projects')
}