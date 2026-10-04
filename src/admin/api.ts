let csrf = ''
export function setCsrf(value: string) { csrf = value }
export async function api<T>(path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && typeof options.body === 'string') headers.set('Content-Type', 'application/json')
  if (options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrf)
  const response = await fetch(`/api/cms/${path}`, { ...options, headers, credentials: 'same-origin', signal })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? 'The request failed.')
  return body as T
}
