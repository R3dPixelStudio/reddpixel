import { useEffect, useRef } from 'react'
import { useExperience } from '../../stores/useExperience'
import { destroyCinematicController, jumpToPhase, resumePendingPhase } from '../../core/timeline/cinematicController'

const PHASES = ['intro', 'about', 'work', 'contact']

export default function PhaseNavigation() {
  const phase = useExperience((state) => state.currentPhase)
  const busy = useExperience((state) => state.isTransitioning)
  const headingRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let readingLocation = false
    const readLocation = () => {
      const index = PHASES.indexOf(window.location.hash.slice(1) || 'intro')
      if (index < 0) return
      readingLocation = true
      jumpToPhase(index)
      readingLocation = false
    }
    const unsubscribe = useExperience.subscribe((state, previous) => {
      if (state.isCubeReady && !previous.isCubeReady) resumePendingPhase()
      if (state.currentPhase === previous.currentPhase || readingLocation) return
      const hash = `#${PHASES[state.currentPhase]}`
      if (window.location.hash !== hash) window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
    })
    readLocation()
    window.addEventListener('hashchange', readLocation)
    window.addEventListener('popstate', readLocation)
    return () => {
      unsubscribe()
      window.removeEventListener('hashchange', readLocation)
      window.removeEventListener('popstate', readLocation)
      destroyCinematicController()
    }
  }, [])

  useEffect(() => {
    if (busy || phase === 0 || useExperience.getState().isContentView) return
    headingRef.current?.focus({ preventScroll: true })
  }, [busy, phase])

  return <nav className="phase-navigation" aria-label="Portfolio phases">
    <p ref={headingRef} tabIndex={-1} aria-live="polite">{String(phase).padStart(2, '0')} / {PHASES[phase].toUpperCase()}</p>
    <div>{PHASES.map((name, index) => <a key={name} href={`#${name}`} aria-current={phase === index ? 'location' : undefined}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        jumpToPhase(index)
      }}>{name}</a>)}<a href={`/blog/${window.location.search}`}>Blog</a></div>
  </nav>
}

