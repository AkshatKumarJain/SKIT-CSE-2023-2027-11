import { apiFetch, ENDPOINTS } from './api'
import { mapProject } from './mappers'

// GET /projects/bank - only projects with visibilityStatus AVAILABLE are returned
export async function getProjectBankItems() {
  const projects = await apiFetch(`${ENDPOINTS.projects}/bank`)
  return projects.map(mapProject)
}
