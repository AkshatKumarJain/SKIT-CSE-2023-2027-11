import { apiFetch } from './api'

export function getProjectSelectionStages() {
  return apiFetch('/selection-stages')
}

export function getProjectSelectionStage(stageId) {
  return apiFetch(`/selection-stages/${stageId}`)
}