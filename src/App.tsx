import React, { useEffect, useState, Suspense } from 'react'
import { useDetectGPU, useProgress } from '@react-three/drei'
import { useExperience } from './stores/useExperience'
import Experience from './world/Experience'
import Layout from './ui/Layout'

// ========================================================
// THE GRAND ARCHIVIST OF LOADING
// ========================================================
const LoadingScreen: React.FC<{ isGpuReady: boolean }> = ({ isGpuReady }) => {
  const { progress, total } = useProgress()
  const isCubeReady = useExperience((state) => state.isCubeReady)

  const [isFullyLoaded, setIsFullyLoaded] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // 1. The Failsafe (10s absolute max, but we clean it up!)
  useEffect(() => {
    const failsafe = setTimeout(() => {
      setIsFullyLoaded(true)
      setTimeout(() => setIsHidden(true), 1000)
    }, 10000) 
    
    return () => clearTimeout(failsafe)
  }, [])

  // 2. The Ironclad Loading Logic
  useEffect(() => {
    if (!isGpuReady) return;

    // FIX: If total is 0, Drei isn't loading anything globally. We must not wait for progress === 100!
    const isDownloadingDone = total === 0 ? true : Math.round(progress) >= 100;

    if (isDownloadingDone && isCubeReady) {
        setIsFullyLoaded(true)
        const hideTimer = setTimeout(() => setIsHidden(true), 1000)
        return () => clearTimeout(hideTimer)
    }
  }, [isGpuReady, progress, total, isCubeReady])

  if (isHidden) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000 ease-in-out ${
        isFullyLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      <div className="relative flex h-16 w-16 animate-[spin_4s_linear_infinite] items-center justify-center">
          <div className="absolute inset-0 rotate-45 border border-red-500/40" />
          <div className="absolute inset-0 border border-red-500/40" />
          <div className="h-3 w-3 animate-pulse bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)]" />
      </div>
      <p className="mt-8 animate-pulse font-mono text-[10px] uppercase tracking-[0.4em] text-center text-red-500/80">
        Initializing Architecture... {total === 0 ? 'Building' : `${Math.round(progress)}%`}
      </p>
    </div>
  )
}

// ========================================================
// THE GPU DETECTOR (Needs Suspense)
// ========================================================
const GPUDetector: React.FC<{ onReady: (isMobile: boolean, isWeak: boolean) => void }> = ({ onReady }) => {
  const GPUTier = useDetectGPU() 
  
  useEffect(() => {
    if (GPUTier) {
      const isMobile = GPUTier.isMobile === true || window.innerWidth < 768;
      const isWeak = isMobile || (typeof GPUTier.tier === 'number' && GPUTier.tier <= 1);
      onReady(isMobile, isWeak)
    }
  }, [GPUTier, onReady])

  return null;
}

// ========================================================
// THE ROOT APPLICATION
// ========================================================
const App: React.FC = () => {
  const setHardwareProfile = useExperience((state) => state.setHardwareProfile)
  const [isGpuReady, setIsGpuReady] = useState<boolean>(false)

  return (
    <>
      <Suspense fallback={null}>
        <GPUDetector onReady={(isMobile, isWeak) => {
           setHardwareProfile(isMobile, isWeak);
           setIsGpuReady(true);
        }} />
      </Suspense>

      <LoadingScreen isGpuReady={isGpuReady} />
      
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