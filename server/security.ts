import type { CmsEnv, Database } from './store'

const encoder = new TextEncoder()
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')
export const digest = async (value: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer)
export function json(value: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra } })
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  return origin === new URL(request.url).origin && request.headers.get('Sec-Fetch-Site') !== 'cross-site'
}
export async function passwordMatches(password: string, encoded: string) {
  const parts = encoded.split(':')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2' || parts[1] !== '100000' || !/^[0-9a-f]{32}$/.test(parts[2]) || !/^[0-9a-f]{64}$/.test(parts[3])) return false
  const salt = Uint8Array.from(parts[2].match(/../g)!, byte => parseInt(byte, 16))
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const candidate = hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256))
  let difference = 0
  for (let i = 0; i < 64; i++) difference |= candidate.charCodeAt(i) ^ parts[3].charCodeAt(i)
  return difference === 0
}
export async function session(request: Request, env: CmsEnv) {
  const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)reddpixel_admin=([a-f0-9]{64})(?:;|$)/)?.[1]
  if (!token || !env.CMS_DB || !env.ADMIN_PASSWORD_HASH) return null
  return env.CMS_DB.prepare('SELECT csrf FROM sessions WHERE token_hash = ? AND expires > ?').bind(await digest(token), Date.now()).first<{ csrf: string }>()
}
export function cookie(request: Request, token: string, expires = 28800) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `reddpixel_admin=${token}; Path=/api/cms; HttpOnly; SameSite=Strict; Max-Age=${expires}${secure}`
}
export async function allowed(db: Database, key: string, maximum: number, windowMs: number) {
  const now = Date.now()
  await db.prepare('DELETE FROM throttle WHERE reset < ?').bind(now).run()
  await db.prepare('INSERT INTO throttle (key,count,reset) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count = count + 1').bind(key, now + windowMs).run()
  const row = await db.prepare('SELECT count FROM throttle WHERE key = ?').bind(key).first<{ count: number }>()
  return !!row && row.count <= maximum
}
export async function readJson(request: Request, maximum = 150000): Promise<unknown> {
  if (!(request.headers.get('Content-Type') ?? '').startsWith('application/json')) throw new Error('Send JSON content.')
  const declared = Number(request.headers.get('Content-Length'))
  if (declared > maximum) throw new Error('Request is too large.')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Request body is missing.')
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > maximum) { await reader.cancel(); throw new Error('Request is too large.') }
    chunks.push(value)
  }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
  return JSON.parse(new TextDecoder().decode(body))
}
