import { CERTIFICATES, CONTACT_LINKS, EXPERIENCES, LANGUAGES, PROFILE, SEO, SERVICES, SHOWCASES, SKILLS } from '../src/content/portfolio'
import { IMAGE_SIZES, thumbnail } from '../src/content/imageSizes'

const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)

export const portfolioCss = `
body { margin:0; background:#050505; color:#fff; }
.js #portfolio-view:not([data-fallback]) { display:none; }
#portfolio-view { position:fixed; right:1rem; top:max(.75rem,env(safe-area-inset-top)); z-index:80; color:#fee2e2; font:14px/1.7 system-ui,sans-serif; }
#portfolio-view > summary { cursor:pointer; padding:.5rem .8rem; border:1px solid #7f1d1d; background:#0c0303f2; font:11px/1.6 monospace; letter-spacing:.08em; }
#portfolio-view[open] { inset:0; overflow:auto; overscroll-behavior:contain; background:radial-gradient(ellipse at top left,#290808,#050505 60%); padding:1rem clamp(1rem,5vw,4rem) 3rem; }
#portfolio-view[open] > summary { position:sticky; top:0; z-index:1; width:fit-content; margin-left:auto; }
#portfolio-view .portfolio-document { max-width:68rem; margin:auto; }
#portfolio-view header { padding:2rem 0; border-bottom:1px solid #7f1d1d; }
#portfolio-view h1 { font:600 clamp(2rem,6vw,4rem)/1.1 monospace; letter-spacing:.1em; margin:.5rem 0; }
#portfolio-view h2 { font:500 1.3rem/1.5 monospace; color:#fca5a5; }
#portfolio-view h3 { font:500 1.1rem/1.5 monospace; }
#portfolio-view section { padding:1.5rem 0; border-bottom:1px solid #4a1616; scroll-margin-top:4rem; }
#portfolio-view a { color:#fecaca; text-underline-offset:4px; }
#portfolio-view a:hover { color:white; }
#portfolio-view nav, #portfolio-view .portfolio-contact { display:flex; flex-wrap:wrap; gap:1rem; }
#portfolio-view .portfolio-contact a { border:1px solid #7f1d1d; padding:.7rem 1rem; }
#portfolio-view .portfolio-contact a:first-child { background:#7f1d1d; }
#portfolio-view .portfolio-projects { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr)); gap:2rem; }
#portfolio-view .portfolio-projects article { min-width:0; }
#portfolio-view img { display:block; max-width:100%; height:auto; }
#portfolio-view .portfolio-projects img { width:100%; aspect-ratio:16/9; object-fit:cover; border:1px solid #4a1616; }
#portfolio-view .portfolio-portrait { float:left; width:6rem; margin:0 1.5rem 1rem 0; }
#portfolio-view p { max-width:65ch; }
#portfolio-view .portfolio-skills { padding:0; display:flex; flex-wrap:wrap; gap:.5rem; list-style:none; }
#portfolio-view .portfolio-skills li { border:1px solid #4a1616; padding:.25rem .6rem; }
#portfolio-view small { color:#d4a6a6; }
#portfolio-view button { cursor:pointer; background:#7f1d1d; border:1px solid #ef4444; color:white; padding:.7rem 1rem; font:inherit; }
#portfolio-view :focus-visible { outline:2px solid #fca5a5; outline-offset:4px; }
#portfolio-view .portfolio-collection { margin:1rem 0; }
#portfolio-view .portfolio-collection > summary { cursor:pointer; padding:1rem 0; color:#fca5a5; font:18px/1.5 monospace; }
@media(max-width:767px) { #portfolio-view > summary .portfolio-view-label { display:none; } }
`

