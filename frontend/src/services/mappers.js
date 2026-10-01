// Converts backend documents into the shapes the pages already render.
// Keeping this in one file means a backend field rename is a one-line fix here.

// ---------- projects ----------

export function mapProject(project) {
  const faculty =
    project.facultyId && typeof project.facultyId === 'object' ? project.facultyId : null
  const creator =
    project.createdBy && typeof project.createdBy === 'object' ? project.createdBy : null
  const owner = faculty || creator

  return {
    id: project._id,
    title: project.title,
    domain: project.domain,
    problemStatement: project.problemStatement || '',
    description: project.description,
    expectedOutcome: project.expectedOutcome || '',
    technologies: project.technologyStack || [],
    sdgGoals: project.sdgGoals || [],
    source: project.source,
    maxTeamSize: project.maxTeamSize,
    visibilityStatus: project.visibilityStatus,
    // Faculty who owns / approves the project. Used as the auto-assigned mentor
    // for faculty projects.
    facultyId: faculty ? faculty._id : project.facultyId || null,
    faculty: owner?.name || '',
    mentor: faculty ? mapMentor(faculty) : null
  }
}

// ---------- mentors / faculty ----------

export function mapMentor(teacher) {
  return {
    id: teacher._id,
    name: teacher.name || '',
    email: teacher.email || '',
    phoneNo: teacher.phoneNo || '',
    // Not stored on the backend user record yet. Pages hide these when empty.
    department: teacher.department || '',
    designation: teacher.designation || '',
    specialization: teacher.specialization || ''
  }
}

// ---------- selection stages ----------

const shortDate = { day: 'numeric', month: 'short' }
const longDate = { day: 'numeric', month: 'short', year: 'numeric' }

function fmt(date, options) {
  return date.toLocaleDateString('en-IN', options)
}

// The backend only stores { phase, startDate, endDate, isActive }. Titles, copy,
// routes and button labels are UI content, so they live here.
export const STAGE_CONFIG = [
  {
    id: 'student-idea',
    phase: 'OWN_IDEA',
    currentKey: 'ownIdea',
    number: 1,
    title: 'Student Proposed Idea',
    description:
      'Propose an original project idea with your own team and request a mentor for guidance.',
    whatHappens: [
      'Submit a project title, problem statement, description, technologies and SDG alignment',
      'Select a preferred faculty mentor',
      'Coordinator and mentor review and approve your proposal'
    ],
    route: '/project-selection/student-idea',
    actionLabel: 'Start Proposal'
  },
  {
    id: 'faculty-project',
    phase: 'FACULTY_PROJECT',
    currentKey: 'facultyProjects',
    number: 2,
    title: 'Faculty Proposed Project',
    description:
      'Browse projects floated by faculty members and apply for one that matches your interest.',
    whatHappens: [
      'View project topics listed by faculty across departments',
      'Read the full project description and technologies used',
      'Apply directly under the concerned faculty mentor',
      'Only one team can be picked per project, on a first-come basis'
    ],
    route: '/project-selection/faculty',
    actionLabel: 'Browse Projects'
  },
  {
    id: 'project-bank',
    phase: 'PROJECT_BANK',
    currentKey: 'projectBank',
    number: 3,
    title: 'Project Bank',
    description:
      'Pick a pre-approved project from the department project bank if you have not been allotted one yet.',
    whatHappens: [
      'Browse previously approved and archived project topics',
      'Filter by domain and check availability',
      'Select a project and choose your own mentor to auto-generate your proposal',
      'Only one team can be picked per project, on a first-come basis'
    ],
    route: '/project-selection/bank',
    actionLabel: 'View Project Bank'
  }
]

// `current` = GET /project-selections/current  ({ ownIdea, facultyProjects, projectBank })
// `window`  = the phase document from GET /project-selections (or undefined if admin hasn't created it)
export function buildStage(config, window, current, now = new Date()) {
  const base = { ...config, status: 'UPCOMING', windowLabel: 'Dates not announced yet', endDate: null, endLabel: '' }
  if (!window) return base

  const start = new Date(window.startDate)
  const end = new Date(window.endDate)
  const endLabel = fmt(end, shortDate)
  const common = { ...base, endDate: window.endDate, endLabel }

  // The server decides what is open, so client clock skew can never unlock a stage.
  if (current?.[config.currentKey]) {
    return { ...common, status: 'OPEN', windowLabel: `Open until ${fmt(end, longDate)}` }
  }
  if (!window.isActive) {
    return { ...common, status: 'CLOSED', windowLabel: 'Not accepting submissions right now' }
  }
  if (now < start) {
    return { ...common, status: 'UPCOMING', windowLabel: `Opens ${fmt(start, longDate)}` }
  }
  return { ...common, status: 'CLOSED', windowLabel: `Closed on ${fmt(end, longDate)}` }
}
