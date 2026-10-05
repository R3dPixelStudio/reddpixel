import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const origin = process.env.CMS_TEST_ORIGIN ?? 'http://127.0.0.1:8788'
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('CMS integration checks are restricted to a local preview.')
const password = readFileSync(process.env.CMS_TEST_PASSWORD_FILE ?? '.local-cms-password.txt', 'utf8').match(/^Password: (.+)$/m)?.[1]
assert.ok(password, 'Generate local test credentials first.')
let cookie = '', csrf = ''
const request = (route, method = 'GET', value, authenticated = false, extra = {}) => fetch(`${origin}/api/cms/${route}`, { method, headers: { ...(value !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { Origin: origin } : {}), ...(authenticated ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...extra }, body: value === undefined ? undefined : JSON.stringify(value) })
const id = `local-check-${randomUUID()}`
const uploadChunks = async (bytes, mime, name) => {
  const startResponse = await request('media/start', 'POST', { bytes: bytes.length, mime, name }, true)
  assert.equal(startResponse.status, 201)
  const { item, chunkBytes } = await startResponse.json()
  assert.equal((await fetch(`${origin}${item.src}`)).status, 404, 'Incomplete uploads must not be public')
  assert.equal((await request('media/finish?key=' + item.key, 'POST', undefined, true)).status, 409)
  for (let offset = 0, position = 0; offset < bytes.length; offset += chunkBytes, position++) {
    const response = await fetch(`${origin}/api/cms/media/chunk?key=${item.key}&position=${position}`, { method: 'PUT', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, Origin: origin, 'Content-Type': mime }, body: bytes.subarray(offset, Math.min(offset + chunkBytes, bytes.length)) })
    assert.equal(response.status, 200)
  }
  const finish = await request('media/finish?key=' + item.key, 'POST', undefined, true)
  assert.equal(finish.status, 201)
  return (await finish.json()).item
}
let post, work, commentId
try {
  assert.equal((await request('posts')).status, 401)
  assert.equal((await request('session', 'POST', { password }, false, { Origin: 'https://unrelated.example' })).status, 403)
  assert.equal((await request('session', 'POST', { password: 'this-is-the-wrong-password' })).status, 401)
  const login = await request('session', 'POST', { password })
  assert.equal(login.status, 200)
  const setCookie = login.headers.get('Set-Cookie')
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/)
  cookie = setCookie.split(';')[0]; csrf = (await login.json()).csrf
  assert.equal((await request('session', 'GET', undefined, true).then(r => r.json())).authenticated, true)
  assert.equal((await request('posts', 'PUT', {}, true, { 'X-CSRF-Token': 'incorrect' })).status, 403)
  assert.equal((await request('posts', 'PUT', { slug: id }, true)).status, 400)
  post = { slug: id, title: 'Local integration check', description: 'A temporary article used only to verify persistence and moderation.', category: 'Local check', readingMinutes: 1, status: 'draft', version: 0, sections: [{ heading: 'Escaped content', paragraphs: ['<script>alert("escaped")</script> is text, not executable markup.'] }] }
  let saved = await request('posts', 'PUT', post, true)
  assert.equal(saved.status, 200); post = (await saved.json()).item
  assert.equal((await fetch(`${origin}/blog/${id}/`)).status, 404)
  assert.equal((await request(`preview?slug=${id}`)).status, 401)
  const draftPreview = await request(`preview?slug=${id}`, 'GET', undefined, true)
  assert.equal(draftPreview.status, 200); assert.equal(draftPreview.headers.get('Cache-Control'), 'no-store'); assert.match(draftPreview.headers.get('X-Robots-Tag'), /noindex/)
  assert.equal((await request('posts', 'PUT', { ...post, version: 0 }, true)).status, 409)
  saved = await request('posts', 'PUT', { ...post, status: 'published' }, true)
  assert.equal(saved.status, 200); post = (await saved.json()).item
  const article = await fetch(`${origin}/blog/${id}/`).then(r => r.text())
  assert.ok(article.includes('&lt;script&gt;alert'))
  assert.ok(!article.includes('<script>alert'))
  assert.ok(article.includes('class="comment-form"'))
  assert.ok((await fetch(`${origin}/sitemap.xml`).then(r => r.text())).includes(`/blog/${id}/`))
  const pendingText = `Pending ${id}`
  const comment = await request('comments', 'POST', { slug: id, name: 'Local tester', text: pendingText, website: '' })
  assert.equal(comment.status, 202)
  assert.ok(!(await fetch(`${origin}/blog/${id}/`).then(r => r.text())).includes(pendingText))
  const comments = (await request('comments', 'GET', undefined, true).then(r => r.json())).items
  commentId = comments.find(c => c.text === pendingText).id
  assert.equal((await request('comments', 'PUT', { id: commentId, status: 'approved', reply: '<b>Owner reply</b>' }, true)).status, 200)
  const approved = await fetch(`${origin}/blog/${id}/`).then(r => r.text())
  assert.ok(approved.includes(pendingText)); assert.ok(approved.includes('&lt;b&gt;Owner reply&lt;/b&gt;'))
  const image = readFileSync('public/images/optimized/el1-640.webp')
  const uploaded = await fetch(`${origin}/api/cms/media`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, Origin: origin, 'Content-Type': 'image/webp', 'X-File-Name': 'Local%20integration%20check.webp' }, body: image })
  assert.equal(uploaded.status, 201)
  const media = (await uploaded.json()).item
  assert.deepEqual(Buffer.from(await fetch(`${origin}${media.src}`).then(r => r.arrayBuffer())), image, 'D1 upload must preserve every image byte')
  const storage = (await request('media', 'GET', undefined, true).then(r => r.json())).storage
  assert.equal(storage.provider, 'D1'); assert.ok(storage.used >= image.length); assert.equal(storage.capacity, 300 * 1024 * 1024)
  const ranged = await fetch(`${origin}${media.src}`, { headers: { Range: 'bytes=0-7' } })
  assert.equal(ranged.status, 206); assert.equal((await ranged.arrayBuffer()).byteLength, 8)
  assert.equal((await fetch(`${origin}${media.src}`, { headers: { Range: `bytes=${image.length + 1}-` } })).status, 416)
  assert.deepEqual(Buffer.from(await fetch(`${origin}${media.src}`, { headers: { Range: 'bytes=-8' } }).then(r => r.arrayBuffer())), image.subarray(-8))
  assert.equal((await fetch(`${origin}${media.src}`, { method: 'HEAD' })).headers.get('Content-Length'), String(image.length))
  assert.equal((await fetch(`${origin}/api/cms/media`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, Origin: origin, 'Content-Type': 'image/webp', 'X-File-Name': '%GG' }, body: image })).status, 400)
  assert.equal((await fetch(`${origin}/api/cms/media`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf, Origin: origin, 'Content-Type': 'image/png' }, body: '<html>wrong MIME</html>' })).status, 400)
  work = { id, branch: 'kinetic', title: 'Local persistence check', summary: 'Temporary local work used to check galleries, visibility and updates.', url: '', cover: media.src, coverAlt: 'Local test copy of the existing electrical panel photo', media: [{ type: 'image', src: media.src, alt: 'Existing electrical panel photo copied for a local test' }], status: 'draft', version: 0 }
  saved = await request('works', 'PUT', work, true); assert.equal(saved.status, 200); work = (await saved.json()).item
  assert.ok(!(await request('work').then(r => r.json())).items.some(w => w.id === id))
  saved = await request('works', 'PUT', { ...work, status: 'published' }, true); assert.equal(saved.status, 200); work = (await saved.json()).item
  assert.ok((await request('work').then(r => r.json())).items.some(w => w.id === id))
  assert.ok((await fetch(origin).then(r => r.text())).includes(work.title), 'New work must also reach native HTML')
  // A multi-chunk timelapse fixture tests storage/ranges without copying large real videos.
  const video = Buffer.alloc(20 * 1024 * 1024 - 321, 91); video.write('ftyp', 4)
  const videoMedia = await uploadChunks(video, 'video/mp4', 'Chunk check.mp4')
  assert.deepEqual(Buffer.from(await fetch(`${origin}${videoMedia.src}`).then(r => r.arrayBuffer())), video)
  const boundaryStart = 1024 * 1024 - 9, boundaryEnd = boundaryStart + 30
  assert.deepEqual(Buffer.from(await fetch(`${origin}${videoMedia.src}`, { headers: { Range: `bytes=${boundaryStart}-${boundaryEnd}` } }).then(r => r.arrayBuffer())), video.subarray(boundaryStart, boundaryEnd + 1))
  saved = await request('works', 'PUT', { ...work, media: [...work.media, { type: 'video', src: videoMedia.src, alt: 'Local timelapse byte-range check' }] }, true)
  assert.equal(saved.status, 200); work = (await saved.json()).item
  assert.equal((await request('work').then(r => r.json())).items.find(w => w.id === id).media.length, 2)
  console.log('Local CMS: D1-only image/video uploads, exact bytes, chunk-boundary/suffix ranges, storage budget, editable galleries, filename/MIME checks, sign-in, CSRF, drafts, publishing and moderation passed.')
} finally {
  if (commentId) await request('comments', 'PUT', { id: commentId, status: 'hidden', reply: '' }, true)
  if (post) await request('posts', 'PUT', { ...post, status: 'draft' }, true)
  if (work) await request('works', 'PUT', { ...work, status: 'draft' }, true)
  if (cookie) {
    assert.equal((await request('session', 'DELETE', undefined, true)).status, 200)
    assert.equal((await request('posts', 'GET', undefined, true)).status, 401)
  }
}
const attempts = await Promise.all(Array.from({ length: 8 }, () => request('session', 'POST', { password: 'another-incorrect-password' })))
assert.ok(attempts.filter(response => response.status === 401).length <= 3, 'Earlier two attempts leave at most three attempts in this window')
for (const response of attempts.filter(r => r.status === 429)) assert.ok(Number(response.headers.get('Retry-After')) > 0)
assert.ok(attempts.some(response => response.status === 429), 'Concurrent guessing must be throttled')
console.log('Concurrent login throttling and Retry-After passed.')

