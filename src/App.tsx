import React, { useEffect, useState } from 'react'
import { useDetectGPU, useProgress } from '@react-three/drei'
import { useExperience } from './stores/useExperience'
import Experience from './world/Experience'
import Layout from './ui/Layout'

// ========================================================
// THE GRAND ARCHIVIST OF LOADING
// ========================================================
const LoadingScreen: React.FC<{ isGpuReady: boolean }> = ({ isGpuReady }) => {
  const { progress, total } = useProgress()
  
  // THE MASTER LOCK: We ask the store if the Scene is actually compiled and painted!
  const isCubeReady = useExperience((state) => state.isCubeReady)

  const [isFullyLoaded, setIsFullyLoaded] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // 1. The Failsafe (Never trap the user indefinitely. 10 seconds absolute max)
  useEffect(() => {
    const failsafe = setTimeout(() => {
      setIsFullyLoaded(true)
      const hideTimer = setTimeout(() => setIsHidden(true), 1000)
      return () => clearTimeout(hideTimer)
    }, 10000) 
    
    return () => clearTimeout(failsafe)
  }, [])

  // 2. The Ironclad Loading Logic
  useEffect(() => {
    if (!isGpuReady) return;

    // Mark as started once we actually have files in the queue
    if (total > 0 && !hasStarted) {
      setHasStarted(true)
    }

    // ZERO GUESSWORK: 
    // Is downloading done? (progress === 100)
    // AND did the Experience tell us it compiled and rendered? (isCubeReady === true)
    if (hasStarted && progress === 100 && isCubeReady) {
        setIsFullyLoaded(true)
        const hideTimer = setTimeout(() => setIsHidden(true), 1000)
        return () => clearTimeout(hideTimer)
    }
  }, [isGpuReady, hasStarted, progress, total, isCubeReady])

  // Banish from DOM once faded out to save memory
  if (isHidden) return null;

  // Prevent the "100 -> 0" flash by forcing 0 until it actually starts grabbing files
  const displayProgress = hasStarted ? Math.round(progress) : 0;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000 ease-in-out ${
        isFullyLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* The Original Geometric Spinner */}
      <div className="relative flex h-16 w-16 animate-[spin_4s_linear_infinite] items-center justify-center">
          <div className="absolute inset-0 rotate-45 border border-red-500/40" />
          <div className="absolute inset-0 border border-red-500/40" />
          <div className="h-3 w-3 animate-pulse bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)]" />
      </div>
      
      <p className="mt-8 animate-pulse font-mono text-[10px] uppercase tracking-[0.4em] text-red-500/80">
        Initializing Architecture... {displayProgress}%
      </p>
    </div>
  )
}

// ========================================================
// THE ROOT APPLICATION
// ========================================================
const App: React.FC = () => {
  // @ts-ignore - Drei types can sometimes be loose for this hook
  const GPUTier = useDetectGPU() 
  const setHardwareProfile = useExperience((state) => state.setHardwareProfile)
  
  const [isGpuReady, setIsGpuReady] = useState<boolean>(false)

  // Wait for the hardware profile BEFORE mounting the heavy 3D assets
  useEffect(() => {
    if (GPUTier) {
      const isMobile = GPUTier.isMobile === true || window.innerWidth < 768;
      // If mobile OR tier 1/0 integrated graphics
      const isWeak = isMobile || (typeof GPUTier.tier === 'number' && GPUTier.tier <= 1);
      
      setHardwareProfile(isMobile, isWeak)
      setIsGpuReady(true) 
    }
  }, [GPUTier, setHardwareProfile])

  return (
    <>
      <LoadingScreen isGpuReady={isGpuReady} />
      
      {/* We wait to mount the Experience until we know if we need the Mobile or Desktop models */}
      {isGpuReady && (
        <>
          <Experience />
          <Layout />
        </>
      )}
    </>
  )
}

export default App