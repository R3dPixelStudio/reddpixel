import { renderJournalPost } from '../../../scripts/journalHtml'
import { validPost, validWork, type CmsPost, type CmsWork, type CmsComment, type CmsMedia } from '../../../src/content/cms'
import { posts, works, type CmsContext } from '../../../server/store'
import { allowed, cookie, digest, json, passwordMatches, randomToken, readJson, sameOrigin, session } from '../../../server/security'

declare const FixedLengthStream: new (length: number) => { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }

export async function onRequest(context: CmsContext): Promise<Response> {
  const { request, env } = context
  const route = new URL(request.url).pathname.replace(/^\/api\/cms\/?/, '').replace(/\/$/, '')
  if (request.method === 'GET' && route === 'work') return json({ items: await works(env) })
  if (!env.CMS_DB || !env.ADMIN_PASSWORD_HASH) return json({ code: 'CMS_NOT_CONFIGURED', error: 'Content studio is not configured. Bind CMS_DB and set ADMIN_PASSWORD_HASH.' }, 503)
  const db = env.CMS_DB
  try {
    const auth = await session(request, env)
    if (route === 'session') {
      if (request.method === 'GET') return json({ authenticated: !!auth, csrf: auth?.csrf ?? null, uploads: !!env.CMS_MEDIA })
      if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403)
      if (request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
        if (!await allowed(db, await digest(`login:${ip}:${env.ADMIN_PASSWORD_HASH}`), 5, 15 * 60000)) return json({ error: 'Too many login attempts. Try again in 15 minutes.' }, 429)
        const body = await readJson(request, 2048) as { password?: unknown }
        if (typeof body.password !== 'string' || body.password.length < 16 || body.password.length > 256 || !await passwordMatches(body.password, env.ADMIN_PASSWORD_HASH)) return json({ error: 'The password does not match.' }, 401)
        const token = randomToken(), csrf = randomToken()
        await db.prepare('DELETE FROM sessions WHERE expires < ?').bind(Date.now()).run()
        await db.prepare('INSERT INTO sessions (token_hash,csrf,expires) VALUES (?,?,?)').bind(await digest(token), csrf, Date.now() + 8 * 3600000).run()
        return json({ authenticated: true, csrf, uploads: !!env.CMS_MEDIA }, 200, { 'Set-Cookie': cookie(request, token) })
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
      if (route === 'media') return json({ items: (await db.prepare('SELECT key,src,type,name,bytes FROM media ORDER BY created_at DESC LIMIT 500').all<CmsMedia>()).results })
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
    if (request.method === 'POST' && route === 'media') {
      if (!env.CMS_MEDIA) return json({ error: 'Bind CMS_MEDIA to enable uploads.' }, 503)
      const mime = request.headers.get('Content-Type') ?? ''
      const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }
      if (!extensions[mime] || !request.body) return json({ error: 'Upload a JPEG, PNG, WebP, MP4 or WebM file.' }, 400)
      const maximum = mime.startsWith('video/') ? 40 * 1024 * 1024 : 8 * 1024 * 1024
      const declaredSize = Number(request.headers.get('Content-Length'))
      if (!Number.isSafeInteger(declaredSize) || declaredSize < 16) return json({ error: 'Upload a file with a known size of at least 16 bytes.' }, 411)
      if (declaredSize > maximum) return json({ error: 'Images may be up to 8 MB; videos up to 40 MB.' }, 413)
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
      const fixed = new FixedLengthStream(declaredSize), uploadController = new AbortController()
      const pumping = stream.pipeTo(fixed.writable, { signal: uploadController.signal })
      try { await Promise.all([pumping, env.CMS_MEDIA.put(key, fixed.readable, { httpMetadata: { contentType: mime } })]) } catch { uploadController.abort(); await pumping.catch(() => {}); return json({ error: 'Upload failed or exceeded the size limit.' }, 413) }
      const item: CmsMedia = { key, src: `/media/${key}`, type: mime.startsWith('video/') ? 'video' : 'image', name: decodeURIComponent(request.headers.get('X-File-Name') ?? 'Media').slice(0, 180), bytes }
      try { await db.prepare('INSERT INTO media (key,src,type,name,bytes,created_at) VALUES (?,?,?,?,?,?)').bind(item.key, item.src, item.type, item.name, bytes, new Date().toISOString()).run() } catch (error) { await env.CMS_MEDIA.delete(key); throw error }
      return json({ item }, 201)
    }
    return json({ error: 'Content action not found.' }, 404)
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && ['Send JSON content.', 'Request is too large.', 'Request body is missing.'].includes(error.message)) return json({ error: error.message }, 400)
    return json({ error: 'The content service is unavailable. Check bindings and database migrations.' }, 503)
  }
}



