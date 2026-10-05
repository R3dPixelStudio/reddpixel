import type { Database } from './store'

export const MEDIA_CHUNK_BYTES = 256 * 1024
export const MEDIA_STORAGE_BYTES = 300 * 1024 * 1024
export const IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024
export const VIDEO_UPLOAD_BYTES = 20 * 1024 * 1024

// These idempotent tables also let an existing studio upgrade without dashboard SQL.
export async function ensureMediaStorage(db: Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS media_objects (
    key TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes INTEGER NOT NULL,
    complete INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
  )`).run()
  await db.prepare(`CREATE TABLE IF NOT EXISTS media_chunks (
    key TEXT NOT NULL REFERENCES media_objects(key) ON DELETE CASCADE,
    position INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(key,position)
  )`).run()
}

export async function mediaStorage(db: Database) {
  await ensureMediaStorage(db)
  const row = await db.prepare('SELECT COALESCE(SUM(bytes),0) AS used FROM media_objects').first<{ used: number }>()
  return { provider: 'D1', used: row?.used ?? 0, capacity: MEDIA_STORAGE_BYTES, imageLimit: IMAGE_UPLOAD_BYTES, videoLimit: VIDEO_UPLOAD_BYTES }
}

export async function removeMediaObject(db: Database, key: string) {
  await db.prepare('DELETE FROM media_chunks WHERE key=?').bind(key).run()
  await db.prepare('DELETE FROM media_objects WHERE key=?').bind(key).run()
}

export async function reserveMedia(db: Database, key: string, mime: string, size: number) {
  await ensureMediaStorage(db)
  const stale = Date.now() - 3600000
  await db.prepare('DELETE FROM media WHERE key IN (SELECT key FROM media_objects WHERE complete=0 AND created_at < ?)').bind(stale).run()
  await db.prepare('DELETE FROM media_chunks WHERE key IN (SELECT key FROM media_objects WHERE complete=0 AND created_at < ?)').bind(stale).run()
  await db.prepare('DELETE FROM media_objects WHERE complete=0 AND created_at < ?').bind(stale).run()
  const result = await db.prepare(`INSERT INTO media_objects (key,mime,bytes,created_at)
    SELECT ?,?,?,? WHERE (SELECT COALESCE(SUM(bytes),0) FROM media_objects) + ? <= ?`)
    .bind(key, mime, size, Date.now(), size, MEDIA_STORAGE_BYTES).run()
  return !!result.meta.changes
}

export const MEDIA_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }
export function validMediaHeader(header: Uint8Array, mime: string) {
  const ascii = (start: number, end: number) => String.fromCharCode(...header.slice(start, end))
  return header.length >= 16 && (mime === 'image/jpeg' ? header[0] === 255 && header[1] === 216 && header[2] === 255 : mime === 'image/png' ? ascii(1, 4) === 'PNG' && header[0] === 137 : mime === 'image/webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' : mime === 'video/mp4' ? ascii(4, 8) === 'ftyp' : mime === 'video/webm' && header[0] === 26 && header[1] === 69 && header[2] === 223 && header[3] === 163)
}

export async function storeMedia(db: Database, key: string, mime: string, size: number, stream: ReadableStream<Uint8Array>) {
  await ensureMediaStorage(db)
  const stale = Date.now() - 3600000
  await db.prepare('DELETE FROM media_chunks WHERE key IN (SELECT key FROM media_objects WHERE complete=0 AND created_at < ?)').bind(stale).run()
  await db.prepare('DELETE FROM media_objects WHERE complete=0 AND created_at < ?').bind(stale).run()
  const reserved = await db.prepare(`INSERT INTO media_objects (key,mime,bytes,created_at)
    SELECT ?,?,?,? WHERE (SELECT COALESCE(SUM(bytes),0) FROM media_objects) + ? <= ?`)
    .bind(key, mime, size, Date.now(), size, MEDIA_STORAGE_BYTES).run()
  if (!reserved.meta.changes) { await stream.cancel(); throw new Error('MEDIA_STORAGE_FULL') }
  const reader = stream.getReader()
  let buffer = new Uint8Array(MEDIA_CHUNK_BYTES), filled = 0, bytes = 0, position = 0
  const write = async () => {
    await db.prepare('INSERT INTO media_chunks (key,position,data) VALUES (?,?,?)').bind(key, position++, buffer.slice(0, filled).buffer).run()
    buffer = new Uint8Array(MEDIA_CHUNK_BYTES); filled = 0
  }
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      bytes += next.value.byteLength
      if (bytes > size) throw new Error('MEDIA_SIZE_MISMATCH')
      let offset = 0
      while (offset < next.value.length) {
        const take = Math.min(buffer.length - filled, next.value.length - offset)
        buffer.set(next.value.subarray(offset, offset + take), filled); filled += take; offset += take
        if (filled === buffer.length) await write()
      }
    }
    if (bytes !== size) throw new Error('MEDIA_SIZE_MISMATCH')
    if (filled) await write()
    await db.prepare('UPDATE media_objects SET complete=1 WHERE key=?').bind(key).run()
  } catch (error) {
    await reader.cancel().catch(() => {})
    await removeMediaObject(db, key)
    throw error
  } finally { reader.releaseLock() }
}

export function mediaBody(db: Database, key: string, offset: number, length: number) {
  let position = Math.floor(offset / MEDIA_CHUNK_BYTES), remaining = length, cancelled = false
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!remaining) { controller.close(); return }
      const end = Math.min(position + 3, Math.floor((offset + remaining - 1) / MEDIA_CHUNK_BYTES))
      const { results } = await db.prepare('SELECT position,data FROM media_chunks WHERE key=? AND position>=? AND position<=? ORDER BY position').bind(key, position, end).all<{ position: number; data: number[] | ArrayBuffer }>()
      if (cancelled) return
      if (results.length !== end - position + 1) { controller.error(new Error('Missing media chunk.')); return }
      for (const row of results) {
        if (row.position !== position) { controller.error(new Error('Invalid media chunk order.')); return }
        const bytes = row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : Uint8Array.from(row.data)
        const start = offset % MEDIA_CHUNK_BYTES, take = Math.min(bytes.length - start, remaining)
        if (take <= 0) { controller.error(new Error('Invalid media chunk.')); return }
        controller.enqueue(bytes.subarray(start, start + take)); remaining -= take; offset += take; position++
      }
      if (!remaining) controller.close()
    },
    cancel() { cancelled = true },
  })
}
