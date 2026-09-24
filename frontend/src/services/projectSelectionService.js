import { apiFetch, ENDPOINTS } from './api'
import { STAGE_CONFIG, buildStage } from './mappers'

// GET /project-selections/current  -> which phase is open right now
// GET /project-selections          -> every configured phase window
export async function getProjectSelectionStages() {
  const [current, phases] = await Promise.all([
    apiFetch(`${ENDPOINTS.selections}/current`),
    apiFetch(ENDPOINTS.selections)
  ])
  const now = new Date()
  return STAGE_CONFIG.map((config) =>
    buildStage(
      config,
      phases.find((phase) => phase.phase === config.phase),
      current,
      now
    )
  )
}

// stageId: 'student-idea' | 'faculty-project' | 'project-bank'
export async function getProjectSelectionStage(stageId) {
  const stages = await getProjectSelectionStages()
  return stages.find((stage) => stage.id === stageId) || null
}
