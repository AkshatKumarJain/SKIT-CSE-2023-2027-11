import { apiFetch } from './api'

export function createTeam() {
  return apiFetch('/teams', { method: 'POST' })
}

export function getMyTeam() {
  return apiFetch('/teams/my')
}

export function getTeam(teamId) {
  return apiFetch(`/teams/${teamId}`)
}

export function getAvailableMembers() {
  return apiFetch('/teams/available-members')
}

export function sendTeamRequest(teamId, studentId) {
  return apiFetch(`/teams/${teamId}/requests`, {
    method: 'POST',
    body: JSON.stringify({ studentId })
  })
}

export function getTeamRequests(teamId) {
  return apiFetch(`/teams/${teamId}/requests`)
}

export function getReceivedTeamRequests() {
  return apiFetch('/team-requests/my')
}

export function acceptTeamRequest(requestId) {
  return apiFetch(`/team-requests/${requestId}/accept`, { method: 'PATCH' })
}

export function rejectTeamRequest(requestId) {
  return apiFetch(`/team-requests/${requestId}/reject`, { method: 'PATCH' })
}

export function cancelTeamRequest(requestId) {
  return apiFetch(`/team-requests/${requestId}/cancel`, { method: 'PATCH' })
}

export function completeTeam(teamId) {
  return apiFetch(`/teams/${teamId}/complete`, { method: 'PATCH' })
}
