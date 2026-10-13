import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'
import { jumpToPhase } from '../../core/timeline/cinematicController'
import { PROFILE, EXPERTISE, EXPERIENCES, LANGUAGES, CERTIFICATES, SKILLS } from '../../content/portfolio'
import { GIRIH_PATH } from '../../content/ornament'
import LineIcon from '../art/LineIcon'
import AboutSignature from '../art/AboutSignature'
import { aboutSourceAnchor } from '../../world/aboutComposition'

export default function AboutPhaseUI() {
  const phase = useExperience(state => state.currentPhase)
  const mode = useExperience(state => state.mode)
  const reducedMotion = useExperience(state => state.reducedMotion)
  const transitioning = useExperience(state => state.isTransitioning)
  const active = phase === 1 && mode === MODES.EXPLORE
  const root = useRef<HTMLElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const [portraitTurned, setPortraitTurned] = useState(false)
  useEffect(() => {
    const frame = root.current?.querySelector<HTMLElement>('.about-frame')
    if (!frame) return
    const sync = () => {
      const rect = frame.getBoundingClientRect()
      aboutSourceAnchor.left = rect.left / window.innerWidth * 2 - 1
      aboutSourceAnchor.right = (rect.left + rect.width * .97) / window.innerWidth * 2 - 1
      aboutSourceAnchor.top = 1 - (rect.top + rect.height * .04) / window.innerHeight * 2
      aboutSourceAnchor.bottom = 1 - (rect.top + rect.height * .97) / window.innerHeight * 2
      aboutSourceAnchor.revision++
    }
    const observer = new ResizeObserver(sync)
    observer.observe(frame)
    window.addEventListener('resize', sync)
    sync()
    return () => { observer.disconnect(); window.removeEventListener('resize', sync) }
  }, [])
  useEffect(() => useExperience.subscribe((state, previous) => {
    if (state.currentPhase !== 1 || previous.currentPhase === 1) return
    root.current?.querySelector<HTMLElement>('.about-reading-panel')?.scrollTo({ top: 0, behavior: 'instant' })
    setPortraitTurned(false)
  }), [])
  useEffect(() => {
    const container = root.current
    const panel = container?.querySelector<HTMLElement>('.about-reading-panel')
    const content = panel?.querySelector<HTMLElement>('.about-scroll-content')
    if (!panel || !content || !active) return
    let frame: number | null = null
    const sync = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        container?.toggleAttribute('data-scrollable', panel.scrollHeight - panel.scrollTop - panel.clientHeight > 12)
      })
    }
    const observer = new ResizeObserver(sync)
    observer.observe(panel); observer.observe(content)
    panel.addEventListener('scroll', sync, { passive: true }); sync()
    return () => { observer.disconnect(); panel.removeEventListener('scroll', sync); if (frame !== null) cancelAnimationFrame(frame); container?.removeAttribute('data-scrollable') }
  }, [active])
  useGSAP(() => {
    const path = root.current!.querySelector<SVGPathElement>('.about-trace path')!
    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: `${length} ${length}`, strokeDashoffset: length })
    timeline.current = gsap.timeline({ paused: true })
      .fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: .06 })
      .fromTo('.persian-node', { scale: 0, rotation: -45 }, { scale: 1, rotation: 45, duration: .35, ease: 'power2.out' })
      .fromTo(path, { strokeDashoffset: length }, { strokeDashoffset: 0, duration: .7, ease: 'sine.inOut' })
      .fromTo('.about-reading-panel', { autoAlpha: 0 }, { autoAlpha: 1, duration: .16 })
      .fromTo('.about-reveal', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .3, stagger: .035, ease: 'power3.out' }, '-=.04')
  }, { scope: root })
  useGSAP(() => {
    if (active) timeline.current?.timeScale(reducedMotion ? 1000 : 1).restart()
    else timeline.current?.timeScale(reducedMotion ? 1000 : 2.5).reverse()
  }, { scope: root, dependencies: [active, reducedMotion] })
  useGSAP((_context, contextSafe) => {
    const panel = root.current?.querySelector<HTMLElement>('.about-reading-panel')
    if (!active || !panel) return
    const items = Array.from(panel.querySelectorAll<HTMLElement>('.language-item'))
    gsap.set('.language-fill', { scaleX: 0, transformOrigin: 'left' })
    let observer: IntersectionObserver | null = null
    const reveal = contextSafe!((item: HTMLElement) => {
      gsap.to(item.querySelector('.language-fill'), { scaleX: 1, duration: reducedMotion ? 0 : 1.15, ease: 'power2.out' })
    })
    const watch = contextSafe!(() => {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement)
          observer?.unobserve(entry.target)
        }
      }, { root: panel, threshold: .7, rootMargin: '0px 0px -12px 0px' })
      items.forEach(item => observer!.observe(item))
    })
    const opening = timeline.current
    const delay = reducedMotion ? 0 : Math.max(0, (opening?.duration() ?? 0) - (opening?.time() ?? 0))
    gsap.delayedCall(delay, watch)
    return () => observer?.disconnect()
  }, { scope: root, dependencies: [active, reducedMotion], revertOnUpdate: true })
  return <section ref={root} data-active={active} aria-label="About REDDPIXEL" aria-hidden={!active} inert={!active || transitioning} className="about-phase phase-panel invisible">
    <div className="about-frame">
      <span className="persian-node" aria-hidden="true" />
      <svg className="about-trace" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40H970V970H30V40H0" /></svg>
      <div className="about-reading-panel" tabIndex={0} role="region" aria-label="About details"><div className="about-scroll-content">
        <header className="about-identity about-reveal">
          <button type="button" className="portrait-medallion" data-turned={portraitTurned} aria-label="Rotate portrait ornament" aria-pressed={portraitTurned} onClick={() => setPortraitTurned(!portraitTurned)}><svg className="portrait-orbit" viewBox="0 0 100 100" aria-hidden="true"><path d={GIRIH_PATH} /></svg><span className="portrait-diamond"><img src={PROFILE.portrait} srcSet="/images/optimized/profile-320.webp 320w, /images/optimized/profile-640.webp 640w" sizes="100px" width={640} height={853} loading="lazy" decoding="async" alt="The creator behind REDDPIXEL" /></span></button>
          <div><p className="eyebrow">REDDPIXEL / 01</p><h2>{PROFILE.statement}</h2></div>
          <AboutSignature key={active ? 'open' : 'closed'} />
        </header>
        <div className="about-expertise about-reveal">{EXPERTISE.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.description}</p><p className="expertise-tools">{item.tools}</p></article>)}</div>
        <section className="about-reveal about-skills" aria-label="Toolkit"><h3 className="section-label"><LineIcon name="toolkit" />TOOLKIT</h3><p>{SKILLS.join(' / ')}</p></section>
        <div className="about-details-grid"><div className="about-records">
          <section className="about-reveal experience-record"><h3 className="section-label"><LineIcon name="experience" />EXPERIENCE</h3>{EXPERIENCES.map(item => <article key={item.title}><h4>{item.title}<span>{item.duration}</span></h4><p>{item.role}</p></article>)}</section>
          <section className="about-reveal language-record"><h3 className="section-label"><LineIcon name="language" />LANGUAGES</h3>{LANGUAGES.map((item, index) => <div key={item.name} className="language-item"><p><span>{item.name}</span><span>{item.level}</span></p><div className="language-track" role="img" aria-label={`${item.name}: ${item.level}`}><span className="language-fill" style={{ width: `${[100, 90, 50][index]}%` }} /></div></div>)}</section>
        </div>
        <section className="about-reveal certificate-record"><h3 className="section-label"><LineIcon name="education" />EDUCATION & CERTIFICATES</h3>{CERTIFICATES.map((item, index) => <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer"><LineIcon name={index === 0 ? 'education' : 'certificate'} /><span>{item.title}<small>{item.label}</small></span><LineIcon name="arrow" /></a>)}</section>
        </div>
        <div className="about-reveal about-footer"><p>{PROFILE.availability}</p><p>{PROFILE.relocation}</p><div className="about-actions"><a className="action-link" href="#contact" onClick={event => { event.preventDefault(); jumpToPhase(3) }}><LineIcon name="email" /><span>Discuss a project</span><LineIcon name="arrow" /></a>{PROFILE.instagram && <a className="action-link" href={PROFILE.instagram} target="_blank" rel="noopener noreferrer"><LineIcon name="instagram" /><span>@{PROFILE.mediaIdentity}</span><LineIcon name="arrow" /></a>}</div></div>
      </div></div>
      <p className="about-scroll-cue">Scroll to explore <span aria-hidden="true" /></p>
    </div>
  </section>
}
