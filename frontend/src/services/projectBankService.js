import { apiFetch } from './api'

export function getProjectBankItems() {
  return apiFetch('/api/projects/bank').then((list) => list || [])
}