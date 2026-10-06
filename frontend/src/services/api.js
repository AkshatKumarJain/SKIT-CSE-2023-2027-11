const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://congested-coherent-calculate.ngrok-free.dev'

export const ENDPOINTS = {
  projects: '/api/projects',
  selections: '/api/project-selections',
  applications: '/api/applications'
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, options = {}) {
  const method = options.method || 'GET'
  const token = localStorage.getItem('accessToken')

  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })
  } catch {
    throw new ApiError(
      'Unable to reach the server. Please check your connection and try again.',
      0
    )
  }

  const raw = await response.text().catch(() => '')

  let body = null

  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    body = null
  }

  if (!response.ok || body?.success === false) {
    const fromBody =
      body?.message ||
      body?.error?.message ||
      (typeof body?.error === 'string' ? body.error : null)

    const looksLikeText =
      !body &&
      raw &&
      !raw.trim().startsWith('<')

    const fromText = looksLikeText
      ? raw.trim().slice(0, 200)
      : null

    const where = `${method} ${BASE_URL}${path}`

    const hint =
      response.status >= 500 && !raw
        ? ' (empty response - the backend may be down, or the dev proxy cannot reach it)'
        : ''

    throw new ApiError(
      fromBody ||
        fromText ||
        `Request failed with status ${response.status} on ${where}${hint}`,
      response.status
    )
  }

  return body &&
    typeof body === 'object' &&
    'data' in body
    ? body.data
    : body
}

export function mockRequest(data, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}