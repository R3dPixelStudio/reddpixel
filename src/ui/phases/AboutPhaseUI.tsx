import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'

const ABOUT_STATEMENT = 'I BUILD DIGITAL AND PHYSICAL SYSTEMS'


const EXPERIENCES = [
  { title: 'Freelancer', duration: '5 YRS', role: 'React / WebGL / 3D / E-commerce' },
  { title: 'Network Technician', duration: '1 YRS', role: 'MikroTik / RF / Passive' },
  { title: 'Electrical Tech', duration: '1 YRS', role: 'Commercial / Residential' },
]

const LANGUAGES = [
  { name: 'PERSIAN', level: 'NATIVE', pct: 'w-full' },
  { name: 'ENGLISH', level: 'C1 ADVANCED', pct: 'w-[90%]' },
  { name: 'GERMAN', level: 'B1 INTERMEDIATE', pct: 'w-[50%]' },
]

const SKILLS = ['REACT', 'THREE.JS' , 'WEBGL', 'TYPESCRIPT', 'TAILWIND', 'MIKROTIK', 'DESIGN & 3D', 'HARDWARE', 'RF SYSTEMS']

const CERTIFICATES = [
  {
    title: "Bachelor's Degree in Information Technology",
    label: 'Jamshid Kashani University',
    href: `https://jku.ac.ir/en/ `,
  },
  {
    title: 'Foundational C# with Microsoft',
    label: 'Microsoft Learn',
    href: `https://www.freecodecamp.org/certification/rshiya/foundational-c-sharp-with-microsoft`,
  },
  {
    title: "Responsive Web Design",
    label: 'freecodecamp.org',
    href: `https://www.freecodecamp.org/certification/rshiya/responsive-web-design`,
  },
]

const PersianNode = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 bg-red-600 shadow-[0_0_20px_#dc2626]" />
  </div>
)

