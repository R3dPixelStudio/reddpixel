import type { CmsContext } from '../../server/store'

export async function onRequest({ request, env }: CmsContext) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 })
  const key = new URL(request.url).pathname.slice('/media/'.length)
  if (!/^[a-f0-9-]{36}\.(?:jpg|png|webp|mp4|webm)$/.test(key) || !env.CMS_MEDIA) return new Response('Media not found.', { status: 404 })
  const range = request.headers.get('Range')
  const metadata = await env.CMS_MEDIA.head(key)
  if (!metadata) return new Response('Media not found.', { status: 404 })
  const headers = new Headers({ 'Content-Type': metadata.httpMetadata?.contentType ?? 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'ETag': metadata.httpEtag, 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' })
  let offset = 0, length = metadata.size
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range)
    if (!match || Number(match[1]) >= metadata.size || match[2] && Number(match[2]) < Number(match[1])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${metadata.size}` } })
    offset = Number(match[1]); length = Math.min(match[2] ? Number(match[2]) + 1 : metadata.size, metadata.size) - offset
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${metadata.size}`)
  }
  headers.set('Content-Length', String(length))
  if (request.method === 'HEAD') return new Response(null, { status: range ? 206 : 200, headers })
  const object = await env.CMS_MEDIA.get(key, range ? { range: { offset, length } } : undefined)
  return object ? new Response(object.body, { status: range ? 206 : 200, headers }) : new Response('Media not found.', { status: 404 })
}
