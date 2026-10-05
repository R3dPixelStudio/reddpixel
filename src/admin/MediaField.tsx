import { useEffect, useState } from 'react'
import { api } from './api'
import type { CmsMedia } from '../content/cms'
import { MEDIA_ACCEPT, type UploadMedia } from './uploads'
type Props = { label: string; src: string; type?: 'image' | 'video'; imagesOnly?: boolean; required?: boolean; busy: boolean; upload: UploadMedia; change: (src: string) => void; select: (media: CmsMedia) => void }

export default function MediaField({ label, src, type = 'image', imagesOnly = false, required = false, busy, upload, change, select }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CmsMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError('') } })
    api<{ items: CmsMedia[] }>('media', {}, controller.signal)
      .then(result => { if (!controller.signal.aborted) setItems(result.items.filter(item => !imagesOnly || item.type === 'image')) })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not open the library.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [open, imagesOnly])
  return <section className="media-field" aria-label={label}>
    <p className="media-field-title">{label}</p>
    {src && <div className="media-field-preview">{type === 'video' ? <video src={src} controls playsInline preload="metadata" /> : <img src={src} alt={`${label} preview`} loading="lazy" />}</div>}
    <div className="media-field-actions"><label className="upload-label">{busy ? 'Please wait…' : src ? '↥ Replace file' : '↥ Upload file'}<input aria-label={`Upload ${label}`} type="file" accept={imagesOnly ? 'image/jpeg,image/png,image/webp' : MEDIA_ACCEPT} disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file, media => { select(media); setOpen(false) }) }} /></label><button type="button" disabled={busy} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? 'Close library' : 'Choose from library'}</button></div>
    {open && <div className="media-picker"><p className="studio-hint">Choose an uploaded file. Its path is attached automatically.</p>{loading && <p role="status">Loading library…</p>}{error && <p role="alert">{error}</p>}<div className="media-picker-grid">{items.map(item => <button type="button" key={item.key} disabled={busy} aria-label={`Choose ${item.name}`} onClick={() => { select(item); setOpen(false) }}>{item.type === 'video' ? <span className="media-video-mark">▶ TIMELAPSE</span> : <img src={item.src} alt="" loading="lazy" />}<span>{item.name}</span></button>)}</div>{!loading && !error && !items.length && <p>No uploaded files yet. Use Upload file above.</p>}</div>}
    <details className="media-path"><summary>Existing file path</summary><label>{label} path<input value={src} required={required} placeholder="/images/… or /media/…" disabled={busy} onChange={event => change(event.target.value)} /><small>Use this for images already in the repository.</small></label></details>
  </section>
}
