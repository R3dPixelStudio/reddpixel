import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useExperience } from './stores/useExperience'
import { jumpToPhase, syncCameraToLayout } from './core/timeline/cinematicController'
import Layout from './ui/Layout'

// Keep the semantic UI out of the Three.js dependency graph.
const SceneLoader = lazy(() => import('./world/SceneLoader'))

class SceneBoundary extends React.Component<{ children: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) {
    console.warn('The 3D experience could not start. The portfolio remains available.', error.message)
    this.props.onFailure()
  }
  render() { return this.state.failed ? null : this.props.children }
}

const App: React.FC = () => {
  const isCubeReady = useExperience((state) => state.isCubeReady)
  const isContentView = useExperience((state) => state.isContentView)
  const [sceneFailed, setSceneFailed] = useState(false)
  const toggleRef = useRef<HTMLDetailsElement | null>(null)
  const handleSceneFailure = useCallback(() => setSceneFailed(true), [])

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncLayout = () => {
      useExperience.getState().setMobileLayout(mobile.matches)
      syncCameraToLayout()
    }
    const syncMotion = () => useExperience.getState().setReducedMotion(reduced.matches)
    syncLayout()
    syncMotion()
    mobile.addEventListener('change', syncLayout)
    reduced.addEventListener('change', syncMotion)
    return () => {
      mobile.removeEventListener('change', syncLayout)
      reduced.removeEventListener('change', syncMotion)
    }
  }, [])

  useEffect(() => {
    window.clearTimeout(Number(document.documentElement.dataset.startupTimer))
    delete document.documentElement.dataset.startupTimer
    const portfolio = document.querySelector<HTMLDetailsElement>('#portfolio-view')
    const oracle = document.querySelector<HTMLButtonElement>('#portfolio-oracle')
    if (!portfolio) return
    toggleRef.current = portfolio
    const blogLink = portfolio.querySelector<HTMLAnchorElement>('a[href="/blog/"]')
    if (blogLink && window.location.search) blogLink.href = `/blog/${window.location.search}`
    // Native details remains open and usable if JavaScript never starts.
    portfolio.open = window.location.hash.startsWith('#portfolio-')
    portfolio.toggleAttribute('data-fallback', portfolio.open)
    const onToggle = () => useExperience.getState().setContentView(portfolio.open)
    const onOracle = () => {
      portfolio.open = false
      onToggle()
      jumpToPhase(3)
    }
    onToggle()
    portfolio.addEventListener('toggle', onToggle)
    oracle?.addEventListener('click', onOracle)
    if (oracle) oracle.hidden = false
    return () => {
      portfolio.removeEventListener('toggle', onToggle)
      oracle?.removeEventListener('click', onOracle)
      if (oracle) oracle.hidden = true
    }
  }, [])

  useEffect(() => {
    if (!sceneFailed || !toggleRef.current) return
    toggleRef.current.setAttribute('data-fallback', '')
    toggleRef.current.open = true
    useExperience.getState().setContentView(true)
  }, [sceneFailed])

  useEffect(() => {
    if (isCubeReady || sceneFailed || isContentView) return
    let timeout: number | undefined
    const armDeadline = () => {
      window.clearTimeout(timeout)
      if (document.hidden) return
      timeout = window.setTimeout(() => {
        console.warn('3D startup timed out. Opening the portfolio text view.')
        handleSceneFailure()
      }, 20000)
    }
    armDeadline()
    document.addEventListener('visibilitychange', armDeadline)
    return () => {
      window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', armDeadline)
    }
  }, [handleSceneFailure, isCubeReady, sceneFailed, isContentView])

  return (
    <div id="cinematic-content" inert={isContentView} aria-hidden={isContentView}>
      {!isCubeReady && <div className="fallback-artifact" aria-hidden="true"><span /></div>}
      {!sceneFailed && (
        <SceneBoundary onFailure={handleSceneFailure}>
          <Suspense fallback={null}><SceneLoader onFailure={handleSceneFailure} /></Suspense>
        </SceneBoundary>
      )}
      <Layout />
      {!isCubeReady && !sceneFailed && (
        <p role="status" className="scene-loading">Preparing the 3D experience</p>
      )}
    </div>
  )
}

export default App


