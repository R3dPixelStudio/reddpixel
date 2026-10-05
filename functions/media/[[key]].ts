import type { CmsContext } from '../../server/store'
import { mediaBody } from '../../server/media'

export async function onRequest({ request, env, waitUntil }: CmsContext) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 })
  const key = new URL(request.url).pathname.slice('/media/'.length)
  if (!/^[a-f0-9-]{36}\.(?:jpg|png|webp|mp4|webm)$/.test(key)) return new Response('Media not found.', { status: 404 })
  const cache = (caches as CacheStorage & { default: Cache }).default
  const cached = request.method === 'GET' ? await cache.match(request) : undefined
  if (cached) return cached
  const range = request.headers.get('Range')
  let stored: { bytes: number; mime: string } | null = null
  if (env.CMS_DB) {
    try { stored = await env.CMS_DB.prepare('SELECT bytes,mime FROM media_objects WHERE key=? AND complete=1').bind(key).first() } catch { /* An older deployment may not have the additive media migration yet. */ }
  }
  const metadata = stored ? { size: stored.bytes, httpEtag: `"${key}"`, httpMetadata: { contentType: stored.mime } } : await env.CMS_MEDIA?.head(key)
  if (!metadata) return new Response('Media not found.', { status: 404 })
  const headers = new Headers({ 'Content-Type': metadata.httpMetadata?.contentType ?? 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'ETag': metadata.httpEtag, 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' })
  let offset = 0, length = metadata.size
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match || !match[1] && !match[2]) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${metadata.size}` } })
    offset = match[1] ? Number(match[1]) : Math.max(0, metadata.size - Number(match[2]))
    const end = match[1] && match[2] ? Math.min(Number(match[2]) + 1, metadata.size) : metadata.size
    length = end - offset
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset >= metadata.size || length <= 0) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${metadata.size}` } })
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${metadata.size}`)
  }
  headers.set('Content-Length', String(length))
  if (request.method === 'HEAD') return new Response(null, { status: range ? 206 : 200, headers })
  if (stored && env.CMS_DB) {
    const response = new Response(mediaBody(env.CMS_DB, key, offset, length), { status: range ? 206 : 200, headers })
    if (!range && waitUntil) waitUntil(cache.put(new Request(request.url), response.clone()).catch(() => {}))
    return response
  }
  const object = await env.CMS_MEDIA?.get(key, range ? { range: { offset, length } } : undefined)
  return object ? new Response(object.body, { status: range ? 206 : 200, headers }) : new Response('Media not found.', { status: 404 })
}
