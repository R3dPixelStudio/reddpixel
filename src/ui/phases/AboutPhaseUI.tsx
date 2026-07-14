import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'

const EXPERIENCES = [
  { title: "Frontend Developer", duration: "3 YRS", role: "React / WebGL / 3D" },
  { title: "Network Technician", duration: "2 YRS", role: "MikroTik / RF / Passive" },
  { title: "Electrical Tech", duration: "2 YRS", role: "Commercial / Residential" }
]

const LANGUAGES = [
  { name: "PERSIAN", level: "NATIVE", pct: "w-[100%]" },
  { name: "ENGLISH", level: "C1 ADVANCED", pct: "w-[90%]" },
  { name: "GERMAN", level: "B1 INTERMEDIATE", pct: "w-[60%]" }
]

const SKILLS = ['REACT', 'THREE.JS', 'TYPESCRIPT', 'TAILWIND', 'MIKROTIK', 'HARDWARE', 'RF SYSTEMS']

const PersianNode = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 bg-red-600 shadow-[0_0_20px_#dc2626]" />
  </div>
)

const AboutPhaseUI: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const isExplore = mode === MODES.EXPLORE && currentPhase === 1
  const containerRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useGSAP(() => {
    gsap.set(containerRef.current, { autoAlpha: 0 })

    tl.current = gsap.timeline({ paused: true })
      .to(containerRef.current, { autoAlpha: 1, duration: 0.1 })
      .fromTo(['.desk-node', '.mob-node'], 
         { scale: 0, rotation: -45 }, 
         { scale: 1, rotation: 45, duration: 0.8, ease: 'back.out(1.5)' }
      )
      .fromTo(['.desk-line', '.mob-line'], 
         { scaleX: 0, transformOrigin: 'left center' }, 
         { scaleX: 1, duration: 0.6, ease: 'expo.inOut' }, 
         "-=0.5"
      )
      .fromTo('.mob-line-v', 
         { scaleY: 0, transformOrigin: 'top center' }, 
         { scaleY: 1, duration: 0.6, ease: 'expo.inOut' }, 
         "<"
      )
      .fromTo('.desk-top', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, "-=0.3")
      .fromTo('.mob-top', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, "<")
      .fromTo('.desk-bot', { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, "-=0.4")
      .fromTo('.mob-bot', { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, "<")
      
  }, { scope: containerRef }) 

  useGSAP(() => {
    if (!tl.current) return;
    if (isExplore) {
       tl.current.timeScale(1).play();
    } else {
       if (tl.current.progress() > 0) {
          tl.current.timeScale(2.5).reverse();
       }
    }
  }, { scope: containerRef, dependencies: [isExplore] }) 

  return (
    <div ref={containerRef} className="invisible opacity-0 fixed inset-0 z-40 pointer-events-none overflow-hidden">
      
      {/* --- DESKTOP LAYOUT --- */}
      <div className="absolute inset-0 items-center justify-center max-w-[1400px] mx-auto hidden md:flex">
          <div className="w-1/2 flex justify-end items-center relative h-full">
             <div className="absolute right-0 translate-x-1/2 z-10 flex items-center justify-center">
                 <div className="desk-node flex items-center justify-center">
                    <PersianNode className="w-6 h-6" />
                 </div>
             </div>
          </div>

          <div className="w-1/2 h-full relative flex flex-col justify-center pl-10 pr-[10%]">
             <div className="desk-line absolute left-0 top-1/2 -translate-y-1/2 w-[120%] h-[1px] bg-gradient-to-r from-red-500 to-transparent opacity-60 z-0" />

             {/* Top Half */}
             <div className="absolute bottom-1/2 left-10 w-full flex flex-col justify-end ">
                <div className="flex items-center gap-6 mb-2">
                   <div className="desk-top relative w-28 h-28 border border-red-500/50 p-1 rotate-45 shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                       <img src="/images/profile.png" alt="Profile" loading="lazy" className="w-full h-full object-cover -rotate-45 opacity-80 mix-blend-luminosity" />
                   </div>
                   <div className="desk-top">
                       <h2 className="text-2xl font-light tracking-[0.2em] text-red-100">ENGINEER & DEVELOPER</h2>
                       <p className="text-[10px] text-red-500/80 tracking-widest uppercase mt-1">Bridging Digital Code & Physical Infrastructure</p>
                   </div>
                </div>
                {/* Desktop Paragraph */}
                <p className="desk-top text-xs tracking-wide text-red-100/70 leading-relaxed font-light max-w-[90%] mb-4 drop-shadow-md">
                   With a Bachelor's in IT, I operate at the intersection of software and hardware. I build high-performance, spatial web applications using React and Three.js, crafting custom WebGL shaders for immersive digital experiences. Beyond the screen, I am a hands-on field technician—deploying MikroTik passive network infrastructure, executing commercial electrical installations, and performing hardware troubleshooting directly on radio towers. I adapt instantly to complex systems, whether in the DOM or in the field. Open to relocation.
                </p>
                <div className="desk-top flex flex-wrap gap-2 max-w-[90%] mb-4 ">
                  {SKILLS.map(skill => (
                      <span key={skill} className="border border-red-900/50 px-2 py-1 bg-[#050000]/60 backdrop-blur-sm text-[10px] text-red-400 font-bold tracking-widest shadow-lg">{skill}</span>
                  ))}
                </div>
             </div>

             {/* Bottom Half */}
             <div className="absolute top-1/2 left-10 w-full flex justify-start items-start pt-8 gap-12">
                <div className="flex-1">
                  <div className="desk-bot border-l border-red-900/50 pl-5 space-y-5">
                    {EXPERIENCES.map((exp, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[23px] top-1 w-2 h-2 rotate-45 ${i === 0 ? 'bg-red-600 shadow-[0_0_8px_#dc2626]' : 'border border-red-500'}`} />
                        <h4 className="text-sm tracking-wider text-red-100 uppercase drop-shadow-md">{exp.title}</h4>
                        <div className="flex gap-2 mt-1 items-center">
                          <p className="text-[10px] text-red-500/70 tracking-widest">{exp.duration}</p>
                          <span className="text-[10px] text-red-800/50">|</span>
                          <p className="text-[10px] text-red-400/60 tracking-widest">{exp.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-4 max-w-[200px]">
                  {LANGUAGES.map(lang => (
                    <div key={lang.name} className="desk-bot">
                      <div className="flex justify-between text-[10px] text-red-400 mb-1 tracking-widest drop-shadow-md"><span>{lang.name}</span><span>{lang.level}</span></div>
                      <div className="w-full h-[1px] bg-red-900/30"><div className={`${lang.pct} h-full bg-red-500 shadow-[0_0_8px_#ef4444]`} /></div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      {/* FIX: Widened mobile container so text doesn't squish */}
      <div className="absolute top-[8%] left-[5%] w-[90vw] max-w-[340px] flex-col items-start z-10 flex md:hidden">
            
            <div className="relative flex items-center justify-start w-full mb-6">
              <div className="z-10 relative flex items-center justify-center w-4 h-4">
                  <div className="mob-node relative w-full h-full flex items-center justify-center">
                     <PersianNode className="w-4 h-4" />
                  </div>
              </div>
              <div className="mob-line absolute left-[8px] top-1/2 w-[100vw] h-[1px] bg-gradient-to-r from-red-500 to-transparent z-0 opacity-60" />
              <div className="mob-line-v absolute left-[7px] top-[8px] w-[1px] h-[75vh] bg-gradient-to-b from-red-500 to-transparent z-0 opacity-60" />
            </div>

            <div className="flex flex-col items-start text-left w-full pl-6 pt-2">
                
                <div className="flex justify-start items-center gap-4 pl-1 mb-4">
                   <div className="mob-top relative w-16 h-16 border border-red-500/70 p-1 rotate-45">
                       <img src="/images/profile.png" alt="Profile" loading="lazy" className="w-full h-full object-cover -rotate-45 opacity-80 mix-blend-luminosity" />
                   </div>
                   <div className="mob-top ml-2">
                       <h2 className="text-[12px] font-bold tracking-[0.2em] text-red-100 drop-shadow-lg">SYSTEMS ARCHITECT</h2>
                       <p className="text-[7px] text-red-500/90 tracking-widest mt-1 uppercase">Frontend Dev & Field Tech</p>
                   </div>
                </div>

                {/* Mobile Paragraph: Much tighter, highly legible */}
                <p className="mob-top text-[9.5px] tracking-wide text-red-100/80 leading-normal font-light mb-5 drop-shadow-md">
                   I bridge digital code and physical infrastructure. With a Bachelor's in IT, I build high-performance React/WebGL web apps, and I deploy robust physical networks. My experience spans from writing 3D shaders to climbing radio towers, configuring MikroTik routers, and executing commercial electrical installations. I adapt quickly, solve complex technical problems, and am open to relocation.
                </p>

                <div className="mob-top flex flex-wrap gap-1.5 justify-start mb-5">
                  {SKILLS.map(skill => (
                      <span key={skill} className="border border-red-900/50 px-1.5 py-0.5 bg-[#050000]/60 text-[7px] text-red-400 font-bold tracking-widest">{skill}</span>
                  ))}
                </div>

                <div className="flex flex-col gap-5 w-full items-start">
                  <div className="mob-bot border-l border-red-900/50 pl-4 space-y-4 text-left">
                    {EXPERIENCES.map((exp, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[19px] top-1 w-1.5 h-1.5 rotate-45 ${i === 0 ? 'bg-red-600 shadow-[0_0_5px_#dc2626]' : 'border border-red-500'}`} />
                        <h4 className="text-[9px] tracking-wider text-red-100 drop-shadow-md uppercase">{exp.title}</h4>
                        <p className="text-[7px] text-red-500/80 tracking-widest mt-0.5">{exp.duration} | {exp.role}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mob-bot space-y-3 w-[80%] mt-2">
                    {LANGUAGES.map(lang => (
                      <div key={lang.name}>
                        <div className="flex justify-between text-[7px] text-red-400 mb-1 tracking-widest drop-shadow-md"><span>{lang.name}</span><span>{lang.level}</span></div>
                        <div className="w-full h-[1px] bg-red-900/30 flex justify-start"><div className={`${lang.pct} h-full bg-red-500 shadow-[0_0_5px_#ef4444]`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
      </div>
      
    </div>
  )
}

export default AboutPhaseUI