const CertificateLinks = ({ compact = false }: { compact?: boolean }) => {
  if (compact) {
    return (
      <div className="about-mobile-certificates grid w-full gap-1.5">
        {CERTIFICATES.map((certificate, index) => (
          <a
            key={certificate.title}
            href={certificate.href}
            aria-label={`Request a copy of ${certificate.title}`}
            className="about-mobile-certificate group/certificate pointer-events-auto relative isolate flex min-h-12 min-w-0 items-center gap-2 overflow-hidden bg-[#090101]/85 px-2 py-1.5 text-left shadow-[0_8px_22px_rgba(0,0,0,0.42)] transition-[transform,filter] duration-200 active:scale-[0.98] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            <span className="absolute inset-[3px] -z-10 border border-red-900/55 transition-colors duration-200 group-hover/certificate:border-red-500/70 group-focus-visible/certificate:border-red-500/70" />
            <span
              aria-hidden="true"
              className="relative flex h-5 w-5 shrink-0 rotate-45 items-center justify-center border border-red-500/75 bg-red-950/85 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            >
              <span className="-rotate-45 text-[7px] font-bold tracking-normal text-red-100">
                {String(index + 1).padStart(2, '0')}
              </span>
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[9px] leading-tight font-bold tracking-[0.1em] text-red-100">
                {certificate.title}
              </span>
              
            </span>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="flex max-w-[90%] flex-wrap gap-2">
      {CERTIFICATES.map((certificate) => (
        <a
          key={certificate.title}
          href={certificate.href}
          aria-label={`Request a copy of ${certificate.title}`}
          className="group/certificate pointer-events-auto relative flex min-w-44 items-center gap-3 overflow-hidden border border-red-900/60 bg-[#050000]/75 px-3 py-2 text-left shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-colors duration-300 hover:border-red-500/80 focus-visible:border-red-400 focus-visible:outline-none"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-red-950/60 transition-transform duration-300 group-hover/certificate:scale-x-100 group-focus-visible/certificate:scale-x-100" />
          <span
            aria-hidden="true"
            className="relative z-10 h-3 w-3 shrink-0 rotate-45 border border-red-500/70 bg-red-950/80 shadow-[0_0_8px_rgba(239,68,68,0.35)]"
          />
          <span className="relative z-10 min-w-0 flex-1">
            <span className="block truncate text-[9px] font-bold tracking-[0.16em] text-red-100">
              {certificate.title}
            </span>
            <span className="mt-0.5 block text-[7px] tracking-[0.14em] text-red-500/70">{certificate.label}</span>
          </span>
          <span
            aria-hidden="true"
            className="relative z-10 shrink-0 text-xs text-red-500 transition-transform duration-300 group-hover/certificate:translate-x-0.5"
          >
            &#8599;
          </span>
        </a>
      ))}
    </div>
  )
}

const AboutPhaseUI: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const isExplore = mode === MODES.EXPLORE && currentPhase === 1
  const containerRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useGSAP(
    () => {
      gsap.set(containerRef.current, { autoAlpha: 0 })

      tl.current = gsap
        .timeline({ paused: true })
        .to(containerRef.current, { autoAlpha: 1, duration: 0.1 })
        .fromTo(
          ['.desk-node', '.mob-node'],
          { scale: 0, rotation: -45 },
          { scale: 1, rotation: 45, duration: 0.8, ease: 'back.out(1.5)' },
        )
        .fromTo(
          ['.desk-line', '.mob-line'],
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.6, ease: 'expo.inOut' },
          '-=0.5',
        )
        .fromTo(
          '.desk-top',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
          '-=0.3',
        )
        .fromTo(
          '.mob-top',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
          '<',
        )
        .fromTo(
          '.desk-bot',
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
          '-=0.4',
        )
        .fromTo(
          '.mob-bot',
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' },
          '<',
        )
    },
    { scope: containerRef },
  )

  useGSAP(
    () => {
      if (!tl.current) return

      if (isExplore) {
        tl.current.timeScale(1).play()
      } else if (tl.current.progress() > 0) {
        tl.current.timeScale(2.5).reverse()
      }
    },
    { scope: containerRef, dependencies: [isExplore] },
  )

  return (
    <div
      ref={containerRef}
      aria-hidden={!isExplore}
      inert={!isExplore}
      className="invisible fixed inset-0 z-40 overflow-hidden opacity-0 pointer-events-none"
    >
      <div className="absolute inset-0 mx-auto hidden max-w-[1400px] items-center justify-center md:flex">
        <div className="relative flex h-full w-1/2 items-center justify-end">
          <div className="absolute right-0 z-10 flex translate-x-1/2 items-center justify-center">
            <div className="desk-node flex items-center justify-center">
              <PersianNode className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="relative flex h-full w-1/2 flex-col justify-center pr-[10%] pl-10">
          <div className="desk-line absolute top-1/2 left-0 z-0 h-px w-[120%] -translate-y-1/2 bg-gradient-to-r from-red-500 to-transparent opacity-60" />

          <div className="about-desktop-top absolute bottom-1/2 left-10 flex w-full flex-col justify-end">
            <div className="mb-2 flex items-center gap-6">
              <div className="desk-top relative h-28 w-28 rotate-45 border border-red-500/50 p-1 shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <img
                  src="/images/profile.png"
                  alt="Arash Mohammadi"
                  loading="lazy"
                  className="h-full w-full -rotate-45 object-cover opacity-80 mix-blend-luminosity"
                />
              </div>
              <div className="desk-top">
                <h2 className="text-2xl font-light tracking-[0.2em] text-red-100">ENGINEER &amp; DEVELOPER</h2>
                <p className="mt-1 text-[10px] tracking-widest text-red-500/80 uppercase">
                  Bridging Digital Code &amp; Physical Infrastructure
                </p>
              </div>
            </div>

            <p className="desk-top mb-4 max-w-[90%] text-xl leading-tight font-light tracking-[0.16em] text-red-100/90 drop-shadow-md lg:text-2xl">
              {ABOUT_STATEMENT}
            </p>

            <div className="desk-top mb-3 flex max-w-[90%] flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <span
                  key={skill}
                  className="border border-red-900/50 bg-[#050000]/60 px-2 py-1 text-[10px] font-bold tracking-widest text-red-400 shadow-lg backdrop-blur-sm"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="desk-top mb-4">
              <CertificateLinks />
            </div>
          </div>

          <div className="absolute top-1/2 left-10 flex w-full items-start justify-start gap-12 pt-8">
            <div className="flex-1">
              <div className="desk-bot space-y-5 border-l border-red-900/50 pl-5">
                {EXPERIENCES.map((experience, index) => (
                  <div key={experience.title} className="relative">
                    <div
                      className={`absolute top-1 -left-[23px] h-2 w-2 rotate-45 ${
                        index === 0 ? 'bg-red-600 shadow-[0_0_8px_#dc2626]' : 'border border-red-500'
                      }`}
                    />
                    <h3 className="text-sm tracking-wider text-red-100 uppercase drop-shadow-md">{experience.title}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[10px] tracking-widest text-red-500/70">{experience.duration}</p>
                      <span className="text-[10px] text-red-800/50">|</span>
                      <p className="text-[10px] tracking-widest text-red-400/60">{experience.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-[200px] flex-1 space-y-4">
              {LANGUAGES.map((language) => (
                <div key={language.name} className="desk-bot">
                  <div className="mb-1 flex justify-between text-[10px] tracking-widest text-red-400 drop-shadow-md">
                    <span>{language.name}</span>
                    <span>{language.level}</span>
                  </div>
                  <div className="h-px w-full bg-red-900/30">
                    <div className={`${language.pct} h-full bg-red-500 shadow-[0_0_8px_#ef4444]`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="about-mobile-panel absolute z-10 md:hidden">
        <div className="about-mobile-grid relative h-full w-full">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="about-mobile-node-anchor absolute left-0 z-10 flex h-4 w-4 items-center justify-center">
              <div className="mob-node relative flex h-full w-full items-center justify-center">
                <PersianNode className="h-4 w-4" />
              </div>
            </div>
            <div className="mob-line about-mobile-main-line absolute left-2 z-0 h-px bg-gradient-to-r from-red-500 to-transparent opacity-60" />
          </div>

          <div className="about-mobile-profile mob-top relative z-10 h-25 w-25 rotate-45 border border-red-500/70 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.55)]">
            <img
              src="/images/profile.png"
              alt="profile photo"
              loading="lazy"
              className="h-full w-full -rotate-45 object-cover opacity-85 mix-blend-luminosity"
            />
          </div>

          <div aria-hidden="true" className="about-mobile-labels pointer-events-none absolute inset-0 z-10">
            {/* <span className="mob-top about-mobile-index about-mobile-index-skills">SKILLS</span>
            <span className="mob-top about-mobile-index about-mobile-index-certificates">CERTIFICATES</span>
            <span className="mob-bot about-mobile-index about-mobile-index-experience">WORK EXPERIENCE</span> */}
          </div>

          <div className="about-mobile-content about-mobile-scroll pointer-events-auto relative z-10 min-h-0 touch-pan-y overflow-y-auto overscroll-contain text-left">
            <header className="mob-top min-w-0">
              <h2 className="text-[10px] leading-tight font-bold tracking-[0.18em] text-red-100 drop-shadow-lg">
                SYSTEMS ARCHITECT
              </h2>
              <p className="mt-1 text-[8px] tracking-[0.13em] text-red-500/90 uppercase">
                Frontend Dev &amp; Field Tech
              </p>
              <p className="about-mobile-statement mt-2 max-w-[32rem] text-[clamp(1.05rem,5vw,1.45rem)] leading-[1.02] font-light tracking-[0.09em] text-red-100/95 drop-shadow-md">
                {ABOUT_STATEMENT}
              </p>
            </header>

            <section aria-labelledby="about-mobile-skills-title" className="about-mobile-section mob-top min-w-0">
              <h3 id="about-mobile-skills-title" className="sr-only">
                Skills
              </h3>
              <div className="flex flex-wrap justify-start gap-1">
                {SKILLS.map((skill) => (
                  <span
                    key={skill}
                    className="border border-red-900/55 bg-[#050000]/72 px-1.5 py-1 text-[8px] leading-none font-bold tracking-[0.08em] text-red-400 shadow-[0_4px_12px_rgba(0,0,0,0.28)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section aria-labelledby="about-mobile-certificates-title" className="about-mobile-section mob-top min-w-0">
              <h3 id="about-mobile-certificates-title" className="sr-only">
                Certificates
              </h3>
              <CertificateLinks compact />
            </section>

            <section aria-labelledby="about-mobile-experience-title" className="about-mobile-section mob-bot min-w-0">
              <h3 id="about-mobile-experience-title" className="sr-only">
                Work experience
              </h3>
              <div className="about-mobile-experience-list space-y-2">
                {EXPERIENCES.map((experience, index) => (
                  <article
                    key={experience.title}
                    className="relative min-w-0 border-l border-red-900/60 bg-gradient-to-r from-[#100202]/65 to-transparent py-1 pr-1 pl-2.5"
                  >
                    <div
                      className={`absolute top-1.5 -left-[3px] h-1.5 w-1.5 rotate-45 ${
                        index === 0 ? 'bg-red-600 shadow-[0_0_5px_#dc2626]' : 'border border-red-500'
                      }`}
                    />
                    <h4 className="text-[8px] leading-tight font-bold tracking-[0.08em] text-red-100 uppercase drop-shadow-md">
                      {experience.title}
                    </h4>
                    <p className="mt-0.5 text-[7px] leading-tight tracking-[0.04em] text-red-400/70">
                      {experience.duration} <span className="text-red-900/80">|</span> {experience.role}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="about-mobile-languages-title" className="about-mobile-section about-mobile-languages mob-bot min-w-0">
              <h3
                id="about-mobile-languages-title"
                className="mb-2 text-[8px] font-bold tracking-[0.18em] text-red-300"
              >
                LANGUAGES
              </h3>
              <div className="space-y-2">
                {LANGUAGES.map((language) => (
                  <div key={language.name}>
                    <div className="mb-1 flex justify-between gap-1 text-[8px] leading-none tracking-[0.08em] text-red-400 drop-shadow-md">
                      <span>{language.name}</span>
                      <span className="text-right text-red-300/70">{language.level}</span>
                    </div>
                    <div className="flex h-px w-full justify-start bg-red-900/35">
                      <div className={`${language.pct} h-full bg-red-500 shadow-[0_0_5px_#ef4444]`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPhaseUI
