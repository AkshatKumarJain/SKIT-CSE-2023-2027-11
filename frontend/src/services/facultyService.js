import { apiFetch } from './api'

function normalizeProject(project) {
  const faculty = project.facultyId && typeof project.facultyId === 'object' ? project.facultyId : null
  const creator = project.createdBy && typeof project.createdBy === 'object' ? project.createdBy : null
  return {
    ...project,
    id: project._id,
    facultyId: faculty?._id || project.facultyId || null,
    faculty: faculty?.name || creator?.name || 'Faculty mentor',
    facultyDetails: faculty || creator || null,
    specificFunctionalities: project.specificFunctionalities || [],
    sdgGoals: project.sdgGoals || [],
    technologies: project.technologies || []
  }
}

export async function getFacultyProjects() {
  const projects = await apiFetch('/projects/faculty')
  return projects.map(normalizeProject)
}

export async function getFacultyMembers() {
  return apiFetch('/project-applications/available-mentors')
}

export { normalizeProject }
