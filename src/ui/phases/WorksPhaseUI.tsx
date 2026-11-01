import { useEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'
import { SHOWCASES, VISUAL_SECTIONS, type MediaItem } from '../../content/portfolio'
import { workCollections, type CmsWork } from '../../content/cms'
import Signature from '../art/Signature'
import MediaCarousel from '../work/MediaCarousel'
import ProjectShowcase from '../work/ProjectShowcase'
import VisualShowcase from '../work/VisualShowcase'
import LineIcon from '../art/LineIcon'

import { GIRIH_PATH } from '../../content/ornament'

function BranchArt({ category }: { category: string }) {
  if (category === 'web') return <span className="branch-browser"><i /><i /><i /><b /><b /><b /></span>
  return <span className={`branch-drawing drawing-${category}`}><svg viewBox="0 0 180 160" fill="none">
    {category === 'vfx' ? <><path className="drawing-orbit" d={GIRIH_PATH} transform="translate(40 30)" /><path d="M90 34 138 60v54l-48 28-48-28V60Z M42 60l48 28 48-28 M90 88v54 M90 34v54" /><path className="drawing-accent" d="m90 58 25 14v28l-25 14-25-14V72Z" /></> : <><path d="M24 30h132v104H24Z M34 45h32v24H34Z M114 45h32v24h-32Z M46 69v22h34v27 M130 69v22H98v27 M80 52h18v17H80Z M89 69v49" /><path className="drawing-accent" d="M41 118h17v7H41Z M80 118h18v7H80Z M121 118h17v7h-17Z M40 56h20 M120 56h20 M86 59h6" /><path d="M12 18h18 M12 18v18 M168 18h-18 M168 18v18 M12 146h18 M12 146v-18 M168 146h-18 M168 146v-18" /></>}
  </svg></span>
}

export default function WorksPhaseUI() {
  const phase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const reducedMotion = useExperience((state) => state.reducedMotion)
  const active = phase === 2 && mode === MODES.EXPLORE
  const [selected, setSelected] = useState<string | null>(null)
  const [visualCategory, setVisualCategory] = useState<'architecture' | 'creative'>('architecture')
  const root = useRef<HTMLElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const collectionHeading = useRef<HTMLHeadingElement>(null)
  const restoreFrame = useRef<number | null>(null)
  const [categories, setCategories] = useState(SHOWCASES)
  const category = categories.find((item) => item.id === selected)
  const projects = category?.projects.filter(project => category.id !== 'vfx' || (project.visualCategory ?? 'creative') === visualCategory) ?? []
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/cms/work', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Work service unavailable')
      return response.json() as Promise<{ items: CmsWork[] }>
    }).then(result => { if (!controller.signal.aborted) setCategories(workCollections(result.items)) }).catch(() => { /* Repository-backed work stays available without the CMS. */ })
    return () => controller.abort()
  }, [])

  useGSAP(() => {
    timeline.current = gsap.timeline({ paused: true })
      .fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
      .fromTo('.work-heading-line', { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'expo.inOut' }, 0)
      .fromTo('.collection-branch', { y: 45, rotationX: 12, opacity: 0 }, { y: 0, rotationX: 0, opacity: 1, duration: 0.85, stagger: 0.1, ease: 'power3.out' }, .1)
  }, { scope: root })
  useGSAP(() => {
    if (active) timeline.current?.timeScale(reducedMotion ? 1000 : 1).play()
    else timeline.current?.timeScale(reducedMotion ? 1000 : 2).reverse()
  }, { scope: root, dependencies: [active, reducedMotion] })
  useGSAP((_context, contextSafe) => {
    if (!selected) return
    if (!active) {
      setSelected(null)
      useExperience.getState().setWorkCollection(false)
      return
    }
    const state = useExperience.getState()
    state.setWorkCollection(true, true)
    const opening = gsap.timeline({ onComplete: () => {
      gsap.set(root.current!.querySelector('.collection-content'), { clearProps: 'transform' })
      useExperience.getState().setWorkCollection(true)
    } })
      .fromTo('.collection-content', { xPercent: 100, force3D: false }, { xPercent: 0, force3D: false, duration: reducedMotion ? .01 : .55, ease: 'power3.inOut' })
      .to('.collection-index', { scale: .97, duration: reducedMotion ? .01 : .55, ease: 'power3.inOut' }, 0)
    let closing: gsap.core.Timeline | null = null
    const close = contextSafe!(() => {
      if (closing) return
      root.current?.querySelectorAll('video').forEach(video => video.pause())
      opening.kill()
      useExperience.getState().setWorkCollection(true, true)
      useExperience.getState().setSceneObscured(false)
      closing = gsap.timeline({ onComplete: () => {
        setSelected(null)
        useExperience.getState().setWorkCollection(false)
        if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current)
        restoreFrame.current = requestAnimationFrame(() => {
          root.current?.querySelector<HTMLButtonElement>(`[data-collection="${selected}"]`)?.focus({ preventScroll: true })
          restoreFrame.current = null
        })
      } })
        .to('.collection-content', { xPercent: 100, force3D: false, duration: reducedMotion ? .01 : .45, ease: 'power3.inOut' })
        .to('.collection-index', { scale: 1, duration: reducedMotion ? .01 : .45, ease: 'power3.inOut' }, 0)
    })
    const unsubscribe = useExperience.subscribe((next, previous) => {
      if (next.workCloseRequest !== previous.workCloseRequest) close()
    })
    return () => { unsubscribe(); opening.kill(); closing?.kill(); useExperience.getState().setWorkCollection(false) }
  }, { scope: root, dependencies: [selected, active, reducedMotion], revertOnUpdate: true })

  useEffect(() => {
    useExperience.getState().setSceneObscured(active && !!selected)
    return () => useExperience.getState().setSceneObscured(false)
  }, [active, selected])
  useEffect(() => {
    if (!active || !selected) return
    const frame = requestAnimationFrame(() => collectionHeading.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [active, selected])
  useEffect(() => () => {
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current)
  }, [])

  return <section ref={root} data-active={active} aria-label="Work collections" aria-hidden={!active} inert={!active} className="works-phase phase-panel invisible" onKeyDown={event => { if (event.key === 'Escape' && selected) useExperience.getState().requestWorkClose() }}>
    <div className="collection-index" aria-hidden={!!selected} inert={!!selected}>
      <header className="works-heading"><Signature /><div><p className="eyebrow">SELECTED WORK / 02</p><h2>Enter a collection.</h2></div><span className="work-heading-line" aria-hidden="true" /></header>
      <div className="collection-branches">
        {categories.map((item, index) => <button key={item.id} type="button" data-collection={item.id} className={`collection-branch branch-${item.id}`} style={{ '--branch-color': item.colorHex } as CSSProperties} aria-label={`Explore ${item.title}`} onClick={() => { useExperience.getState().setWorkCollection(true, true); setVisualCategory('architecture'); setSelected(item.id) }}>
          <span className="branch-number" aria-hidden="true">0{index + 1} /</span>
          <span className="branch-art" aria-hidden="true"><BranchArt category={item.id} /></span>
          <span className="branch-copy"><strong>{item.title}</strong><span>{item.subtitle}</span></span>
          <span className="branch-enter" aria-hidden="true"><span>Explore</span><LineIcon name="arrow" /></span>
        </button>)}
      </div>
    </div>
    {category && <div className={`collection-content${category.id === 'web' ? ' collection-websites' : category.id === 'vfx' ? ' collection-visuals' : ''}`}>
      <header className="collection-header"><div><p className="eyebrow">COLLECTION / {String(categories.findIndex(item => item.id === category.id) + 1).padStart(2, '0')}</p><h2 ref={collectionHeading} tabIndex={-1}>{category.title}</h2></div><p className="collection-return-hint">Either arrow below returns to collections.</p></header>
      <div className="collection-scroll" tabIndex={0} role="region" aria-label={`${category.title} projects`}>
      {category.id === 'web' ? <ProjectShowcase projects={projects} active={active} /> : <>
      {category.id !== 'vfx' && <p className="collection-intro">Project by project. Installation films, timelapses and the details behind the finished space.</p>}
      {category.id === 'vfx' && <div className="visual-filters" role="tablist" aria-label="Visual disciplines" onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : visualCategory === 'architecture' ? 1 : 0
        setVisualCategory(VISUAL_SECTIONS[next].id)
        event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
      }}>{VISUAL_SECTIONS.map(section => <button key={section.id} id={`visual-tab-${section.id}`} type="button" role="tab" aria-selected={visualCategory === section.id} aria-controls={`visual-panel-${section.id}`} tabIndex={visualCategory === section.id ? 0 : -1} onClick={() => setVisualCategory(section.id)}>{section.title}<span>{section.description}</span></button>)}</div>}
      <div key={`${category.id}-${visualCategory}`} className={`collection-projects${category.id === 'kinetic' ? ' technical-projects' : ' visual-gallery-panel'}`} {...(category.id === 'vfx' ? { role: 'tabpanel', id: `visual-panel-${visualCategory}`, 'aria-labelledby': `visual-tab-${visualCategory}` } : {})}>
      {category.id === 'vfx' && projects.length > 0 ? <VisualShowcase projects={projects} active={active} /> : <div className="website-collection">
        {projects.map((project, index) => <article key={project.subId} className={`website-entry${category.id === 'kinetic' ? ' technical-entry' : ''}`}>
          <MediaCarousel label={`${project.name} gallery`} active={active} compact items={[...new Map((category.id === 'kinetic' && project.gallery.length ? project.gallery.map(media => media.type === 'video' ? { ...media, poster: media.poster || project.cover } : media) : [{ type: 'image', src: project.cover, alt: project.coverAlt }, ...project.gallery] as MediaItem[]).map(item => [item.src, item])).values()]} />
          <div className="project-copy">{category.id === 'kinetic' && <span className="eyebrow">PROJECT FILM / {String(index + 1).padStart(2, '0')}</span>}<h3>{project.name}</h3><p>{project.desc}</p>{project.link && <a className="action-link project-visit" href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.name} ${category.id === 'web' ? 'website' : 'project'}. Opens in a new tab.`}><span>{category.id === 'web' ? 'Visit website' : 'Visit project'}</span><LineIcon name="arrow" /></a>}</div>
        </article>)}
        {category.id === 'kinetic' && projects.length > 0 && <article className="technical-coming-soon" aria-labelledby="technical-coming-soon-title">
          <div className="technical-coming-soon-art" aria-hidden="true"><BranchArt category="kinetic" /></div>
          <div><p className="eyebrow">NEXT PROJECT / IN PREPARATION</p><h3 id="technical-coming-soon-title">Coming soon</h3><p>Another on-site project is taking shape. Its story and film will appear here.</p></div>
        </article>}
      </div>}
      {!projects.length && <div className="work-preparing">
        <div className="work-preparing-art" aria-hidden="true"><BranchArt category={category.id} /></div>
        <p className="eyebrow">{category.id === 'kinetic' ? 'THREE PROJECT STORIES / IN PREPARATION' : 'ART & MOTION / NEXT CHAPTER'}</p>
        <h3>{category.id === 'kinetic' ? 'Built on site. Told in film.' : 'New pieces are taking shape.'}</h3>
        <p>{category.id === 'kinetic' ? 'Installation footage, timelapses and finished details are being edited into three project stories, starting with Café Shariati.' : 'Creative artwork, freelance pieces and films for social platforms will appear here as the collection is published.'}</p>
        {category.id === 'kinetic' && <ol className="technical-story-outline"><li><span>01</span> The project</li><li><span>02</span> The installation</li><li><span>03</span> The finished details</li></ol>}
      </div>}
      </div>
      </>}
      </div>
    </div>}
  </section>
}


