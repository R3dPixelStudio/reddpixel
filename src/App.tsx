import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useDetectGPU, useProgress } from '@react-three/drei'
import { useExperience } from './stores/useExperience'
import { syncCameraToLayout } from './core/timeline/cinematicController'
import Experience from './world/Experience'
import Layout from './ui/Layout'

// ========================================================
// THE GRAND ARCHIVIST OF LOADING
// ========================================================
const LoadingScreen: React.FC<{ isGpuReady: boolean }> = ({ isGpuReady }) => {
  const { progress, total } = useProgress()
  const isCubeReady = useExperience((state) => state.isCubeReady)

  const [didReachFailsafe, setDidReachFailsafe] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const isDownloadingDone = total === 0 || Math.round(progress) >= 100
  const isFullyLoaded = didReachFailsafe || (isGpuReady && isDownloadingDone && isCubeReady)

  useEffect(() => {
    const failsafe = window.setTimeout(() => setDidReachFailsafe(true), 10000)
    return () => clearTimeout(failsafe)
  }, [])

  useEffect(() => {
    if (!isFullyLoaded) return
    const hideTimer = window.setTimeout(() => setIsHidden(true), 1000)
    return () => clearTimeout(hideTimer)
  }, [isFullyLoaded])

  if (isHidden) return null

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

const GPUDetector: React.FC<{ onReady: (isMobile: boolean, isWeak: boolean) => void }> = ({ onReady }) => {
  const gpuTier = useDetectGPU()
  
  useEffect(() => {
    if (!gpuTier) return

    const isGpuMobile = gpuTier.isMobile === true
    const isWeak = typeof gpuTier.tier === 'number' && gpuTier.tier <= 1
    onReady(isGpuMobile, isWeak)
  }, [gpuTier, onReady])

  return null
}

const App: React.FC = () => {
  const setHardwareProfile = useExperience((state) => state.setHardwareProfile)
  const setMobileLayout = useExperience((state) => state.setMobileLayout)
  const [isGpuReady, setIsGpuReady] = useState<boolean>(false)
  const profileResolvedRef = useRef(false)

  const handleGpuReady = useCallback(
    (_isGpuMobile: boolean, isWeak: boolean) => {
      if (profileResolvedRef.current) return
      profileResolvedRef.current = true
      setHardwareProfile(isWeak)
      setIsGpuReady(true)
    },
    [setHardwareProfile],
  )

  useEffect(() => {
    const mobileLayout = window.matchMedia('(max-width: 767px)')
    const syncMobileLayout = () => {
      const nextIsMobile = mobileLayout.matches
      if (useExperience.getState().isMobile === nextIsMobile) return

      setMobileLayout(nextIsMobile)
      if (isGpuReady) syncCameraToLayout()
    }

    syncMobileLayout()
    mobileLayout.addEventListener('change', syncMobileLayout)
    return () => mobileLayout.removeEventListener('change', syncMobileLayout)
  }, [isGpuReady, setMobileLayout])

  useEffect(() => {
    if (isGpuReady) return

    const fallback = window.setTimeout(() => {
      if (profileResolvedRef.current) return
      profileResolvedRef.current = true
      setHardwareProfile(true)
      setIsGpuReady(true)
    }, 10000)

    return () => clearTimeout(fallback)
  }, [isGpuReady, setHardwareProfile])

  return (
    <>
      <Suspense fallback={null}>
        <GPUDetector onReady={handleGpuReady} />
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