export const renderPortfolio = (categories = SHOWCASES) => `<details id="portfolio-view" open>
  <summary>Readable portfolio · Open / Close</summary>
  <main class="portfolio-document" aria-label="REDDPIXEL portfolio">
    <header>
      <small>ARASH MOHAMMADI / DIGITAL + PHYSICAL SYSTEMS</small>
      <h1>${escape(PROFILE.brand)}</h1>
      <p>${escape(PROFILE.landingTitle)}</p>
      <p>${escape(PROFILE.introduction)}</p>
      <nav aria-label="Portfolio sections"><a href="#portfolio-about">About</a><a href="#portfolio-work">Work</a><a href="#portfolio-contact">Contact</a><a href="/blog/">Blog / Field notes</a></nav>
    </header>
    <section id="portfolio-about" aria-labelledby="portfolio-about-title">
      <img class="portfolio-portrait" src="${PROFILE.portrait}" alt="Arash Mohammadi" width="640" height="853" loading="lazy" decoding="async">
      <h2 id="portfolio-about-title">${escape(PROFILE.title)}</h2>
      <p>${escape(PROFILE.statement)}</p>
      <p>${escape(PROFILE.introduction)} Hands-on networking, RF and electrical work add a physical dimension to the practice.</p>
      <p>${escape(PROFILE.availability)} ${escape(PROFILE.relocation)}</p>
      <h3>Capabilities</h3><ul>${SERVICES.map((service) => `<li>${escape(service)}</li>`).join('')}</ul>
      <h3>Skills</h3><ul class="portfolio-skills">${SKILLS.map((skill) => `<li>${escape(skill)}</li>`).join('')}</ul>
      <h3>Experience</h3><ul>${EXPERIENCES.map((item) => `<li>${escape(item.title)} — ${escape(item.duration)} · ${escape(item.role)}</li>`).join('')}</ul>
      <h3>Education & certificates</h3><ul>${CERTIFICATES.map((item) => `<li><a href="${escape(item.href)}">${escape(item.title)}</a> · ${escape(item.label)}</li>`).join('')}</ul>
      <h3>Languages</h3><p>${LANGUAGES.map((item) => `${escape(item.name)} · ${escape(item.level)}`).join(' / ')}</p>
      <small>${escape(PROFILE.mediaIdentity)} — technology, AI and creative experiments.</small>
      ${PROFILE.instagram ? `<p><a href="${escape(PROFILE.instagram)}">SUPERINTELLIGET on Instagram</a></p>` : ''}
    </section>
    <section id="portfolio-work" aria-labelledby="portfolio-work-title">
      <h2 id="portfolio-work-title">Selected work</h2>
      ${categories.map((category) => `<details class="portfolio-collection"><summary>${escape(category.title)}</summary><p>${escape(category.subtitle)}</p><div class="portfolio-projects">${category.projects.map((project) => `<article>
        <img src="${thumbnail(project.cover)}" alt="${escape(project.coverAlt)}" ${IMAGE_SIZES[thumbnail(project.cover)] ? `width="${IMAGE_SIZES[thumbnail(project.cover)].width}" height="${IMAGE_SIZES[thumbnail(project.cover)].height}"` : ''} loading="lazy" decoding="async">
        <h3>${escape(project.name)}</h3><p>${escape(project.desc)}</p>
        ${project.link ? `<a href="${escape(project.link)}">View ${escape(project.name)} ↗</a>` : '<small>Selected visuals are also available in the cinematic Works gallery.</small>'}
      </article>`).join('')}</div></details>`).join('')}
    </section>
    <section id="portfolio-contact" aria-labelledby="portfolio-contact-title">
      <h2 id="portfolio-contact-title">Start a project with Arash</h2>
      <p>${escape(PROFILE.availability)}</p>
      <div class="portfolio-contact">${CONTACT_LINKS.map((link) => `<a href="${escape(link.href)}">${escape(link.action)} / ${escape(link.label)}</a>`).join('')}</div>
      <p><a href="mailto:${PROFILE.email}">${PROFILE.email}</a></p>
      <p>${escape(PROFILE.pricing)}</p>
      <p>The Oracle is an AI guide to this portfolio. Explore the cinematic Contact phase to ask about the work.</p>
      <button type="button" id="portfolio-oracle" hidden>Ask the Oracle about my work</button>
    </section>
  </main>
</details>`

export const structuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Person', '@id': `${SEO.url}#person`, name: PROFILE.name, url: SEO.url, description: `${PROFILE.title}. ${PROFILE.introduction}`, image: new URL(PROFILE.portrait, SEO.url).href, sameAs: [PROFILE.linkedin, ...(PROFILE.instagram ? [PROFILE.instagram] : []), ...(PROFILE.youtube ? [PROFILE.youtube] : [])], knowsAbout: ['Interactive websites', 'Three.js', 'WebGL', '3D visualization'] },
    { '@type': 'WebSite', '@id': `${SEO.url}#website`, url: SEO.url, name: PROFILE.brand, description: SEO.description, inLanguage: 'en', author: { '@id': `${SEO.url}#person` } },
  ],
})

export const renderHead = () => `
<title>${escape(SEO.title)}</title>
<meta name="description" content="${escape(SEO.description)}">
<link rel="canonical" href="${SEO.url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#050505">
<meta property="og:title" content="${escape(SEO.title)}">
<meta property="og:description" content="${escape(SEO.description)}">
<meta property="og:url" content="${SEO.url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${PROFILE.brand}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${SEO.image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(SEO.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(SEO.title)}">
<meta name="twitter:description" content="${escape(SEO.description)}">
<meta name="twitter:image" content="${SEO.image}">
<meta name="twitter:image:alt" content="${escape(SEO.imageAlt)}">
<script type="application/ld+json">${JSON.stringify(structuredData()).replace(/</g, '\\u003c')}</script>
<style>${portfolioCss}</style>`


