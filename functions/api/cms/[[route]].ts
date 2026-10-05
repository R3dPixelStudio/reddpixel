import { renderJournalPost } from '../../../scripts/journalHtml'
import { validPost, validWork, type CmsPost, type CmsWork, type CmsComment, type CmsMedia } from '../../../src/content/cms'
import { posts, works, type CmsContext } from '../../../server/store'
import { allowed, cookie, digest, json, passwordMatches, randomToken, rateLimit, readJson, sameOrigin, session, sessionDigest } from '../../../server/security'
import { IMAGE_UPLOAD_BYTES, VIDEO_UPLOAD_BYTES, MEDIA_CHUNK_BYTES, MEDIA_EXTENSIONS, ensureMediaStorage, mediaStorage, removeMediaObject, reserveMedia, storeMedia, validMediaHeader } from '../../../server/media'

export async function onRequest(context: CmsContext): Promise<Response> {
  const { request, env } = context
  const route = new URL(request.url).pathname.replace(/^\/api\/cms\/?/, '').replace(/\/$/, '')
  if (request.method === 'GET' && route === 'work') return json({ items: await works(env) })
  if (!env.CMS_DB || !env.ADMIN_PASSWORD_HASH) return json({ code: 'CMS_NOT_CONFIGURED', error: 'Content studio is not configured. Bind CMS_DB and set ADMIN_PASSWORD_HASH.' }, 503)
  const db = env.CMS_DB
  try {
    const auth = await session(request, env)
    if (route === 'session') {
      if (request.method === 'GET') return json({ authenticated: !!auth, csrf: auth?.csrf ?? null, uploads: true })
      if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403)
      if (request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
        const clientLimit = await rateLimit(db, await digest(`login:${ip}:${env.ADMIN_PASSWORD_HASH}`), 5, 15 * 60000)
        if (!clientLimit.allowed) return json({ error: 'Too many login attempts. Please wait before trying again.', code: 'LOGIN_THROTTLED', retryAfter: clientLimit.retryAfter }, 429, { 'Retry-After': String(clientLimit.retryAfter) })
        const siteLimit = await rateLimit(db, await digest(`login-global:${env.ADMIN_PASSWORD_HASH}`), 30, 60000)
        if (!siteLimit.allowed) return json({ error: 'Sign-in is temporarily busy. Please try again shortly.', code: 'LOGIN_THROTTLED', retryAfter: siteLimit.retryAfter }, 429, { 'Retry-After': String(siteLimit.retryAfter) })
        const body = await readJson(request, 2048) as { password?: unknown }
        if (typeof body.password !== 'string' || body.password.length < 16 || body.password.length > 256 || !await passwordMatches(body.password, env.ADMIN_PASSWORD_HASH)) return json({ error: 'The password does not match.' }, 401)
        const token = randomToken(), csrf = randomToken()
        await db.prepare('DELETE FROM sessions WHERE expires < ?').bind(Date.now()).run()
        await db.prepare('INSERT INTO sessions (token_hash,csrf,expires) VALUES (?,?,?)').bind(await sessionDigest(token, env.ADMIN_PASSWORD_HASH), csrf, Date.now() + 8 * 3600000).run()
        return json({ authenticated: true, csrf, uploads: true }, 200, { 'Set-Cookie': cookie(request, token) })
      }
      if (request.method === 'DELETE' && auth && request.headers.get('X-CSRF-Token') === auth.csrf) {
        await db.prepare('DELETE FROM sessions WHERE csrf = ?').bind(auth.csrf).run()
        return json({ authenticated: false }, 200, { 'Set-Cookie': cookie(request, '', 0) })
      }
      return json({ error: 'Unsupported session action.' }, 405)
    }
    if (route === 'comments' && request.method === 'POST') {
      if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403)
      const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
      if (!await allowed(db, await digest(`comment:${ip}:${env.ADMIN_PASSWORD_HASH}`), 3, 10 * 60000)) return json({ error: 'Please wait before leaving another comment.' }, 429)
      const body = await readJson(request, 5000) as { slug?: unknown; name?: unknown; text?: unknown; website?: unknown }
      if (body.website) return json({ message: 'Your comment is awaiting approval.' }, 202)
      if (typeof body.slug !== 'string' || !(await posts(env)).some(p => p.slug === body.slug) || typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 80 || typeof body.text !== 'string' || body.text.trim().length < 2 || body.text.length > 2000) return json({ error: 'Enter a name and a comment of 2–2000 characters for a published article.' }, 400)
      await db.prepare('INSERT INTO comments (id,slug,name,text,status,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), body.slug, body.name.trim(), body.text.trim(), 'pending', new Date().toISOString()).run()
      return json({ message: 'Thanks. Your comment is awaiting Arash’s approval.' }, 202)
    }
    if (!auth) return json({ error: 'Sign in to the content studio.' }, 401)
    if (request.method !== 'GET' && (!sameOrigin(request) || request.headers.get('X-CSRF-Token') !== auth.csrf)) return json({ error: 'Refresh the studio before saving.' }, 403)
    if (request.method === 'GET') {
      if (route === 'preview') {
        const slug = new URL(request.url).searchParams.get('slug')
        const post = (await posts(env, true)).find(p => p.slug === slug)
        if (!post) return json({ error: 'Save the draft before opening a preview.' }, 404)
        return new Response(renderJournalPost(post).replace('index, follow, max-image-preview:large', 'noindex, nofollow'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' } })
      }
      if (route === 'posts') return json({ items: await posts(env, true) })
      if (route === 'works') return json({ items: await works(env, true) })
      if (route === 'comments') return json({ items: (await db.prepare("SELECT id,slug,name,text,status,reply,created_at AS createdAt FROM comments ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 500").all<CmsComment>()).results })
      if (route === 'media') {
        const storage = await mediaStorage(db)
        return json({ items: (await db.prepare('SELECT key,src,type,name,bytes FROM media WHERE NOT EXISTS (SELECT 1 FROM media_objects WHERE media_objects.key=media.key AND complete=0) ORDER BY created_at DESC LIMIT 500').all<CmsMedia>()).results, storage })
      }
    }
    if (request.method === 'PUT' && (route === 'posts' || route === 'works')) {
      const value = await readJson(request)
      if (route === 'posts' ? !validPost(value) : !validWork(value)) return json({ error: 'Check the required fields, image descriptions and content limits.' }, 400)
      const item = value as CmsPost | CmsWork
      const isPost = route === 'posts'
      const id = isPost ? (item as CmsPost).slug : (item as CmsWork).id
      const table = isPost ? 'posts' : 'works', column = isPost ? 'slug' : 'id'
      const publishedAt = isPost && item.status === 'published' ? (await posts(env, true)).find(p => p.slug === id)?.publishedAt ?? new Date().toISOString() : undefined
      const saved = { ...item, version: item.version + 1, ...(publishedAt ? { publishedAt } : {}) }
      const result = item.version === 0
        ? await db.prepare(`INSERT INTO ${table} (${column},payload,status,version,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(${column}) DO NOTHING`).bind(id, JSON.stringify(saved), saved.status, saved.version, new Date().toISOString()).run()
        : await db.prepare(`UPDATE ${table} SET payload=?,status=?,version=?,updated_at=? WHERE ${column}=? AND version=?`).bind(JSON.stringify(saved), saved.status, saved.version, new Date().toISOString(), id, item.version).run()
      if (!result.meta.changes) return json({ error: 'This content changed in another tab. Reload it before saving.' }, 409)
      return json({ item: saved })
    }
    if (request.method === 'PUT' && route === 'comments') {
      const body = await readJson(request, 5000) as { id?: unknown; status?: unknown; reply?: unknown }
      if (typeof body.id !== 'string' || typeof body.status !== 'string' || !['approved', 'pending', 'hidden'].includes(body.status) || typeof body.reply !== 'string' || body.reply.length > 3000) return json({ error: 'Invalid moderation action.' }, 400)
      const result = await db.prepare('UPDATE comments SET status=?,reply=? WHERE id=?').bind(body.status, body.reply.trim(), body.id).run()
      return result.meta.changes ? json({ saved: true }) : json({ error: 'Comment not found.' }, 404)
    }
    if (request.method === 'POST' && route === 'media/start') {
      if (!await allowed(db, await digest(`upload:${auth.csrf}`), 60, 10 * 60000)) return json({ error: 'Please wait before uploading more files.' }, 429, { 'Retry-After': '600' })
      const value = await readJson(request, 1024) as { mime?: unknown; name?: unknown; bytes?: unknown }
      if (typeof value.mime !== 'string' || !MEDIA_EXTENSIONS[value.mime] || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 180 || Array.from(value.name).some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) || typeof value.bytes !== 'number' || !Number.isSafeInteger(value.bytes) || value.bytes < 16 || value.bytes > (value.mime.startsWith('video/') ? VIDEO_UPLOAD_BYTES : IMAGE_UPLOAD_BYTES)) return json({ error: 'Choose a JPEG/PNG/WebP image up to 8 MB, or an MP4/WebM video up to 20 MB with a valid filename.' }, 400)
      const key = `${crypto.randomUUID()}.${MEDIA_EXTENSIONS[value.mime]}`
      if (!await reserveMedia(db, key, value.mime, value.bytes)) return json({ error: 'The media library is full (300 MB). Compress files or use repository images.', code: 'MEDIA_STORAGE_FULL' }, 507)
      const item: CmsMedia = { key, src: `/media/${key}`, type: value.mime.startsWith('video/') ? 'video' : 'image', name: value.name.trim(), bytes: value.bytes }
      try { await db.prepare('INSERT INTO media (key,src,type,name,bytes,created_at) VALUES (?,?,?,?,?,?)').bind(key, item.src, item.type, item.name, item.bytes, new Date().toISOString()).run() } catch (error) { await removeMediaObject(db, key); throw error }
      return json({ item, chunkBytes: MEDIA_CHUNK_BYTES }, 201)
    }
    if (['media/chunk', 'media/finish', 'media/cancel'].includes(route)) {
      const key = new URL(request.url).searchParams.get('key') ?? ''
      if (!/^[a-f0-9-]{36}\.(?:jpg|png|webp|mp4|webm)$/.test(key)) return json({ error: 'Invalid upload.' }, 400)
      await ensureMediaStorage(db)
      const object = await db.prepare('SELECT bytes,mime,complete,created_at FROM media_objects WHERE key=?').bind(key).first<{ bytes: number; mime: string; complete: number; created_at: number }>()
      if (!object || object.complete || object.created_at < Date.now() - 3600000) return json({ error: 'This upload is closed or expired. Start again.' }, 409)
      if (route === 'media/cancel' && request.method === 'DELETE') {
        await removeMediaObject(db, key); await db.prepare('DELETE FROM media WHERE key=?').bind(key).run(); return json({ cancelled: true })
      }
      if (route === 'media/chunk' && request.method === 'PUT') {
        if (!await allowed(db, await digest(`upload-chunks:${auth.csrf}`), 5000, 10 * 60000)) return json({ error: 'Please wait before uploading more data.' }, 429)
        const positionText = new URL(request.url).searchParams.get('position') ?? ''
        const position = Number(positionText), expected = Math.min(MEDIA_CHUNK_BYTES, object.bytes - position * MEDIA_CHUNK_BYTES)
        if (!/^\d+$/.test(positionText) || !Number.isSafeInteger(position) || expected <= 0 || Number(request.headers.get('Content-Length')) !== expected || request.headers.get('Content-Type') !== object.mime || !request.body) return json({ error: 'Invalid upload chunk.' }, 400)
        const reader = request.body.getReader(), buffer = new Uint8Array(expected); let filled = 0
        while (true) { const next = await reader.read(); if (next.done) break; if (filled + next.value.length > expected) { await reader.cancel(); return json({ error: 'Chunk is too large.' }, 413) }; buffer.set(next.value, filled); filled += next.value.length }
        if (filled !== expected || position === 0 && !validMediaHeader(buffer.subarray(0, 32), object.mime)) return json({ error: 'The file contents or size do not match the selected media type.' }, 400)
        const result = await db.prepare('INSERT INTO media_chunks (key,position,data) VALUES (?,?,?) ON CONFLICT(key,position) DO NOTHING').bind(key, position, buffer.buffer).run()
        return result.meta.changes ? json({ uploaded: true }) : json({ error: 'This chunk was already uploaded.' }, 409)
      }
      if (route === 'media/finish' && request.method === 'POST') {
        const total = await db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(length(data)),0) AS bytes FROM media_chunks WHERE key=?').bind(key).first<{ count: number; bytes: number }>()
        if (!total || total.bytes !== object.bytes || total.count !== Math.ceil(object.bytes / MEDIA_CHUNK_BYTES)) return json({ error: 'The upload is incomplete. Please try again.' }, 409)
        await db.prepare('UPDATE media_objects SET complete=1 WHERE key=? AND complete=0').bind(key).run()
        const item = await db.prepare('SELECT key,src,type,name,bytes FROM media WHERE key=?').bind(key).first<CmsMedia>()
        return json({ item }, 201)
      }
      return json({ error: 'Unsupported upload action.' }, 405)
    }
    if (request.method === 'POST' && route === 'media') {
      if (!await allowed(db, await digest(`upload:${auth.csrf}`), 60, 10 * 60000)) return json({ error: 'Please wait before uploading more files.' }, 429, { 'Retry-After': '600' })
      const mime = request.headers.get('Content-Type') ?? ''
      const extensions = MEDIA_EXTENSIONS
      if (!extensions[mime] || !request.body) return json({ error: 'Upload a JPEG, PNG, WebP, MP4 or WebM file.' }, 400)
      const maximum = MEDIA_CHUNK_BYTES
      const declaredSize = Number(request.headers.get('Content-Length'))
      if (!Number.isSafeInteger(declaredSize) || declaredSize < 16) return json({ error: 'Upload a file with a known size of at least 16 bytes.' }, 411)
      if (declaredSize > maximum) return json({ error: 'Use the studio chunked uploader for files larger than 256 KB.' }, 413)
      let name: string
      try { name = decodeURIComponent(request.headers.get('X-File-Name') ?? 'Media').trim() } catch { return json({ error: 'The filename is not valid.' }, 400) }
      if (!name || name.length > 180 || Array.from(name).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return json({ error: 'Use a filename of 1–180 characters without control characters.' }, 400)
      const reader = request.body.getReader()
      const prefix: Uint8Array[] = []; let bytes = 0
      while (bytes < 16) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.length; prefix.push(chunk.value) }
      const header = new Uint8Array(Math.min(bytes, 32)); let position = 0
      for (const chunk of prefix) { const take = chunk.subarray(0, header.length - position); header.set(take, position); position += take.length; if (position === header.length) break }
      const ascii = (start: number, end: number) => String.fromCharCode(...header.slice(start, end))
      const valid = mime === 'image/jpeg' ? header[0] === 255 && header[1] === 216 && header[2] === 255 : mime === 'image/png' ? ascii(1, 4) === 'PNG' && header[0] === 137 : mime === 'image/webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' : mime === 'video/mp4' ? ascii(4, 8) === 'ftyp' : header[0] === 26 && header[1] === 69 && header[2] === 223 && header[3] === 163
      if (!valid || bytes > maximum) { await reader.cancel(); return json({ error: 'The file contents do not match the selected media type.' }, 400) }
      const key = `${crypto.randomUUID()}.${extensions[mime]}`
      const stream = new ReadableStream<Uint8Array>({
        start(controller) { for (const chunk of prefix) controller.enqueue(chunk) },
        async pull(controller) { const chunk = await reader.read(); if (chunk.done) { controller.close(); return }; bytes += chunk.value.length; if (bytes > maximum) { await reader.cancel(); controller.error(new Error('Upload exceeds the size limit.')); return }; controller.enqueue(chunk.value) },
        cancel() { return reader.cancel() },
      })
      try { await storeMedia(db, key, mime, declaredSize, stream) } catch (error) {
        if (error instanceof Error && error.message === 'MEDIA_STORAGE_FULL') return json({ error: 'The media library is full (300 MB). Use compressed files or repository images.', code: 'MEDIA_STORAGE_FULL' }, 507)
        if (error instanceof Error && error.message === 'MEDIA_SIZE_MISMATCH') return json({ error: 'Upload did not match its declared size. Try again.' }, 400)
        throw error
      }
      const item: CmsMedia = { key, src: `/media/${key}`, type: mime.startsWith('video/') ? 'video' : 'image', name, bytes }
      try { await db.prepare('INSERT INTO media (key,src,type,name,bytes,created_at) VALUES (?,?,?,?,?,?)').bind(item.key, item.src, item.type, item.name, bytes, new Date().toISOString()).run() } catch (error) { await removeMediaObject(db, key); throw error }
      return json({ item }, 201)
    }
    return json({ error: 'Content action not found.' }, 404)
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && ['Send JSON content.', 'Request is too large.', 'Request body is missing.'].includes(error.message)) return json({ error: error.message }, 400)
    return json({ error: 'The content service is unavailable. Check bindings and database migrations.' }, 503)
  }
}



