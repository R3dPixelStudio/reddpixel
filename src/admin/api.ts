let csrf = ''
export class StudioApiError extends Error {
  readonly status: number
  readonly code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'StudioApiError'
    this.status = status
    this.code = code
  }
}
export function setCsrf(value: string) { csrf = value }
export async function api<T>(path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && typeof options.body === 'string') headers.set('Content-Type', 'application/json')
  if (options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrf)
  const response = await fetch(`/api/cms/${path}`, { ...options, headers, credentials: 'same-origin', signal })
  const body = await response.json()
  if (!response.ok) throw new StudioApiError(body.error ?? 'The request failed.', response.status, body.code)
  return body as T
}
