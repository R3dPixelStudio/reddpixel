import React, { useState, useEffect } from 'react'
import { goBack, goDeeper, FIRST_INTERIOR_PHASE } from '../../core/timeline/cinematicController'
import { useExperience } from '../../stores/useExperience'

const TraversalControls: React.FC = () => {
  const show = useExperience((state) => state.showTraversalControls())
  const currentPhase = useExperience((state) => state.currentPhase)
  const isTransitioning = useExperience((state) => state.isTransitioning)

  const [isObscured, setIsObscured] = useState<boolean>(false)

  useEffect(() => {
    const checkClass = () => {
      setIsObscured(document.body.classList.contains('hide-global-nav'))
    }
    
    checkClass()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkClass()
        }
      })
    })

    observer.observe(document.body, { attributes: true })
    return () => observer.disconnect()
  }, [])

  if (!show) return null


  const isActuallyDisabledBack = !currentPhase || currentPhase < FIRST_INTERIOR_PHASE || isTransitioning || isObscured
  const isActuallyDisabledNext = isTransitioning || isObscured

  const handleRedClick = () => {
    goDeeper()
  }

  const handleBlueClick = () => {
    goBack()
  }

  return (
    <nav 
      aria-label="Dimensional traversal"
      className={`traversal-controls fixed left-1/2 z-50 flex h-16 w-40 -translate-x-1/2 items-center justify-between transition-all duration-500 ease-in-out ${
        isObscured ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 pointer-events-auto translate-y-0'
      }`}
    >
      <button
        type="button"
        aria-label="Travel to the previous portfolio phase"
        disabled={isActuallyDisabledBack}
        onClick={handleBlueClick}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/40 bg-black/60 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-blue-400 hover:bg-blue-500/30 disabled:opacity-30 disabled:hover:scale-100"
      >
        <span className="text-xl font-light">←</span>
      </button>

      <button
        type="button"
        aria-label="Travel to the next portfolio phase"
        disabled={isActuallyDisabledNext}
        onClick={handleRedClick}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-black/60 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-red-400 hover:bg-red-500/30 disabled:opacity-30 disabled:hover:scale-100"
      >
        <span className="text-xl font-light">→</span>
      </button>
    </nav>
  )
}

export default TraversalControls
