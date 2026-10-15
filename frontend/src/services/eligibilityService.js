import { getMyTeam } from './teamService'
import { getMyApplications } from './applicationService'

const ACTIVE_STATUSES = [
  'ADMIN_REVIEW',
  'ADMIN_APPROVED',
  'MENTOR_REVIEW',
  'MENTOR_APPROVED',
  'FACULTY_REVIEW',
  'FACULTY_APPROVED',
  'ADMIN_FINAL_REVIEW',
  'APPROVED'
]

function readableStatus(status) {
  return String(status).replace(/_/g, ' ').toLowerCase()
}

export async function checkSubmissionEligibility() {
  const team = await getMyTeam()

  if (!team) {
    return {
      eligible: false,
      title: 'You need a team before you can select a project',
      message: 'Create a team and invite your teammates on the Team Selection page first.',
      actionLabel: 'Go to Team Selection',
      actionPath: '/project-selection/team'
    }
  }

  if (team.status !== 'COMPLETED') {
    return {
      eligible: false,
      title: 'Your team is not marked complete yet',
      message: 'Finish inviting your teammates and mark the team as complete before selecting a project.',
      actionLabel: 'Go to Team Selection',
      actionPath: '/project-selection/team'
    }
  }

  const applications = await getMyApplications()
  const list = Array.isArray(applications) ? applications : []

  const active = list.find((application) => {
    if (!ACTIVE_STATUSES.includes(application.status)) return false
    const applicationTeamId = application.teamId?._id || application.teamId
    return !applicationTeamId || String(applicationTeamId) === String(team.id)
  })

  if (active) {
    return {
      eligible: false,
      title: 'Your team already has an active project application',
      message: `A project has already been submitted for your team (current status: ${readableStatus(active.status)}). A new application can only be submitted if the current one is rejected.`,
      actionLabel: 'Back to Project Selection',
      actionPath: '/project-selection'
    }
  }

  return { eligible: true, team }
}
