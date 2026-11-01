// Public claims come from the existing visible portfolio. See docs/CONTENT-AUDIT.md
// for unresolved differences; these are repository-backed claims, not independent verification.
export interface MediaItem {
  type: 'image' | 'video'
  src: string
  alt: string
  poster?: string
}

export interface Project {
  subId: string
  name: string
  desc: string
  cover: string
  coverAlt: string
  gallery: MediaItem[]
  hasLink: boolean
  link?: string
  visualCategory?: 'architecture' | 'creative'
}

export interface ShowcaseCategory {
  id: string
  title: string
  subtitle: string
  colorHex: string
  bgPattern: string
  projects: Project[]
}

const websiteOrder = ['alphatradezone', 'abi-mobile', 'Architect', 'vfx-webfolio']
export function sortWebsiteProjects(projects: Project[]): Project[] {
  const rank = (id: string) => { const index = websiteOrder.indexOf(id); return index < 0 ? websiteOrder.length : index }
  return [...projects].sort((a, b) => rank(a.subId) - rank(b.subId))
}

export function sortVisualProjects(projects: Project[]): Project[] {
  const order = ['damavand-villa', 'jaryan', 'hormozan-hospital']
  const rank = (id: string) => { const index = order.indexOf(id); return index < 0 ? order.length : index }
  return [...projects].sort((a, b) => rank(a.subId) - rank(b.subId))
}

export const PROFILE = {
  brand: 'REDDPIXEL',
  name: 'REDDPIXEL',
  title: 'Creative Developer & Technical Maker',
  landingTitle: 'Creative Developer / 3D Web',
  statement: 'I BUILD DIGITAL AND PHYSICAL SYSTEMS',
  introduction: 'Interactive websites, 3D web experiences and visual digital work, built with React, Three.js and WebGL.',
  availability: 'For remote projects worldwide, get in touch to discuss scope and timing.',
  relocation: 'Open to selected international full-time opportunities and relocation.',
  mediaIdentity: 'SUPERINTELLIGET',
  instagram: 'https://www.instagram.com/superintelliget/' as string | null,
  youtube: null as string | null,
  portrait: '/images/optimized/profile-640.webp',
  email: 'arashmohammadi9775@gmail.com',
  linkedin: 'https://www.linkedin.com/in/arash-mohammadi-26454b197',
  telegram: 'https://t.me/ReddPixel',
  pricing: 'Pricing depends on scope. Get in touch to discuss requirements, schedule and deliverables.',
}

export const EXPERIENCES = [
  { title: 'Freelancer', duration: '5 YRS', role: 'React / WebGL / 3D / E-commerce' },
  { title: 'Network Technician', duration: '1 YRS', role: 'MikroTik / RF / Passive' },
  { title: 'Electrical Tech', duration: '1 YRS', role: 'Commercial / Residential' },
]

export const LANGUAGES = [
  { name: 'PERSIAN', level: 'NATIVE', pct: 'w-full' },
  { name: 'ENGLISH', level: 'C1 ADVANCED', pct: 'w-[90%]' },
  { name: 'GERMAN', level: 'B1 INTERMEDIATE', pct: 'w-[50%]' },
]

export const SKILLS = ['React', 'Three.js', 'WebGL', 'TypeScript', 'Tailwind CSS', 'React Three Fiber', 'GSAP', 'MikroTik', 'Design & 3D', 'Hardware', 'RF systems']
export const EXPERTISE = [
  { title: 'Interactive websites', description: 'Interfaces with motion, depth and a clear purpose.', tools: 'React · TypeScript · GSAP' },
  { title: '3D & visual work', description: 'WebGL experiences, procedural visuals and VFX.', tools: 'Three.js · React Three Fiber · Houdini' },
  { title: 'Beyond the screen', description: 'Hands-on electrical, networking and RF work.', tools: 'Electrical systems · MikroTik · Field work' },
]
export const SERVICES = ['Interactive websites and frontend applications', '3D web experiences', 'Architectural visualization', 'Logo motion and visual effects', 'Procedural digital work']
export const CERTIFICATES = [
  { title: "Bachelor's Degree in Information Technology", label: 'Jamshid Kashani University', href: 'https://jku.ac.ir/en/' },
  { title: 'Foundational C# with Microsoft', label: 'Microsoft Learn', href: 'https://www.freecodecamp.org/certification/rshiya/foundational-c-sharp-with-microsoft' },
  { title: 'Responsive Web Design', label: 'freecodecamp.org', href: 'https://www.freecodecamp.org/certification/rshiya/responsive-web-design' },
]

export const VISUAL_SECTIONS = [
  { id: 'architecture', title: 'Architectural Presentations', description: 'Spaces, atmosphere and the story of a building.' },
  { id: 'creative', title: 'Art & Motion', description: 'Creative experiments, freelance artwork and social films.' },
] as const

const workImage = (project: string, index: number, alt: string): MediaItem => ({ type: 'image', src: `/images/work/${project}/${String(index).padStart(2, '0')}-1600.webp`, alt })

export const SHOWCASES: ShowcaseCategory[] = [
  {
    id: 'web', title: 'Websites', subtitle: 'Interactive interfaces & 3D web', colorHex: '#dc2626', bgPattern: '',
    projects: [
      {
        subId: 'alphatradezone', name: 'AlphaTradeZone',
        desc: 'A pre-release fintech website and trading dashboard. The interface moves from the public landing page into an account overview, membership and settings.',
        cover: '/images/work/alphatradezone/01-1600.webp', coverAlt: 'AlphaTradeZone landing page with the Follow the signal headline and orbital graphic',
        gallery: [
          workImage('alphatradezone', 1, 'AlphaTradeZone — public landing page and membership entry'),
          workImage('alphatradezone', 2, 'AlphaTradeZone — account dashboard, performance chart and activity'),
          workImage('alphatradezone', 3, 'AlphaTradeZone — account settings and preferences'),
        ], hasLink: true, link: 'https://alphatradezonedemo.netlify.app',
      },
      {
        subId: 'abi-mobile', name: 'Abi Mobile',
        desc: 'A premium Persian ecommerce experience for mobile phones and accessories, currently available as a demo. Built with Next.js, TypeScript, and Three.js, its light interface and signature blue accents connect an interactive 3D hero with product discovery, customer accounts, and an admin panel.',
        cover: '/images/work/abi-mobile/01-1600.webp', coverAlt: 'Abi Mobile Persian storefront with a light blue 3D phone hero',
        gallery: [
          workImage('abi-mobile', 1, 'Abi Mobile — Persian storefront and interactive phone hero'),
          workImage('abi-mobile', 2, 'Abi Mobile — featured phone and product discovery'),
          workImage('abi-mobile', 3, 'Abi Mobile — customer rewards and shopping benefits'),
          workImage('abi-mobile', 4, 'Abi Mobile — accessories collection and product cards'),
        ], hasLink: true, link: 'https://abi-mobile-demo.reminiscent-comte.workers.dev/',
      },
      {
        subId: 'Architect', name: '3D Architect',
        desc: 'An immersive portfolio for an architecture practice. React, Three.js, GSAP and custom WebGL shaders combine architectural content with spatial exploration and scroll-driven animation.',
        cover: '/images/optimized/architect-1-1200.webp', coverAlt: '3D Architect portfolio showing a minimalist architectural scene',
        gallery: [
          { type: 'image', src: '/images/optimized/project2-1200.webp', alt: 'Architecture portfolio with an interactive interior scene' },
          { type: 'image', src: '/images/optimized/architect-3-1200.webp', alt: 'Architecture portfolio project panel and interior visualization' },
          { type: 'image', src: '/images/optimized/architect-4-1200.webp', alt: 'Architecture portfolio profile and technical background page' },
          { type: 'image', src: '/images/optimized/architect-5-1200.webp', alt: 'Architecture portfolio contact screen' },
        ], hasLink: true, link: 'https://r3dpixelstudio.github.io/itsaboutasal/',
      },
      {
        subId: 'vfx-webfolio', name: 'VFX Artist Webfolio',
        desc: 'A visual artist’s web portfolio with sculptural artwork, a project collection and a focused contact flow. A light editorial interface gives the visual work room to lead.',
        cover: '/images/work/vfx-webfolio/01-1600.webp', coverAlt: 'VFX Artist Webfolio landing page with Unreal by design typography and sculptural artwork',
        gallery: [
          workImage('vfx-webfolio', 1, 'VFX Artist Webfolio — sculptural landing page'),
          workImage('vfx-webfolio', 2, 'VFX Artist Webfolio — artist introduction and visual disciplines'),
          workImage('vfx-webfolio', 3, 'VFX Artist Webfolio — selected work and project collection'),
          workImage('vfx-webfolio', 4, 'VFX Artist Webfolio — project inquiry and contact form'),
        ], hasLink: true, link: 'https://vfx-artist-portfolio.pages.dev/',
      },
    ],
  },
  {
    id: 'vfx', title: 'Visuals', subtitle: 'Architectural presentations · Art & motion', colorHex: '#3b82f6', bgPattern: '',
    projects: [
      {
        subId: 'damavand-villa', name: 'Damavand Villa Entrance', visualCategory: 'architecture',
        desc: 'A fast-turnaround entrance and garden visualisation for an already-built villa in Damavand. The brief focused on the entrance view, integrating pergola-covered parking, a ramp and landscape details under a tight deadline.',
        cover: '/images/work/damavand-villa/01-1600.webp', coverAlt: 'Damavand villa entrance and garden visualisation with pergola-covered parking and landscaped access',
        gallery: [
          workImage('damavand-villa', 1, 'Damavand Villa — entrance, garden and pergola presentation'),
          workImage('damavand-villa', 2, 'Damavand Villa — elevated view of the parking and ramp approach'),
          workImage('damavand-villa', 3, 'Damavand Villa — entrance view with planting and pergola details'),
          workImage('damavand-villa', 4, 'Damavand Villa — parking, steps and garden circulation'),
          workImage('damavand-villa', 5, 'Damavand Villa — overview of the entrance landscape and parking arrangement'),
        ], hasLink: false,
      },
      {
        subId: 'jaryan', name: 'Jaryan', visualCategory: 'architecture',
        desc: 'An architectural presentation exploring a turquoise facade, a landscaped courtyard and interior spaces, from street views to retail and cafe scenes.',
        cover: '/images/work/jaryan/01-1600.webp', coverAlt: 'Jaryan architectural visualisation with a turquoise facade and landscaped entrance',
        gallery: [
          workImage('jaryan', 1, 'Jaryan — facade and entrance presentation'),
          workImage('jaryan', 2, 'Jaryan — landscaped courtyard and water feature'),
          workImage('jaryan', 3, 'Jaryan — interior atrium and turquoise architectural details'),
          workImage('jaryan', 4, 'Jaryan — street-level view of the building and public space'),
          workImage('jaryan', 5, 'Jaryan — cafe interior beneath a circular skylight'),
          workImage('jaryan', 6, 'Jaryan — retail interior and circulation'),
        ], hasLink: false,
      },
      {
        subId: 'hormozan-hospital', name: 'Hormozan Hospital', visualCategory: 'architecture',
        desc: 'An architectural presentation connecting aerial and site-plan views with daylit hospital interiors, circulation and landscape.',
        cover: '/images/work/hormozan-hospital/01-1600.webp', coverAlt: 'Aerial architectural visualisation of Hormozan Hospital and its landscaped grounds',
        gallery: [
          workImage('hormozan-hospital', 1, 'Hormozan Hospital — aerial campus presentation'),
          workImage('hormozan-hospital', 2, 'Hormozan Hospital — daylit interior and landscape sequence'),
          workImage('hormozan-hospital', 3, 'Hormozan Hospital — clinical interior and circulation'),
          workImage('hormozan-hospital', 4, 'Hormozan Hospital — site plan and building arrangement'),
          workImage('hormozan-hospital', 5, 'Hormozan Hospital — landscaped approach and glass facade'),
        ], hasLink: false,
      },
    ],
  },
  {
    id: 'kinetic', title: 'Technical work', subtitle: 'Project films & on-site installation stories', colorHex: '#f59e0b', bgPattern: '',
    projects: [
      {
        subId: 'cafe-shariati', name: 'Café Shariati',
        desc: 'On-site technical work at a café on Shariati Street. This project film follows the space from installation in progress to the finished café.',
        cover: '/images/work/cafe-shariati/cover-1280.webp', coverAlt: 'Finished café on Shariati Street with a leafy ceiling, warm lighting and seating',
        gallery: [{ type: 'video', src: '/media/3048abfa-5d10-4cc6-b61d-c3fd0e361f45.mp4', alt: 'Café Shariati — on-site installation and finished café project film', poster: '/images/work/cafe-shariati/cover-1280.webp' }],
        hasLink: false,
      },
    ],
  },
]

