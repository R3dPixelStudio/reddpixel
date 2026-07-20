import React, { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'

type MediaType = 'image' | 'video';

interface MediaItem {
  type: MediaType;
  src: string;
}

interface Project {
  subId: string;
  name: string;
  desc: string;
  cover: string;
  gallery: MediaItem[]; 
  hasLink: boolean;
  link?: string;
}

interface ShowcaseCategory {
  id: string;
  title: string;
  subtitle: string;
  colorHex: string;
  bgPattern: string;
  projects: Project[];
}

const SHOWCASES: ShowcaseCategory[] = [
  {
    id: 'web',
    title: "DIGITAL REALMS",
    subtitle: "Frontend & Web Architecture",
    colorHex: "#dc2626",
    bgPattern: "",
    projects: [
      {
        subId: 'alphatradezone',
        name: "AlphaTradeZone",
        desc: "A frontend SPA built with React and Tailwind. Engineered for scalable component architecture, exploring state management and zero-latency data visualization interfaces.",
        cover: "/images/project1.jpg",
        gallery: [
          { type: 'image', src: "/images/project1.jpg" },
          { type: 'image', src: "/images/vfx/atz-vfx.jpg" }
        ],
        hasLink: true,
        link: "https://rshiya.github.io/atz-land/" 
      },
      {
        subId: 'Architect',
        name: "3D Architect",
        desc: "Immersive 3D portfolio for an architecture practice. Built with React, Three.js, GSAP for scroll-driven animations, and custom WebGL shaders to replace traditional scrolling with spatial exploration.",
        cover: "/images/3Darchitect/1.jpg", 
        gallery: [
          { type: 'image', src: "/images/project2.jpg" },
          { type: 'image', src: "/images/3Darchitect/3.jpg" },
          { type: 'image', src: "/images/3Darchitect/4.jpg" },
          { type: 'image', src: "/images/3Darchitect/5.jpg" }
        ],
        hasLink: true,
        link: "https://r3dpixelstudio.github.io/itsaboutasal/"
      }
    ]
  },
  {
    id: 'vfx',
    title: "VISUAL ALCHEMY",
    subtitle: "VFX & Procedural Generation",
    colorHex: "#3b82f6", 
    bgPattern: "", 
    projects: [
      {
        subId: 'indiegame',
        name: "Indie Protocol",
        desc: "Personal puzzle game project built in Unity and Houdini. Focuses on procedural generation, tight render loops, and optimized draw calls. Core mechanics already built.",
        cover: "/images/vfx/vfx-1.jpg", 
        gallery: [
          { type: 'image', src: "/images/vfx/Artboard2.jpg" },
          { type: 'image', src: "/images/project3.jpg" }
        ],
        hasLink: false
      },
      {
        subId: 'logomotion',
        name: "Freelance VFX",
        desc: "Digital content creation encompassing logomotion, architectural renders, and particle systems baked down for real-time web deployment and video presentation.",
        cover: "/images/vfx/vfx-2.jpg",
        gallery: [
          { type: 'image', src: "/images/vfx/Artboard2.jpg" },
          { type: 'image', src: "/images/vfx/atz-vfx.jpg" }
        ],
        hasLink: false
      }
    ]
  },
  {
    id: 'kinetic',
    title: "INFRASTRUCTURE",
    subtitle: "Field & Hardware Engineering",
    colorHex: "#f59e0b", 
    bgPattern: "", 
    projects: [
      {
        subId: 'networking',
        name: "Network & RF Towers",
        desc: "Deployment of passive network infrastructure and structured cabling. Hands-on configuration of MikroTik RouterOS equipment (routers, switches, dishes), including physical hardware troubleshooting directly on radio towers.",
        cover: "/images/highVoltage and altitude/webp/hva-1.webp",
        gallery: [
          { type: 'image', src: "/images/highVoltage and altitude/webp/3.webp" },
          { type: 'image', src: "/images/highVoltage and altitude/webp/4.webp" }
        ],
        hasLink: false
      },
      {
        subId: 'electrical',
        name: "Electrical Systems",
        desc: "Executed complex commercial and residential electrical installations. Focused on physical wire routing, circuit load management, and high-voltage system setup across luxury villas and commercial buildings.",
        cover: "/images/highVoltage and altitude/webp/hva-2.webp",
        gallery: [
          { type: 'image', src: "/images/highVoltage and altitude/webp/el1.webp" },
          { type: 'image', src: "/images/highVoltage and altitude/webp/7.webp" }
        ],
        hasLink: false
      }
    ]
  }
]

const PersianNode = ({ colorHex, isActive }: { colorHex: string, isActive: boolean }) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)

  useGSAP(() => {
    animationRef.current?.kill()

    if (isActive) {
      animationRef.current = gsap.to(nodeRef.current, {
        rotation: '+=360',
        duration: 6,
        repeat: -1,
        ease: 'none',
        overwrite: 'auto',
      })
    } else {
      animationRef.current = gsap.to(nodeRef.current, {
        rotation: 0,
        duration: 1,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
  }, { dependencies: [isActive] })

  return (
    <div ref={nodeRef} className="relative flex items-center justify-center w-5 h-5 z-20 flex-shrink-0 pointer-events-none">
      <div className="absolute inset-0 border transition-all duration-500" style={{ borderColor: colorHex, boxShadow: isActive ? `0 0 15px ${colorHex}` : 'none' }} />
      <div className="absolute inset-1 rotate-45 transition-colors duration-500" style={{ backgroundColor: isActive ? '#fff' : colorHex }} />
    </div>
  )
}

const WorksPhaseUI: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const isMobile = useExperience((state) => state.isMobile)
  const isExplore = mode === MODES.EXPLORE && currentPhase === 2
  
  const containerRef = useRef<HTMLDivElement>(null)
  const masterTl = useRef<gsap.core.Timeline | null>(null)
  const categoryTl = useRef<gsap.core.Timeline | null>(null)
  const projectTl = useRef<gsap.core.Timeline | null>(null)
  const lightboxTween = useRef<gsap.core.Tween | null>(null)
  
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [activeProj, setActiveProj] = useState<string | null>(null)
  const [expandedMedia, setExpandedMedia] = useState<MediaItem | null>(null)
  const pendingProjTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.body.classList.toggle('hide-global-nav', activeCat !== null || expandedMedia !== null)

    return () => {
      document.body.classList.remove('hide-global-nav')
    }
  }, [activeCat, expandedMedia]);

  useEffect(() => {
    return () => {
      if (pendingProjTimer.current) clearTimeout(pendingProjTimer.current);
      categoryTl.current?.kill()
      projectTl.current?.kill()
      lightboxTween.current?.kill()
    }
  }, []);

  useGSAP(() => {
    gsap.set(containerRef.current, { autoAlpha: 0 })
    
    masterTl.current = gsap.timeline({ paused: true })
      .to(containerRef.current, { autoAlpha: 1, duration: 0.3 })
      .fromTo('.category-wrapper', 
         { autoAlpha: 0, y: 50 }, 
         { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out' },
         "<0.1"
      )
  }, { scope: containerRef })

  useEffect(() => {
    if (!masterTl.current) return;

    const timeline = masterTl.current

    if (isExplore) {
       timeline.eventCallback('onReverseComplete', null)
       timeline.timeScale(1).play()
    } else {
       if (pendingProjTimer.current) {
          clearTimeout(pendingProjTimer.current)
          pendingProjTimer.current = null
       }

       timeline.eventCallback('onReverseComplete', () => {
          const state = useExperience.getState()
          if (state.currentPhase === 2 && state.mode === MODES.EXPLORE) return

          setActiveCat(null)
          setActiveProj(null)
          setExpandedMedia(null)
       })
       timeline.timeScale(2).reverse()
    }

    return () => {
      timeline.eventCallback('onReverseComplete', null)
    }
  }, [isExplore])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedMedia) {
        setExpandedMedia(null)
      }
    }
    
    // Only attach listener if lightbox is open
    if (expandedMedia) {
      window.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedMedia])

  useGSAP(() => {
    categoryTl.current?.kill()
    if (!isExplore && !activeCat) return;

    const t = gsap.timeline({ defaults: { ease: 'expo.inOut', overwrite: 'auto' } })
    categoryTl.current = t
    
    SHOWCASES.forEach(cat => {
      if (activeCat === cat.id) {
        t.to(`.cat-${cat.id}`, { flex: 10, duration: 0.8 }, 0)
        t.to(`.door-left-${cat.id}`, { xPercent: -30, autoAlpha: 0, duration: 0.6 }, 0)
        t.to(`.door-right-${cat.id}`, { xPercent: 30, autoAlpha: 0, duration: 0.6 }, 0)
        t.to(`.inner-projects-${cat.id}`, { autoAlpha: 1, duration: 0.6 }, 0.2)
      } else if (activeCat !== null) {
        t.to(`.cat-${cat.id}`, { flex: 0.001, autoAlpha: 0, duration: 0.6 }, 0)
      } else {
        t.to(`.cat-${cat.id}`, { flex: 1, autoAlpha: 1, duration: 0.8 }, 0)
        t.to(`.door-left-${cat.id}`, { xPercent: 0, autoAlpha: 1, duration: 0.6 }, 0.2)
        t.to(`.door-right-${cat.id}`, { xPercent: 0, autoAlpha: 1, duration: 0.6 }, 0.2)
        t.to(`.inner-projects-${cat.id}`, { autoAlpha: 0, duration: 0.2 }, 0.6)
      }
    })
  }, { scope: containerRef, dependencies: [activeCat, isMobile, isExplore] })

  useGSAP(() => {
    projectTl.current?.kill()
    const t = gsap.timeline({ defaults: { ease: 'expo.inOut', overwrite: 'auto' } })
    projectTl.current = t
    
    SHOWCASES.forEach(cat => {
      const isThisCatActive = activeCat === cat.id;

      cat.projects.forEach((proj, idx) => {
           const isThisProjActive = activeProj === proj.subId
           
           const diagonalClip = idx === 0 
              ? 'polygon(0% 0%, 100% 0%, 0% 100%, 0% 100%)' 
              : 'polygon(100% 0%, 100% 100%, 0% 100%, 100% 0%)';
              
           const fullClip = idx === 0 
              ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' 
              : 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%)';

           const hiddenClip = idx === 0 
              ? 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)' 
              : 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)';

           if (isThisCatActive && isThisProjActive) {
              t.to(`.proj-wrapper-${proj.subId}`, { clipPath: fullClip, duration: 0.8, zIndex: 30 }, 0)
              t.to(`.proj-cover-${proj.subId}`, { height: '45%', duration: 0.8 }, 0)
              t.to(`.proj-title-${proj.subId}`, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.3)
              t.to(`.proj-details-${proj.subId}`, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.4)
           } else if (isThisCatActive && activeProj !== null) {
              t.to(`.proj-wrapper-${proj.subId}`, { clipPath: hiddenClip, duration: 0.8, zIndex: 10 }, 0)
           } else {
              t.to(`.proj-wrapper-${proj.subId}`, { clipPath: diagonalClip, duration: 0.8, zIndex: 20 }, 0)
              t.to(`.proj-cover-${proj.subId}`, { height: '100%', duration: 0.8 }, 0)
              t.to(`.proj-title-${proj.subId}`, { autoAlpha: 0, y: 20, duration: 0.3 }, 0)
              t.to(`.proj-details-${proj.subId}`, { autoAlpha: 0, y: 20, duration: 0.3 }, 0)
           }
      })
    })
  }, { scope: containerRef, dependencies: [activeProj, activeCat, isMobile] })

  useGSAP(() => {
    lightboxTween.current?.kill()

    if (expandedMedia) {
        lightboxTween.current = gsap.to('.lightbox-modal', { autoAlpha: 1, pointerEvents: 'auto', scale: 1, duration: 0.4, ease: 'expo.out', overwrite: 'auto' })
    } else {
        lightboxTween.current = gsap.to('.lightbox-modal', { autoAlpha: 0, pointerEvents: 'none', scale: 0.98, duration: 0.3, ease: 'power2.in', overwrite: 'auto' })
    }
  }, { scope: containerRef, dependencies: [expandedMedia] })
  const handleDoorClick = (catId: string, projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExplore) return;

    if (activeCat !== catId) {
        setActiveCat(catId);
        setActiveProj(null);
        if (pendingProjTimer.current) {
            clearTimeout(pendingProjTimer.current);
            pendingProjTimer.current = null;
        }
        
        pendingProjTimer.current = setTimeout(() => {
            setActiveProj(projId);
            pendingProjTimer.current = null;
        }, 800);
    }
  }

  const handleCatHeaderClick = (catId: string) => {
    if (!isExplore) return;
    if (pendingProjTimer.current) {
       clearTimeout(pendingProjTimer.current);
       pendingProjTimer.current = null;
    }
    if (activeCat !== catId) {
       setActiveCat(catId)
       setActiveProj(null)
    }
  }

  const handleProjClick = (subId: string) => {
    if (!isExplore) return;
    if (pendingProjTimer.current) {
       clearTimeout(pendingProjTimer.current);
       pendingProjTimer.current = null;
    }
    setActiveProj(activeProj === subId ? null : subId)
  }

  const handleShrinkCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExplore) return;
    if (pendingProjTimer.current) {
       clearTimeout(pendingProjTimer.current);
       pendingProjTimer.current = null;
    }
    setActiveCat(null);
    setActiveProj(null);
  }

  return (
    <div
      ref={containerRef}
      aria-hidden={!isExplore}
      inert={!isExplore}
      className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-4 md:p-8 max-w-[1800px] mx-auto overflow-hidden"
    >
      
      <div className="lightbox-modal invisible opacity-0 absolute inset-0 z-[100] flex items-center justify-center bg-[#050000]/95 pointer-events-none" 
           onClick={() => setExpandedMedia(null)}>
        
        <div className="absolute top-6 right-6 md:top-10 md:right-10 cursor-pointer group p-4 z-50" 
             onClick={(e) => { e.stopPropagation(); setExpandedMedia(null); }}>
            <div className="relative flex items-center justify-center w-8 h-8 md:w-12 md:h-12">
                <div className="absolute inset-0 rotate-45 border border-white/30 group-hover:border-red-500 transition-colors duration-300" />
                <div className="absolute inset-2 rotate-45 border border-white/20 group-hover:bg-red-500/20 transition-colors duration-300" />
                <span className="text-white font-light text-xl relative z-10 group-hover:scale-110 transition-transform">✕</span>
            </div>
        </div>

        {expandedMedia?.type === 'video' ? (
             <video 
                src={expandedMedia.src} 
                controls autoPlay playsInline
                className="max-w-[90%] max-h-[85%] object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10" 
                onClick={(e) => e.stopPropagation()} 
             />
        ) : expandedMedia ? (
             <img 
                src={expandedMedia.src} 
                alt="Expanded Architecture" 
                className="max-w-[90%] max-h-[85%] object-contain shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10" 
             />
        ) : null}
      </div>

      <div className={`w-full h-[90vh] md:h-[85vh] flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-4'} justify-center items-stretch`}>
         
         {SHOWCASES.map((cat) => (
            <div key={cat.id} 
                 className={`category-wrapper cat-${cat.id} flex-1 flex flex-col relative overflow-hidden pointer-events-none border border-white/10 bg-[#080808]/95`}>
               
               {cat.bgPattern && (
                  <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-screen"
                       style={{ backgroundImage: `url(${cat.bgPattern})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
               )}

               <div className={`cat-header-${cat.id} flex items-center gap-4 p-5 cursor-pointer border-b border-white/10 relative z-40 pointer-events-auto hover:bg-white/5 transition-colors duration-300`}
                    onClick={() => handleCatHeaderClick(cat.id)}>
                  
                  <PersianNode colorHex={cat.colorHex} isActive={activeCat === cat.id} />
                  
                  <div className="flex-1">
                     <h2 className="text-sm md:text-xl font-bold tracking-[0.3em] uppercase transition-colors duration-300" style={{ color: cat.colorHex }}>{cat.title}</h2>
                     <p className="text-[9px] md:text-[10px] text-gray-300 tracking-[0.2em] uppercase mt-1">{cat.subtitle}</p>
                  </div>
                  
                  {activeCat === cat.id && (
                     <button 
                        className="ml-auto flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2 border border-white/30 hover:border-red-500 bg-black/30 hover:bg-red-500/10 transition-all duration-300 group/close"
                        onClick={handleShrinkCategory}
                     >
                        <span className="hidden md:block text-[10px] md:text-xs font-bold tracking-[0.2em] text-white uppercase group-hover/close:text-red-400">Shrink</span>
                        <div className="relative w-4 h-4 flex items-center justify-center">
                           <div className="absolute inset-0 border border-white/50 rotate-45 group-hover/close:border-red-500 transition-colors" />
                           <span className="text-white text-xs z-10 group-hover/close:text-red-400 transition-colors">✕</span>
                        </div>
                     </button>
                  )}
               </div>

               <div className="absolute inset-0 top-[70px] z-20 pointer-events-none overflow-hidden">
                  <div className={`door-left-${cat.id} loading="lazy" absolute inset-0 z-0 bg-[#050505] pointer-events-auto cursor-pointer group`} 
                       style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                       onClick={(e) => handleDoorClick(cat.id, cat.projects[0].subId, e)}>
                     <img src={cat.projects[0].cover} alt="preview 1" loading="lazy" className="w-full h-full object-cover opacity-100 transition-all duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-transparent opacity-100 group-hover:opacity-40 transition-opacity duration-700" />
                  </div>
                  
                  <div className={`door-right-${cat.id} loading="lazy" absolute inset-0 z-0 bg-[#050505] pointer-events-auto cursor-pointer group`} 
                       style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }}
                       onClick={(e) => handleDoorClick(cat.id, cat.projects[1].subId, e)}>
                     <img src={cat.projects[1].cover} alt="preview 2" loading="lazy" className="w-full h-full object-cover opacity-100  transition-all duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-tl from-black/70 to-transparent opacity-100 group-hover:opacity-40 transition-opacity duration-700" />
                  </div>
                  
                  <div className="absolute top-0 right-0 w-[141.4%] h-[1px] origin-top-right rotate-45 z-10" style={{ backgroundColor: `${cat.colorHex}60` }} />
               </div>

               <div className={`inner-projects-${cat.id} absolute inset-0 top-[70px] z-10 opacity-0 flex ${isMobile ? 'flex-col' : 'flex-row'} p-4 gap-4 pointer-events-auto`}>
                  
                  {cat.projects.map((proj, idx) => (
                       <div key={proj.subId} 
                            className={`proj-wrapper-${proj.subId} absolute inset-0 overflow-hidden group/proj bg-[#050505] ${activeProj === proj.subId ? 'cursor-auto' : 'cursor-pointer'}`}
                            onClick={() => {
                                if (activeProj !== proj.subId) {
                                    handleProjClick(proj.subId);
                                }
                            }}
                            style={{ clipPath: idx === 0 ? 'polygon(0% 0%, 100% 0%, 0% 100%, 0% 100%)' : 'polygon(100% 0%, 100% 100%, 0% 100%, 100% 0%)' }}>
                           
                           <div className={`proj-cover-${proj.subId} absolute top-0 left-0 w-full h-full overflow-hidden`}>
                               <img src={proj.cover} alt={proj.name} loading="lazy" className="w-full h-full object-cover opacity-60 group-hover/proj:opacity-100 transition-all duration-700 group-hover/proj:scale-105" />
                               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 group-hover/proj:opacity-70 transition-opacity duration-700" />
                               
                               <div className={`proj-title-${proj.subId} absolute bottom-6 left-6 right-6 opacity-0 translate-y-5 pointer-events-none flex justify-between items-end z-10`}>
                                   <h3 className="text-2xl md:text-4xl font-bold tracking-[0.3em] uppercase text-white drop-shadow-2xl">{proj.name}</h3>
                                   
                                   {activeProj === proj.subId && (
                                       <button 
                                           className="pointer-events-auto flex items-center justify-center w-10 h-10 border border-white/30 hover:border-red-500 bg-black/40 hover:bg-red-500/20 text-white transition-all duration-300 rounded-full"
                                           onClick={handleShrinkCategory}
                                       >
                                           <span className="text-xl">✕</span>
                                       </button>
                                   )}
                               </div>
                           </div>

                           <div className={`proj-details-${proj.subId} absolute bottom-0 left-0 w-full h-[55%] flex flex-col p-6 md:p-10 opacity-0 translate-y-5 cursor-auto border-t border-white/10 bg-black/90`} 
                                onClick={(e) => e.stopPropagation()}>
                               
                               <p className="text-xs md:text-sm text-gray-200 font-light leading-relaxed mb-4 tracking-widest max-w-3xl flex-shrink-0">{proj.desc}</p>
                               
                               <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-2 pt-2 items-start min-h-[100px]">
                                  {proj.gallery.map((media, i) => (
                                     <div key={i} 
                                          className="relative h-28 md:h-36 w-40 md:w-52 flex-shrink-0 overflow-hidden cursor-pointer group/img border border-white/20 bg-black"
                                          onClick={(e) => { e.stopPropagation(); setExpandedMedia(media); }}>
                                         
                                         {media.type === 'video' ? (
                                             <video src={media.src} muted playsInline preload="metadata" className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                         ) : (
                                             <img src={media.src} alt="gallery" loading="lazy" className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                         )}
                                         
                                         {media.type === 'video' ? (
                                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                 <div className="w-10 h-10 border border-white/50 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center pl-1 group-hover/img:border-white group-hover/img:scale-110 transition-all duration-500 shadow-xl">
                                                     <span className="text-white text-sm">▶</span>
                                                 </div>
                                             </div>
                                         ) : (
                                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-sm pointer-events-none">
                                                 <span className="text-white text-2xl font-light drop-shadow-lg">⚲</span>
                                             </div>
                                         )}
                                     </div>
                                  ))}
                               </div>

                               {proj.hasLink && proj.link && (
                                  <div className="mt-4 flex-shrink-0">
                                     <button 
                                         onClick={(e) => {
                                             e.stopPropagation(); 
                                             window.open(proj.link, '_blank', 'noopener,noreferrer');
                                         }}
                                         className="group relative flex items-center justify-between w-full md:w-auto px-6 py-4 border bg-black/30 overflow-hidden transition-all duration-500"
                                         style={{ borderColor: `${cat.colorHex}60` }}>
                                        
                                        <div className="absolute inset-0 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out" style={{ backgroundColor: cat.colorHex }} />
                                        
                                        <span className="relative z-10 text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-white group-hover:text-white transition-colors duration-500 drop-shadow-md">
                                           Launch Architecture
                                        </span>
                                        <span className="relative z-10 text-lg text-white group-hover:text-white group-hover:translate-x-2 transition-all duration-500 ml-6 drop-shadow-md">
                                           ↗
                                        </span>
                                     </button>
                                  </div>
                               )}
                           </div>
                       </div>
                   ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  )
}

export default WorksPhaseUI
