import type { CmsMedia } from '../content/cms'
import { api } from './api'
export type UploadMedia = (file: File, selected: (media: CmsMedia) => void) => Promise<CmsMedia | null>
export const mediaDescription = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 300)
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm'

export async function uploadMedia(file: File, signal: AbortSignal, progress: (percent: number) => void): Promise<CmsMedia> {
  const start = await api<{ item: CmsMedia; chunkBytes: number }>('media/start', { method: 'POST', body: JSON.stringify({ mime: file.type, name: file.name, bytes: file.size }) }, signal)
  const key = encodeURIComponent(start.item.key)
  try {
    for (let offset = 0, position = 0; offset < file.size; offset += start.chunkBytes, position++) {
      await api(`media/chunk?key=${key}&position=${position}`, { method: 'PUT', body: file.slice(offset, Math.min(offset + start.chunkBytes, file.size)), headers: { 'Content-Type': file.type } }, signal)
      progress(Math.round(Math.min(offset + start.chunkBytes, file.size) / file.size * 100))
    }
    return (await api<{ item: CmsMedia }>(`media/finish?key=${key}`, { method: 'POST' }, signal)).item
  } catch (error) {
    const cleanup = new AbortController(), timeout = setTimeout(() => cleanup.abort(), 3000)
    try { await api(`media/cancel?key=${key}`, { method: 'DELETE' }, cleanup.signal) } catch { /* Expired reservations are reclaimed by the next upload. */ }
    finally { clearTimeout(timeout) }
    throw error
  }
}
