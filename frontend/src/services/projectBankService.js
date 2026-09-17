import { apiFetch } from './api'

export function getProjectBankItems() {
  return apiFetch('/project-bank')
}