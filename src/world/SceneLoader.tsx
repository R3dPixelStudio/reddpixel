import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useDetectGPU } from '@react-three/drei'
import { useExperience } from '../stores/useExperience'
import Experience from './Experience'

function GPUDetector({ onReady, onFailure }: { onReady: (isWeak: boolean) => void; onFailure: () => void }) {
  const tier = useDetectGPU()
  useEffect(() => {
    if (tier?.type === 'WEBGL_UNSUPPORTED') onFailure()
    else if (tier) onReady(typeof tier.tier === 'number' && tier.tier <= 1)
  }, [tier, onReady, onFailure])
  return null
}

export default function SceneLoader({ onFailure }: { onFailure: () => void }) {
  const [ready, setReady] = useState(false)
  const resolved = useRef(false)
  const onReady = useCallback((isWeak: boolean) => {
    if (resolved.current) return
    resolved.current = true
    useExperience.getState().setHardwareProfile(isWeak)
    setReady(true)
  }, [])
  useEffect(() => {
    const timeout = window.setTimeout(() => onReady(true), 10000)
    return () => window.clearTimeout(timeout)
  }, [onReady])
  return <>
    <Suspense fallback={null}><GPUDetector onReady={onReady} onFailure={onFailure} /></Suspense>
    {ready && <Experience onFailure={onFailure} />}
  </>
}
