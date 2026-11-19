import { apiFetch } from './api'

const API_PREFIX = ''

function mapPhase(raw) {
  return {
    id: raw._id,
    phase: raw.phase,
    startDate: raw.startDate,
    endDate: raw.endDate,
    isActive: raw.isActive
  }
}

export function getSelectionPhases() {
  return apiFetch(`${API_PREFIX}/project-selection`).then((list) =>
    (list || []).map(mapPhase)
  )
}

export function createSelectionPhase(payload) {
  return apiFetch(`${API_PREFIX}/project-selection`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(mapPhase)
}

export function updateSelectionPhase(phaseId, payload) {
  return apiFetch(`${API_PREFIX}/project-selection/${phaseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }).then(mapPhase)
}
