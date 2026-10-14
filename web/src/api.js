export function friendlyError(status = 0) {
  if (status === 404) return 'The job was not found. Job records are process-local and may be gone after a server restart. Start over from Workspace.'
  if (status === 429) return 'The service is rate-limited. Try again later.'
  if (status >= 500) return `The service could not complete the request (${status}). Try again.`
  if (status === 401 || status === 403) return 'The service could not authorize this request.'
  if (status) return `The request could not be completed (${status}). Check your inputs and try again.`
  return 'The service could not be reached. Check your connection and try again.'
}

export function safeError(message, fallback = 'The service could not complete this job. Try again.') {
  return typeof message === 'string' && message.length <= 240 && !/[<>]|\bat\s+\S+\s*\(|(?:api[_ -]?key|bearer|sk-|pcsk_)/i.test(message) ? message : fallback
}

export async function apiRequest(path, options) {
  let response
  try { response = await fetch(path, options) }
  catch { throw new Error(friendlyError()) }
  let body
  try { body = await response.json() } catch { /* Never expose a raw response body. */ }

  if (!response.ok) {
    const error = new Error(response.status >= 500 || response.status === 404 ? friendlyError(response.status) : safeError(body?.error, friendlyError(response.status)))
    error.status = response.status
    throw error
  }

  if (!body || typeof body !== 'object') throw new Error('The service returned an unreadable response. Try again.')
  return body.status === 'failed' ? { ...body, error: safeError(body.error) } : body
}

export function postJson(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
