import { useEffect, useState } from 'react'
import { useExperience } from '../stores/useExperience'

export default function GuidanceOverlay() {
  const phase = useExperience(state => state.currentPhase)
  const moving = useExperience(state => state.isTransitioning)
  const ready = useExperience(state => state.isCubeReady)
  const mobile = useExperience(state => state.isMobile)
  const contentView = useExperience(state => state.isContentView)
  return phase === 0 && ready && !moving && !contentView ? <IntroCue mobile={mobile} /> : null
}

function IntroCue({ mobile }: { mobile: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const active = !dismissed

  useEffect(() => {
    if (!active) return
    let pointer: { id: number; x: number; y: number } | null = null
    const dismiss = () => setDismissed(true)
    const timeout = window.setTimeout(dismiss, 5000)
    const down = (event: PointerEvent) => {
      if (event.isPrimary && event.button === 0 && event.target instanceof HTMLCanvasElement) {
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      }
    }
    const move = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 10) dismiss()
    }
    const release = () => { pointer = null }
    const unsubscribe = useExperience.subscribe(state => {
      if (state.isCubeInteracting || state.isTransitioning || state.currentPhase !== 0 || state.isContentView) dismiss()
    })
    window.addEventListener('pointerdown', down, { passive: true, capture: true })
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      window.clearTimeout(timeout)
      unsubscribe()
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
    }
  }, [active])

  return <div className="cube-touch-prompt" data-active={active} aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="none"><path className="tap-rays" d="M10 14a7 7 0 0 1 14 0 M7 14a10 10 0 0 1 20 0" /><path d="M14 26V14a3 3 0 0 1 6 0v8l3-2 8 5v5c0 4-3 7-7 7h-5l-8-9a3 3 0 0 1 4-4l3 3" /></svg>
    <span>{mobile ? 'Tap to enter · Swipe to turn' : 'Click to enter'}</span>
  </div>
}
