import { apiFetch } from './api'

const STAGE_META = [
  {
    id: 'student-idea',
    phase: 'OWN_IDEA',
    number: 1,
    title: 'Student Proposed Idea',
    description:
      'Propose an original project idea with your own team and request a mentor for guidance.',
    whatHappens: [
      'Submit a project title, description, functionalities, technologies and SDG alignment',
      'Select a preferred faculty mentor',
      'Faculty coordinator reviews and approves your proposal'
    ],
    route: '/project-selection/student-idea',
    actionLabel: 'Start Proposal'
  },
  {
    id: 'faculty-project',
    phase: 'FACULTY_PROJECT',
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

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function deriveStatus(window, now) {
  if (!window || !window.isActive) return 'UPCOMING'
  const start = new Date(window.startDate)
  const end = new Date(window.endDate)
  if (now < start) return 'UPCOMING'
  if (now > end) return 'CLOSED'
  return 'OPEN'
}

function buildWindowLabel(window, status) {
  if (!window) return 'Schedule not announced yet'
  if (status === 'OPEN') return `Open until ${formatDate(window.endDate)}`
  if (status === 'UPCOMING') return `Opens ${formatDate(window.startDate)}`
  return `Closed on ${formatDate(window.endDate)}`
}

async function loadStages() {
  const windows = await apiFetch('/api/project-selection')
  const now = new Date()

  return STAGE_META.map((meta) => {
    const window = (windows || []).find((item) => item.phase === meta.phase)
    const status = deriveStatus(window, now)
    return {
      ...meta,
      status,
      windowLabel: buildWindowLabel(window, status)
    }
  })
}

export function getProjectSelectionStages() {
  return loadStages()
}

export async function getProjectSelectionStage(stageId) {
  const stages = await loadStages()
  return stages.find((stage) => stage.id === stageId) || null
}
