// Public claims come from the existing visible portfolio. See docs/CONTENT-AUDIT.md
// for unresolved differences; these are repository-backed claims, not independent verification.
export interface MediaItem {
  type: 'image' | 'video'
  src: string
  alt: string
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
}

export interface ShowcaseCategory {
  id: string
  title: string
  subtitle: string
  colorHex: string
  bgPattern: string
  projects: Project[]
}

export const PROFILE = {
  brand: 'REDDPIXEL',
  name: 'Arash Mohammadi',
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
  pricing: 'Pricing depends on scope. Contact Arash to discuss requirements, schedule and deliverables.',
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

export const SHOWCASES: ShowcaseCategory[] = [
  {
    id: 'web', title: 'Websites', subtitle: 'Interactive interfaces & 3D web', colorHex: '#dc2626', bgPattern: '',
    projects: [
      {
        subId: 'alphatradezone', name: 'AlphaTradeZone',
        desc: 'A React and Tailwind frontend SPA for a trading-themed website. Reusable components, state management and data-visualization interfaces shape the experience.',
        cover: '/images/optimized/project1-1200.webp', coverAlt: 'AlphaTradeZone landing page with trading chart graphics',
        gallery: [
          { type: 'image', src: '/images/optimized/project1-1200.webp', alt: 'AlphaTradeZone website landing page' },
          { type: 'image', src: '/images/optimized/atz-vfx-1200.webp', alt: 'AlphaTradeZone membership graphics and visual content montage' },
        ], hasLink: true, link: 'https://rshiya.github.io/atz-land/',
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
    ],
  },
  {
    id: 'vfx', title: 'Visuals', subtitle: 'Procedural experiments, motion & VFX', colorHex: '#3b82f6', bgPattern: '',
    projects: [
      {
        subId: 'indiegame', name: 'Indie Protocol',
        desc: 'A personal puzzle-game project in Unity and Houdini, with core mechanics built. Procedural generation, render-loop control and draw-call optimization are central to the work.',
        cover: '/images/optimized/vfx-1-1200.webp', coverAlt: 'Procedural 3D illustration displayed with Indie Protocol',
        gallery: [
          { type: 'image', src: '/images/optimized/artboard2-1200.webp', alt: 'Digital design and website montage displayed with Indie Protocol' },
          { type: 'image', src: '/images/optimized/project3-1200.webp', alt: 'Technical and creative capability illustration displayed with Indie Protocol' },
        ], hasLink: false,
      },
      {
        subId: 'logomotion', name: 'Freelance VFX',
        desc: 'Visual content spanning logo motion, architectural renders and particle systems. Baked effects support real-time web presentation alongside video work.',
        cover: '/images/optimized/vfx-2-1200.webp', coverAlt: 'Colorful procedural 3D artwork for visual effects work',
        gallery: [
          { type: 'image', src: '/images/optimized/artboard2-1200.webp', alt: 'Brand, website and architectural visualization montage' },
          { type: 'image', src: '/images/optimized/atz-vfx-1200.webp', alt: 'Logo and promotional visual content for AlphaTradeZone' },
        ], hasLink: false,
      },
    ],
  },
  {
    id: 'kinetic', title: 'Technical work', subtitle: 'On-site installations & physical systems', colorHex: '#f59e0b', bgPattern: '',
    projects: [
      {
        subId: 'networking', name: 'Network & RF Towers',
        desc: 'Hands-on technical background in passive networks, structured cabling and MikroTik RouterOS equipment. Field work includes hardware troubleshooting on radio towers.',
        cover: '/images/optimized/hva-1-1200.webp', coverAlt: 'Network and RF themed 3D illustration',
        gallery: [
          { type: 'image', src: '/images/optimized/infrastructure-3-1200.webp', alt: 'On-site building cabling and installation work' },
          { type: 'image', src: '/images/optimized/infrastructure-4-1200.webp', alt: 'Building interior during infrastructure installation' },
        ], hasLink: false,
      },
      {
        subId: 'electrical', name: 'Electrical Systems',
        desc: 'Commercial and residential electrical installation work, including wire routing, circuit-load management and system setup. Physical problem-solving complements the digital practice.',
        cover: '/images/optimized/hva-2-1200.webp', coverAlt: 'Electrical systems themed 3D illustration',
        gallery: [
          { type: 'image', src: '/images/optimized/el1-1200.webp', alt: 'Electrical control panels and wire routing' },
          { type: 'image', src: '/images/optimized/infrastructure-7-1200.webp', alt: 'Building installation work in progress' },
        ], hasLink: false,
      },
    ],
  },
]

export const CONTACT_LINKS = [
  { label: 'EMAIL', mark: '@', markClassName: 'text-[13px]', action: 'START A PROJECT', detail: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false, ariaLabel: `Start a project: email Arash at ${PROFILE.email}.` },
  { label: 'LINKEDIN', mark: 'in', markClassName: 'text-[11px] font-black', action: 'CONNECT', detail: PROFILE.name, href: PROFILE.linkedin, external: true, ariaLabel: 'Connect with Arash on LinkedIn. Opens in a new tab.' },
  { label: 'TELEGRAM', mark: '➤', markClassName: '-rotate-[18deg] text-[13px]', action: 'MESSAGE', detail: '@ReddPixel', href: PROFILE.telegram, external: true, ariaLabel: 'Message Arash on Telegram. Opens in a new tab.' },
  ...(PROFILE.instagram ? [{ label: 'INSTAGRAM', mark: '↗', markClassName: '', action: 'FOLLOW', detail: `@${PROFILE.mediaIdentity}`, href: PROFILE.instagram, external: true, ariaLabel: 'Superintelliget on Instagram. Opens in a new tab.' }] : []),
  ...(PROFILE.youtube ? [{ label: 'YOUTUBE', mark: '▶', markClassName: '', action: 'WATCH', detail: 'YouTube', href: PROFILE.youtube, external: true, ariaLabel: 'YouTube channel. Opens in a new tab.' }] : []),
]

export const SEO = {
  url: 'https://reddpixel.com/',
  title: 'REDDPIXEL — Creative Developer & 3D Web Experiences',
  description: "Arash Mohammadi's portfolio of interactive websites, Three.js/WebGL experiences, 3D visualization and visual digital work. Discuss remote projects worldwide.",
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
