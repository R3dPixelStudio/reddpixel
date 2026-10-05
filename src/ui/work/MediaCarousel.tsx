import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { MediaItem } from '../../content/portfolio'
import { IMAGE_SIZES, thumbnail } from '../../content/imageSizes'
import { useExperience } from '../../stores/useExperience'
import LineIcon from '../art/LineIcon'

type Props = { items: MediaItem[]; label: string; active: boolean; compact?: boolean; expandable?: boolean; initialIndex?: number }

export default function MediaCarousel({ items, label, active, compact = false, expandable = true, initialIndex = 0 }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const drag = useRef<{ id: number; x: number; left: number; start: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const [index, setIndex] = useState(initialIndex)
  const [expanded, setExpanded] = useState<{ index: number; trigger: HTMLButtonElement } | null>(null)
  const hasItems = items.length > 0
  const currentIndex = Math.min(index, Math.max(0, items.length - 1))
  const reducedMotion = useExperience(state => state.reducedMotion)
  const nearest = () => {
    const element = track.current
    if (!element) return 0
    const center = element.scrollLeft + element.clientWidth / 2
    let closest = 0, distance = Infinity
    Array.from(element.children).forEach((slide, i) => {
      const node = slide as HTMLElement
      const next = Math.abs(node.offsetLeft + node.offsetWidth / 2 - center)
      if (next < distance) { distance = next; closest = i }
    })
    return closest
  }
  const goTo = (next: number) => {
    const element = track.current
    const target = Math.max(0, Math.min(items.length - 1, next))
    const slide = element?.children[target] as HTMLElement | undefined
    if (!element || !slide) return
    element.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - element.clientWidth / 2, behavior: reducedMotion ? 'instant' : 'smooth' })
  }
  const syncScroll = () => {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => { frame.current = null; setIndex(nearest()) })
  }
  const finishDrag = () => {
    const gesture = drag.current, element = track.current
    if (!gesture || !element) return
    const distance = element.scrollLeft - gesture.left
    const closest = nearest()
    const target = closest === gesture.start && Math.abs(distance) > Math.min(80, element.clientWidth * .15) ? gesture.start + Math.sign(distance) : closest
    drag.current = null
    element.removeAttribute('data-dragging')
    if (element.hasPointerCapture(gesture.id)) element.releasePointerCapture(gesture.id)
    if (gesture.moved) goTo(target)
  }
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false
    if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as Element).closest('video,button:not(.carousel-open),a')) return
    drag.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, start: nearest(), moved: false }
  }
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current
    if (!gesture || event.pointerId !== gesture.id) return
    const distance = event.clientX - gesture.x
    if (Math.abs(distance) < 5 && !gesture.moved) return
    gesture.moved = true
    suppressClick.current = true
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.setAttribute('data-dragging', 'true')
    event.currentTarget.scrollLeft = gesture.left - distance
    event.preventDefault()
  }
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('video,button,a')) return
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault(); event.stopPropagation()
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : currentIndex + (event.key === 'ArrowRight' ? 1 : -1))
  }
  useEffect(() => {
    const element = track.current
    if (!element) return
    element.querySelectorAll('video').forEach((video, i) => {
      const slide = video.closest<HTMLElement>('[data-slide]')
      if (!active || expanded || Number(slide?.dataset.slide ?? i) !== currentIndex) video.pause()
    })
  }, [currentIndex, active, items.length, expanded])
  useEffect(() => {
    const element = track.current
    if (!element) return
    const resize = new ResizeObserver(() => {
      const slide = element.children[Number(element.dataset.index ?? 0)] as HTMLElement | undefined
      if (slide && !drag.current) element.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - element.clientWidth / 2, behavior: 'instant' })
    })
    const pause = () => { if (document.hidden) element.querySelectorAll('video').forEach(video => video.pause()) }
    const cancel = () => {
      drag.current = null
      element.removeAttribute('data-dragging')
    }
    resize.observe(element)
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', pause)
    return () => {
      resize.disconnect(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', pause)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      element.querySelectorAll('video').forEach(video => video.pause())
      if (drag.current && element.hasPointerCapture(drag.current.id)) element.releasePointerCapture(drag.current.id)
      drag.current = null
    }
  }, [hasItems])
  if (!items.length) return <p className="gallery-empty">New work is being prepared for this collection.</p>
  return <section className={`work-carousel${compact ? ' carousel-compact' : ''}`} aria-label={label} aria-roledescription="carousel">
    <div ref={track} className="carousel-track" data-index={currentIndex} tabIndex={items.length > 1 ? 0 : -1} aria-label={`${label}: swipe, drag or use arrow keys`} onScroll={syncScroll} onKeyDown={keyboard} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
      {items.map((item, i) => <figure className="carousel-slide" key={item.src} data-slide={i} data-current={i === currentIndex} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`}>
        <div className="carousel-media">{item.type === 'video'
          ? <video src={item.src} controls playsInline preload={active && currentIndex === i ? 'metadata' : 'none'} aria-label={item.alt} tabIndex={active && currentIndex === i ? 0 : -1} />
          : <>{expandable && <button type="button" className="carousel-open" tabIndex={active && currentIndex === i ? 0 : -1} aria-label={`Expand image ${i + 1} in ${label}`} onClick={event => { if (event.detail > 0 && suppressClick.current) return; if (active) setExpanded({ index: i, trigger: event.currentTarget }) }}><span className="carousel-expand-mark"><LineIcon name="expand" /></span></button>}<img src={item.src} srcSet={thumbnail(item.src) !== item.src ? `${thumbnail(item.src)} 640w, ${item.src} 1200w` : undefined} sizes={compact ? '(min-width:768px) 45vw, 90vw' : '100vw'} width={IMAGE_SIZES[item.src]?.width} height={IMAGE_SIZES[item.src]?.height} loading={i === currentIndex ? 'eager' : 'lazy'} decoding="async" draggable={false} alt={item.alt} /></>}</div>
        <figcaption>{item.alt}</figcaption>
      </figure>)}
    </div>
    <div className="carousel-controls">
      <p className="carousel-counter" aria-live="polite" aria-atomic="true"><span>{String(currentIndex + 1).padStart(2, '0')}</span> / {String(items.length).padStart(2, '0')}</p>
      <div className="carousel-progress" aria-hidden="true"><span style={{ width: `${100 / items.length}%`, transform: `translateX(${currentIndex * 100}%)` }} /></div>
      {items.length > 1 && <div className="carousel-arrows"><button type="button" aria-label={`Previous image in ${label}`} disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>←</button><button type="button" aria-label={`Next image in ${label}`} disabled={currentIndex === items.length - 1} onClick={() => goTo(currentIndex + 1)}>→</button></div>}
    </div>
    {items.length > 1 && <p className="carousel-instruction">Swipe or drag to explore</p>}
    {expanded && active && expandable && createPortal(<FullscreenGallery items={items} label={label} initialIndex={expanded.index} trigger={expanded.trigger} close={() => setExpanded(null)} />, document.body)}
  </section>
}

function FullscreenGallery({ items, label, initialIndex, trigger, close }: { items: MediaItem[]; label: string; initialIndex: number; trigger: HTMLButtonElement; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const animation = useRef<gsap.core.Timeline | null>(null)
  const closing = useRef(false)
  const reducedMotion = useExperience(state => state.reducedMotion)
  useGSAP(() => {
    const element = dialog.current!
    element.showModal()
    animation.current = gsap.timeline({ onReverseComplete: close })
      .fromTo(element, { opacity: 0 }, { opacity: 1, duration: reducedMotion ? .01 : .28, ease: 'power2.out' })
      .fromTo('.fullscreen-gallery-body', { y: 14, scale: .97 }, { y: 0, scale: 1, duration: reducedMotion ? .01 : .28, ease: 'power2.out' }, 0)
    return () => {
      animation.current?.kill()
      element.querySelectorAll('video').forEach(video => video.pause())
      if (element.open) element.close()
      if (trigger.isConnected && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true })
    }
  }, { scope: dialog })
  const dismiss = () => {
    if (closing.current) return
    closing.current = true
    const tween = animation.current
    if (reducedMotion || !tween || tween.progress() === 0) close()
    else tween.timeScale(1.3).reverse()
  }
  return <dialog ref={dialog} className="fullscreen-gallery" aria-label={`${label} full screen`} onCancel={event => { event.preventDefault(); dismiss() }} onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation() }}>
    <header className="fullscreen-gallery-header"><div><p className="eyebrow">REDDPIXEL / GALLERY</p><h2>{label}</h2></div><button type="button" aria-label="Close full-screen gallery" onClick={dismiss}><LineIcon name="close" /></button></header>
    <div className="fullscreen-gallery-body"><MediaCarousel items={items} label={label} active expandable={false} initialIndex={initialIndex} /></div>
  </dialog>
}
