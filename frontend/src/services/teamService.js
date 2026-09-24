import { mockRequest } from './api'
import { students, mockTeam } from '../data/mockData'

// Team selection is still mocked.
export function getStudents() {
  return mockRequest(students)
}

// The application endpoints need a teamId. Until the real team module is connected
// this returns a mock team. Set VITE_MOCK_TEAM_ID to a real COMPLETED team's _id
// (where the logged-in student is leader) to test submissions end to end.
export function getMyTeam() {
  return mockRequest(mockTeam)
}
