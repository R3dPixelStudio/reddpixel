import React from 'react'
import { useExperience } from '../stores/useExperience'
import { jumpToPhase } from '../core/timeline/cinematicController'
// ... inside your component where you want the button:


const LandingFooter: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const isLanding = currentPhase === 0

  return (
    <footer className={`fixed bottom-0 left-0 right-0 w-full px-6 py-6 flex justify-between items-end z-40 pointer-events-none transition-all duration-1000 ease-in-out ${isLanding ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 shadow-[0_0_10px_#ff0033]" />
            <h1 className="font-mono text-xl font-bold tracking-widest text-white">REDPIXEL</h1>
        </div>
        <p className="font-mono text-[9px] tracking-[0.3em] text-white/50 uppercase ml-6">Interactive Architect</p>
      </div>
      <div className="text-right">
      <button 
  onClick={() => jumpToPhase(3)} 
  className="pointer-events-auto group relative flex items-center gap-3 px-6 py-2 border border-red-500/50 bg-[#050000]/60 backdrop-blur-md hover:bg-red-950/40 transition-all"
>
  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
  <span className="text-[10px] tracking-[0.2em] text-red-200 group-hover:text-white transition-colors">SUMMON AI ORACLE</span>
</button>
        
      </div>
    </footer>
  )
}

export default LandingFooter