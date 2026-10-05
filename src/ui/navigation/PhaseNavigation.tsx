import { useEffect } from 'react'
import { useExperience } from '../../stores/useExperience'
import { destroyCinematicController, jumpToPhase, resumePendingPhase } from '../../core/timeline/cinematicController'

const PHASES = ['intro', 'about', 'work', 'contact']

export default function PhaseNavigation() {
  const phase = useExperience((state) => state.currentPhase)
  const busy = useExperience((state) => state.isTransitioning)

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
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('.phase-panel[data-active="true"] h2')
      heading?.setAttribute('tabindex', '-1')
      heading?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [busy, phase])

  return <nav className="phase-navigation" hidden={phase !== 0 || busy} aria-label="Portfolio phases">
    <div>{PHASES.map((name, index) => <a key={name} href={`#${name}`} aria-current={phase === index ? 'location' : undefined}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        jumpToPhase(index)
      }}>{name}</a>)}<a href={`/blog/${window.location.search}`}>Blog</a></div>
  </nav>
}

