import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { rateLimit, sessionDigest, session, cookie } from '../server/security.ts'
import { ensureMediaStorage, storeMedia, mediaBody, MEDIA_STORAGE_BYTES, MEDIA_CHUNK_BYTES } from '../server/media.ts'

const sqlite = new DatabaseSync(':memory:')
const db = { prepare(sql) { const query = sqlite.prepare(sql); let args = []; return {
  bind(...values) { args = values.map(v => v instanceof ArrayBuffer ? new Uint8Array(v) : v); return this },
  async first() { const row = query.get(...args); if (row?.data instanceof Uint8Array) row.data = Array.from(row.data); return row ?? null },
  async all() { return { results: query.all(...args).map(row => ({ ...row, ...(row.data instanceof Uint8Array ? { data: Array.from(row.data) } : {}) })) } },
  async run() { return { meta: query.run(...args) } },
} } }
sqlite.exec('CREATE TABLE throttle (key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL); CREATE TABLE sessions (token_hash TEXT PRIMARY KEY,csrf TEXT NOT NULL,expires INTEGER NOT NULL);')
const concurrent = await Promise.all(Array.from({ length: 30 }, () => rateLimit(db, 'client', 5, 60000)))
assert.equal(concurrent.filter(r => r.allowed).length, 5)
assert.equal(sqlite.prepare('SELECT count FROM throttle WHERE key=?').get('client').count, 6)
assert.ok(concurrent.every(r => r.retryAfter > 0 && r.retryAfter <= 60))
sqlite.prepare('UPDATE throttle SET reset=0 WHERE key=?').run('client')
assert.equal((await rateLimit(db, 'client', 5, 60000)).allowed, true)
const global = await Promise.all(Array.from({ length: 40 }, () => rateLimit(db, 'global', 30, 60000)))
assert.equal(global.filter(r => r.allowed).length, 30)
const token = 'a'.repeat(64), oldHash = 'old-hash', newHash = 'new-hash'
sqlite.prepare('INSERT INTO sessions VALUES (?,?,?)').run(await sessionDigest(token, oldHash), 'csrf-check', Date.now() + 60000)
const request = new Request('https://example.test/api/cms/posts', { headers: { Cookie: `reddpixel_admin=${token}` } })
assert.ok(await session(request, { CMS_DB: db, ADMIN_PASSWORD_HASH: oldHash }))
assert.equal(await session(request, { CMS_DB: db, ADMIN_PASSWORD_HASH: newHash }), null)
assert.match(cookie(request, token), /HttpOnly; SameSite=Strict; Max-Age=28800; Secure/)
await ensureMediaStorage(db)
const data = new Uint8Array(MEDIA_CHUNK_BYTES * 2 + 29).map((_, i) => i % 251)
const input = () => new ReadableStream({ start(c) { c.enqueue(data.subarray(0, 101)); c.enqueue(data.subarray(101)); c.close() } })
await storeMedia(db, 'good', 'image/webp', data.length, input())
assert.deepEqual(new Uint8Array(await new Response(mediaBody(db, 'good', 0, data.length)).arrayBuffer()), data)
assert.deepEqual(new Uint8Array(await new Response(mediaBody(db, 'good', MEDIA_CHUNK_BYTES - 5, 19)).arrayBuffer()), data.subarray(MEDIA_CHUNK_BYTES - 5, MEDIA_CHUNK_BYTES + 14))
await assert.rejects(storeMedia(db, 'incomplete', 'image/webp', data.length + 1, input()), /MEDIA_SIZE_MISMATCH/)
assert.equal(sqlite.prepare('SELECT count(*) AS count FROM media_chunks WHERE key=?').get('incomplete').count, 0)
sqlite.prepare('INSERT INTO media_objects VALUES (?,?,?,?,?)').run('budget', 'image/webp', MEDIA_STORAGE_BYTES - data.length * 2, 1, Date.now())
const reservations = await Promise.allSettled(['over-one', 'over-two'].map(key => storeMedia(db, key, 'image/webp', data.length, input())))
assert.equal(reservations.filter(r => r.status === 'fulfilled').length, 1)
assert.ok(reservations.filter(r => r.status === 'rejected').every(r => r.reason.message === 'MEDIA_STORAGE_FULL'))
sqlite.close()
console.log('Atomic client/global throttle, expired windows, session revocation, secure cookies, chunk bytes/ranges, failed-upload cleanup and storage cap passed.')
