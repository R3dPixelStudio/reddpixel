import { useExperience } from '../stores/useExperience'

export default function GuidanceOverlay() {
  const phase = useExperience(state => state.currentPhase)
  const moving = useExperience(state => state.isTransitioning)
  const ready = useExperience(state => state.isCubeReady)
  const mobile = useExperience(state => state.isMobile)
  return <div className="cube-touch-prompt" data-active={phase === 0 && ready && !moving} aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none"><path className="tap-rays" d="M24 5V2 M14 9l-3-3 M34 9l3-3" /><path d="M20 26V14a4 4 0 0 1 8 0v9l3-2 4 2 3 1v10l-5 9H21l-8-12a3 3 0 0 1 4-4l3 3" /><path d="M28 23v8 M33 24v7" /></svg>
    <span>{mobile ? 'Tap to enter · Swipe to rotate' : 'Click the cube'}</span>
  </div>
}
