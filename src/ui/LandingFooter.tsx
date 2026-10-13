import { useExperience } from '../stores/useExperience'
import { jumpToPhase } from '../core/timeline/cinematicController'
import { PROFILE } from '../content/portfolio'

export default function LandingFooter() {
  const phase = useExperience(state => state.currentPhase)
  const moving = useExperience(state => state.isTransitioning)
  const ready = useExperience(state => state.isCubeReady)
  const visible = phase === 0 && ready && !moving
  return <section aria-label="Introduction" aria-hidden={!visible} inert={!visible} className="intro-composition" data-visible={visible}>
    <p className="intro-eyebrow">{PROFILE.landingTitle}</p>
    <h1>{PROFILE.brand}</h1>
    <span className="intro-rule" aria-hidden="true" />
    <button className="intro-explore" disabled={!visible} onClick={() => jumpToPhase(1)}>
      <span className="intro-signal" aria-hidden="true" />
      <span>Follow the spark</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
    </button>
  </section>
}
