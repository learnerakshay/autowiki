export async function apiRequest(path, options) {
  const response = await fetch(path, options)
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof body === 'object' ? body.error : body
    const error = new Error(message || `Request failed with status ${response.status}`)
    error.status = response.status
    throw error
  }

  return body
}

export function postJson(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
