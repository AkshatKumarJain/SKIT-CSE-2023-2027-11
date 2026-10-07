export function mapProject(project) {
  const faculty =
    project.facultyId && typeof project.facultyId === 'object'
      ? project.facultyId
      : null

  const creator =
    project.createdBy && typeof project.createdBy === 'object'
      ? project.createdBy
      : null

  const owner = faculty || creator

  return {
    id: project._id,
    _id: project._id,
    title: project.title,
    domain: project.domain,
    problemStatement: project.problemStatement || '',
    description: project.description || '',
    specificFunctionalities: project.specificFunctionalities || [],
    expectedOutcome: project.expectedOutcome || '',
    technologies: project.technologies || [],
    sdgGoals: project.sdgGoals || [],
    source: project.source,
    maxTeamSize: project.maxTeamSize,
    visibilityStatus: project.visibilityStatus,
    facultyId: faculty ? faculty._id : project.facultyId || null,
    faculty: owner?.name || '',
    mentor: faculty ? mapMentor(faculty) : null
  }
}