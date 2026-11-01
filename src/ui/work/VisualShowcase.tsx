import { useEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { MediaItem, Project } from '../../content/portfolio'
import { prepareGalleryPreview } from './galleryImages'
import { useExperience } from '../../stores/useExperience'
import MediaCarousel from './MediaCarousel'
import './VisualShowcase.css'

export default function VisualShowcase({ projects, active }: { projects: Project[]; active: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const alive = useRef(false)
  const request = useRef(0)
  const [selection, setSelection] = useState({ id: projects[0]?.subId ?? '', previous: '', direction: 1 })
  const [pending, setPending] = useState('')
  const reducedMotion = useExperience(state => state.reducedMotion)
  const project = projects.find(item => item.subId === selection.id) ?? projects[0]
  const previous = projects.find(item => item.subId === selection.previous && item.subId !== project?.subId)
  const selectedIndex = Math.max(0, projects.findIndex(item => item.subId === (pending || project?.subId)))

  useEffect(() => {
    alive.current = active
    return () => { alive.current = false; request.current += 1 }
  }, [active])

  const selectProject = async (next: Project) => {
    const token = ++request.current
    if (next.subId === project?.subId) { setPending(''); return }
    setPending(next.subId)
    // Reveal the small decoded preview; the native responsive image sharpens in place.
    // A failed preview must not prevent the original image and retry UI from mounting.
    await prepareGalleryPreview(next.cover, 'high').catch(() => {})
    if (!alive.current || token !== request.current) return
    setSelection(current => ({ id: next.subId, previous: project?.subId ?? '', direction: projects.findIndex(item => item.subId === next.subId) >= projects.findIndex(item => item.subId === current.id) ? 1 : -1 }))
    setPending('')
  }

  useGSAP(() => {
    if (!active || !project) return
    const layer = root.current?.querySelector<HTMLElement>('.visual-atlas-layer[data-current=true]')
    const seam = root.current?.querySelector('.visual-atlas-seam')
    const trace = root.current?.querySelector('.visual-atlas-trace path')
    const notes = root.current?.querySelector('.visual-atlas-notes')
    if (!layer) return
    const hasPrevious = !!previous
    const duration = reducedMotion ? .01 : .72
    const forward = selection.direction > 0
    const timeline = gsap.timeline({ onComplete: () => {
      if (hasPrevious && alive.current) setSelection(current => current.id === project.subId ? { ...current, previous: '' } : current)
    } })
    timeline.fromTo(layer,
      { clipPath: hasPrevious && !reducedMotion ? forward ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' : 'inset(0 0% 0 0%)' },
      { clipPath: 'inset(0 0% 0 0%)', duration, ease: 'power2.inOut' }, 0)
    if (trace) timeline.fromTo(trace, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, 0)
    if (notes) timeline.fromTo(notes, { opacity: reducedMotion ? 1 : .25, y: reducedMotion ? 0 : 6 }, { opacity: 1, y: 0, duration: reducedMotion ? .01 : .4 }, reducedMotion ? 0 : .2)
    if (seam && hasPrevious && !reducedMotion) {
      timeline.fromTo(seam, { left: forward ? '0%' : '100%', opacity: 1 }, { left: forward ? '100%' : '0%', duration, ease: 'power2.inOut' }, 0)
        .to(seam, { opacity: 0, duration: .15 }, duration - .12)
    } else if (seam) gsap.set(seam, { opacity: 0 })
    return () => { timeline.kill() }
  }, { scope: root, dependencies: [project?.subId, active, reducedMotion], revertOnUpdate: true })

  if (!project) return <p className="gallery-empty">New visual projects are being prepared.</p>
  const layers = previous ? [previous, project] : [project]
  return <div ref={root} className="visual-atlas" data-transitioning={!!previous} aria-busy={!!pending || !!previous}>
    <nav className="visual-project-rail" aria-label="Visual projects" style={{ '--visual-count': projects.length, '--visual-position': selectedIndex } as CSSProperties}>
      {projects.map((item, index) => <button key={item.subId} type="button" className="visual-project-choice" aria-label={`Browse ${item.name} images`} aria-pressed={index === selectedIndex} onPointerEnter={() => { void prepareGalleryPreview(item.cover, 'high').catch(() => {}) }} onFocus={() => { void prepareGalleryPreview(item.cover, 'high').catch(() => {}) }} onClick={() => { void selectProject(item) }}>
        <span className="visual-project-order">{String(index + 1).padStart(2, '0')} /</span><span className="visual-project-title">{item.name}</span>
        <svg className="visual-project-sigil" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 10 10-10 10L2 12Z M7 7h10v10H7Z" pathLength="1" /></svg>
      </button>)}
      <span className="visual-project-marker" aria-hidden="true" />
    </nav>
    <div className="visual-atlas-stage">
      {layers.map(item => {
        const current = item.subId === project.subId
        const media = [...new Map(([{ type: 'image', src: item.cover, alt: item.coverAlt }, ...item.gallery] as MediaItem[]).map(image => [image.src, image])).values()]
        return <article key={item.subId} className="visual-atlas-layer" data-current={current} aria-label={`${item.name} visual study`} aria-hidden={!current} inert={!current || !!previous}>
          <h3 className="visual-atlas-accessible-title">{item.name}</h3>
          <MediaCarousel items={media} label={`${item.name} gallery`} active={active && current} />
        </article>
      })}
      <svg className="visual-atlas-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M.2 .2H99.8V99.8H.2Z" pathLength="1" vectorEffect="non-scaling-stroke" /></svg>
      <span className="visual-atlas-seam" aria-hidden="true" />
      <p className="visual-atlas-hint">Swipe / drag · Open full screen</p>
    </div>
    <details key={project.subId} className="visual-atlas-notes" onKeyDown={event => { if (event.key === 'Escape' && event.currentTarget.open) { event.stopPropagation(); event.currentTarget.open = false } }}>
      <summary><span>Project brief</span><span className="visual-atlas-project-name">{project.name}</span><i aria-hidden="true">+</i></summary><p>{project.desc}</p>
    </details>
    <span className="visual-atlas-status" role="status">{pending ? `Loading ${projects.find(item => item.subId === pending)?.name ?? 'project'} preview…` : ''}</span>
  </div>
}