export const CONTACT_LINKS = [
  { label: 'EMAIL', mark: '@', markClassName: 'text-[13px]', action: 'START A PROJECT', detail: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false, ariaLabel: `Start a project: email REDDPIXEL at ${PROFILE.email}.` },
  { label: 'LINKEDIN', mark: 'in', markClassName: 'text-[11px] font-black', action: 'CONNECT', detail: 'Professional profile', href: PROFILE.linkedin, external: true, ariaLabel: 'Connect on LinkedIn. Opens in a new tab.' },
  { label: 'TELEGRAM', mark: '➤', markClassName: '-rotate-[18deg] text-[13px]', action: 'MESSAGE', detail: '@ReddPixel', href: PROFILE.telegram, external: true, ariaLabel: 'Message REDDPIXEL on Telegram. Opens in a new tab.' },
  ...(PROFILE.instagram ? [{ label: 'INSTAGRAM', mark: '↗', markClassName: '', action: 'FOLLOW', detail: `@${PROFILE.mediaIdentity}`, href: PROFILE.instagram, external: true, ariaLabel: 'Superintelliget on Instagram. Opens in a new tab.' }] : []),
  ...(PROFILE.youtube ? [{ label: 'YOUTUBE', mark: '▶', markClassName: '', action: 'WATCH', detail: 'YouTube', href: PROFILE.youtube, external: true, ariaLabel: 'YouTube channel. Opens in a new tab.' }] : []),
]

export const SEO = {
  url: 'https://reddpixel.com/',
  title: 'REDDPIXEL — Creative Developer & 3D Web Experiences',
  description: "REDDPIXEL's portfolio of interactive websites, Three.js/WebGL experiences, 3D visualization and visual digital work. Discuss remote projects worldwide.",
  image: 'https://reddpixel.com/images/social-preview.jpg',
  imageAlt: 'Procedural 3D artwork from the REDDPIXEL portfolio',
}

export const ORACLE_DATA = {
  person: PROFILE,
  skills: SKILLS,
  services: SERVICES,
  experience: EXPERIENCES,
  languages: LANGUAGES.map(({ name, level }) => ({ language: name, level })),
  credentials: CERTIFICATES,
  projects: SHOWCASES.flatMap((category) => category.projects.map(({ name, desc, link }) => ({ name, description: desc, ...(link ? { link } : {}) }))),
  contact: { email: PROFILE.email, linkedin: PROFILE.linkedin, telegram: PROFILE.telegram, instagram: PROFILE.instagram, youtube: PROFILE.youtube },
  pricing: PROFILE.pricing,
}
