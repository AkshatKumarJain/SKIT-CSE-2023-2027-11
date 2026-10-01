import { apiFetch } from './api'

const phaseMeta = {
  OWN_IDEA: {
    number: 1,
    title: 'Student Proposed Idea',
    description: 'Submit your own project proposal and select a mentor.',
    route: '/project-selection/student-idea',
    actionLabel: 'Propose Your Idea'
  },
  FACULTY_PROJECT: {
    number: 2,
    title: 'Faculty Proposed Projects',
    description: 'Choose from projects proposed by faculty members.',
    route: '/project-selection/faculty',
    actionLabel: 'Browse Faculty Projects'
  },
  PROJECT_BANK: {
    number: 3,
    title: 'Project Bank',
    description: 'Choose an available project from the project bank.',
    route: '/project-selection/bank',
    actionLabel: 'Browse Project Bank'
  }
}

function getStatus(startDate, endDate, isActive) {
  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (isActive && now >= start && now < end) return 'OPEN'
  if (now < start) return 'UPCOMING'
  return 'CLOSED'
}

function normalizePhase(item) {
  const meta = phaseMeta[item.phase] || { number: 0, title: item.phase, description: '', route: '/project-selection', actionLabel: 'Open' }
  const status = getStatus(item.startDate, item.endDate, item.isActive)
  return {
    id: item._id,
    phase: item.phase,
    number: meta.number,
    title: meta.title,
    description: meta.description,
    route: meta.route,
    actionLabel: meta.actionLabel,
    status,
    startDate: item.startDate,
    endDate: item.endDate,
    windowLabel: `${new Date(item.startDate).toLocaleString()} – ${new Date(item.endDate).toLocaleString()}`
  }
}

export async function getProjectSelectionStages() {
  const phases = await apiFetch('/project-selection')
  return phases.map(normalizePhase).sort((a, b) => a.number - b.number)
}

export async function getProjectSelectionStage(phase) {
  const phases = await getProjectSelectionStages()
  const aliases = { 'student-idea': 'OWN_IDEA', 'faculty-project': 'FACULTY_PROJECT', 'project-bank': 'PROJECT_BANK' }
  return phases.find((item) => item.phase === (aliases[phase] || phase)) || null
}
