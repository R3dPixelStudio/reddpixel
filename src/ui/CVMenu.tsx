import { useEffect, useRef, useState } from 'react'

const CV_URL = '/cv/arash-mohammadi.pdf'

export default function CVMenu() {
  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(CV_URL, { method: 'HEAD', signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) setAvailable(response.ok && /^application\/pdf\b/i.test(response.headers.get('Content-Type') ?? ''))
    }).catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])

  return <div ref={root} className="cv-menu">
    <button ref={trigger} type="button" className="cv-trigger" aria-expanded={open} aria-controls="cv-options" onClick={() => setOpen(!open)}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 2h7l4 4v12H5Z M12 2v5h4 M8 11h5 M8 14h5" /></svg>CV / PDF <span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <div id="cv-options" className="cv-options">
      <button className="cv-close" type="button" aria-label="Close CV options" onClick={() => { setOpen(false); trigger.current?.focus() }}>×</button>
      <p>ARASH / CURRICULUM VITAE</p>
      {available ? <><a href={CV_URL} download="Arash-Mohammadi-CV.pdf" onClick={() => setOpen(false)}>Download CV <span>↓</span></a><a href={CV_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>View in browser <span>↗</span></a></> : <><button type="button" disabled>Download CV <span>↓</span></button><button type="button" disabled>View in browser <span>↗</span></button><small>PDF coming soon</small></>}
    </div>}
  </div>
}
