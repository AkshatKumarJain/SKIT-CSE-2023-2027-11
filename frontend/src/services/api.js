  const BASE_URL = import.meta.env.VITE_API_BASE_URL

  export async function apiFetch(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.status === 204 ? null : response.json()
}