import { apiFetch, ENDPOINTS } from './api'
import { getAvailableMentors } from './applicationService'
import { mapMentor, mapProject } from './mappers'

// GET /projects/faculty - only projects with visibilityStatus AVAILABLE are returned
export async function getFacultyProjects() {
  const projects = await apiFetch(`${ENDPOINTS.projects}/faculty`)
  return projects.map(mapProject)
}

// Mentor list for the picker. Backed by GET /applications/available-mentors, which
// already hides teachers who have reached the 3-application limit.
export async function getFacultyMembers() {
  const mentors = await getAvailableMentors()
  return mentors.map(mapMentor)
}
