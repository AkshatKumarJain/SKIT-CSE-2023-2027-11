import { apiFetch } from './api'
import { normalizeProject } from './facultyService'

export async function getProjectBankItems() {
  const projects = await apiFetch('/projects/bank')
  return projects.map(normalizeProject)
}
