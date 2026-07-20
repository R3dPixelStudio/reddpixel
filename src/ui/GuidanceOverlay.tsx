import React, { useEffect, useState } from 'react'
import { useExperience } from '../stores/useExperience'

const GuidanceOverlay: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const isTransitioning = useExperience((state) => state.isTransitioning)
  const [navHintsVisible, setNavHintsVisible] = useState<boolean>(false)
  const showLandingHint = currentPhase === 0 && !isTransitioning

  useEffect(() => {
    let hideTimer: number | null = null
    const updateFrame = window.requestAnimationFrame(() => {
      const shouldShow = currentPhase > 0
      setNavHintsVisible(shouldShow)

      if (shouldShow) {
        hideTimer = window.setTimeout(() => setNavHintsVisible(false), 3000)
      }
    })

    return () => {
      window.cancelAnimationFrame(updateFrame)
      if (hideTimer !== null) clearTimeout(hideTimer)
    }
  }, [currentPhase])

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <div className={`absolute bottom-[15%] left-1/2 -translate-x-1/2 transition-all duration-1000 flex flex-col items-center gap-3 ${showLandingHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-[1px] h-12 bg-gradient-to-t from-red-500 to-transparent" />
        <p className={`font-mono text-xs text-center tracking-[0.3em] text-red-400 uppercase ${showLandingHint ? 'animate-pulse' : ''}`}>Click artifact to initiate</p>
      </div>

      <div className={`absolute bottom-[12%] left-1/2 -translate-x-1/2 w-64 h-24 transition-opacity duration-1000 ${navHintsVisible && !isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        <p className="absolute bottom-0 left-0 font-mono text-[9px] tracking-widest text-white/50">&#8592; PREV</p>
        
        <p className="absolute bottom-0 right-0 font-mono text-[9px] tracking-widest text-white/50">NEXT &#8594;</p>
      </div>
    </div>
  )
}

export default GuidanceOverlay
