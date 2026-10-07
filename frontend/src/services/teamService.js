import { apiFetch } from './api'

function mapMember(raw) {
  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    department: raw.department || '',
    phoneNo: raw.phoneNo || ''
  }
}

function mapTeam(raw) {
  return {
    id: raw._id,
    status: raw.status,
    leader: raw.leaderId ? mapMember(raw.leaderId) : null,
    members: (raw.memberIds || []).map(mapMember)
  }
}

export async function getMyTeam() {
  try {
    const team = await apiFetch('/api/teams/my')
    return team ? mapTeam(team) : null
  } catch (error) {
    if (error.message?.toLowerCase().includes('no active team')) {
      return null
    }
    throw error
  }
}

export function createTeam() {
  return apiFetch('/api/teams', {
    method: 'POST'
  }).then(mapTeam)
}

export function getAvailableTeamMembers() {
  return apiFetch('/api/teams/available-members').then(
    (list) => (list || []).map(mapMember)
  )
}

export function sendTeamRequest(teamId, studentId) {
  return apiFetch(`/api/teams/${teamId}/requests`, {
    method: 'POST',
    body: JSON.stringify({ studentId })
  })
}

export function getSentTeamRequests(teamId) {
  return apiFetch(`/api/teams/${teamId}/requests`).then((list) =>
    (list || []).map((request) => ({
      id: request._id,
      status: request.status,
      student: request.requestedStudentId
        ? mapMember(request.requestedStudentId)
        : null
    }))
  )
}

export function completeTeam(teamId) {
  return apiFetch(`/api/teams/${teamId}/complete`, {
    method: 'PATCH'
  }).then(mapTeam)
}

export function getReceivedTeamRequests() {
  return apiFetch('/api/team-requests/my').then((list) =>
    (list || []).map((request) => ({
      id: request._id,
      status: request.status,
      teamId: request.teamId?._id || request.teamId,
      requester: request.requesterId
        ? mapMember(request.requesterId)
        : null
    }))
  )
}

export function acceptTeamRequest(requestId) {
  return apiFetch(`/api/team-requests/${requestId}/accept`, {
    method: 'PATCH'
  })
}

export function rejectTeamRequest(requestId) {
  return apiFetch(`/api/team-requests/${requestId}/reject`, {
    method: 'PATCH'
  })
}

export function cancelTeamRequest(requestId) {
  return apiFetch(`/api/team-requests/${requestId}/cancel`, {
    method: 'PATCH'
  })
}