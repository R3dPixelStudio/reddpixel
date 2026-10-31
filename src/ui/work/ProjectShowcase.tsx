import { useState } from 'react'
import type { MediaItem, Project } from '../../content/portfolio'
import MediaCarousel from './MediaCarousel'
import LineIcon from '../art/LineIcon'
import './ProjectShowcase.css'

export default function ProjectShowcase({ projects, active, kind = 'web' }: { projects: Project[]; active: boolean; kind?: 'web' | 'visual' }) {
  const [selectedId, setSelectedId] = useState(projects[0]?.subId ?? '')
  const project = projects.find(item => item.subId === selectedId) ?? projects[0]
  const visual = kind === 'visual'
  if (!project) return <p className="gallery-empty">New projects are being prepared.</p>
  const screens = [...new Map(([{ type: 'image', src: project.cover, alt: project.coverAlt }, ...project.gallery] as MediaItem[]).map(item => [item.src, item])).values()]

  return <div className={`website-showcase${visual ? ' visual-showcase' : ''}`}>
    <nav className="website-index" aria-label={visual ? 'Visual projects' : 'Website projects'}>
      <div className="website-index-heading"><p className="eyebrow">SELECTED / {String(projects.length).padStart(2, '0')}</p><p>{visual ? 'Visuals,' : 'Websites,'}<br />frame by frame.</p></div>
      <div className="website-project-list">{projects.map((item, index) => <button key={item.subId} type="button" className="website-project-choice" aria-pressed={item.subId === project.subId} aria-label={`Browse ${item.name} ${visual ? 'images' : 'screenshots'}`} onClick={() => setSelectedId(item.subId)}>
        <span className="website-project-number">{String(index + 1).padStart(2, '0')}</span><span>{item.name}</span><i aria-hidden="true" />
      </button>)}</div>
      <p className="website-index-note">{visual ? 'Spaces, details and atmosphere.' : 'A closer look at the interfaces.'}<br />Explore without leaving.</p>
    </nav>
    <article key={project.subId} className="website-screen-story" aria-label={`${project.name} ${visual ? 'visual study' : 'screen study'}`}>
      <header className="website-story-heading"><h3>{project.name}</h3><span className="website-view-label">{visual ? 'VISUAL STUDY' : 'SCREEN STUDY'}</span></header>
      <div className="website-screen-window"><div className="website-window-bar" aria-hidden="true"><span><i /><i /><i /></span><span>REDDPIXEL / {visual ? 'SPACES & ATMOSPHERE' : 'INTERFACE ARCHIVE'}</span><LineIcon name="expand" /></div>
        <MediaCarousel items={screens} label={`${project.name} gallery`} active={active} filmstrip filmstripLabel={visual ? 'image' : 'screen'} />
      </div>
      <footer className={`website-story-footer${!project.link || visual ? ' project-footer-notes' : ''}`}>
        <details className="website-project-notes"><summary>{visual ? 'Behind the project' : 'Behind the interface'} <span aria-hidden="true">+</span></summary><p>{project.desc}</p></details>
        {!visual && project.link && <a className="website-live-stamp" href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.name} live website in a new tab`}><span><small>BEYOND THE SCREENS</small><strong>Open live site</strong></span><LineIcon name="arrow" /><span className="website-new-tab">NEW TAB</span></a>}
      </footer>
    </article>
  </div>
}
