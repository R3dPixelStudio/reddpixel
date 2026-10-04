import { useCallback, useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useExperience } from '../stores/useExperience'
import { cubeInteraction, isCubeTap } from './cubeInteraction'

export function useCubeAdvance(onTrigger: () => void, enabled: boolean) {
  const cleanupListeners = useRef<() => void>(() => undefined)
  const clearGesture = useCallback(() => {
    cleanupListeners.current()
    cleanupListeners.current = () => undefined
  }, [])

  useEffect(() => {
    if (!enabled) clearGesture()
    return clearGesture
  }, [clearGesture, enabled])

  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!event.isPrimary) { clearGesture(); return }
    const state = useExperience.getState()
    if (!enabled || !state.isCubeReady || state.isTransitioning || !event.isPrimary || event.button !== 0) return
    event.stopPropagation()
    clearGesture()
    cubeInteraction.hitPointerId = event.pointerId
    const phase = state.currentPhase
    const pointerId = event.pointerId
    const startX = event.clientX
    const startY = event.clientY
    let distanceSquared = 0
    const track = (current: PointerEvent) => {
      if (current.pointerId === pointerId) distanceSquared = Math.max(distanceSquared, (current.clientX - startX) ** 2 + (current.clientY - startY) ** 2)
    }
    const up = (current: PointerEvent) => {
      if (current.pointerId !== pointerId) return
      track(current)
      clearGesture()
      const latest = useExperience.getState()
      if (isCubeTap(distanceSquared) && latest.currentPhase === phase && !latest.isTransitioning && !latest.isContentView && !latest.isSceneObscured) onTrigger()
    }
    const cancel = (current: PointerEvent) => { if (current.pointerId === pointerId) clearGesture() }
    const secondary = (current: PointerEvent) => { if (!current.isPrimary) clearGesture() }
    const hidden = () => { if (document.hidden) clearGesture() }
    cleanupListeners.current = () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerdown', secondary)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('lostpointercapture', cancel)
      window.removeEventListener('blur', clearGesture)
      document.removeEventListener('visibilitychange', hidden)
    }
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerdown', secondary)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('lostpointercapture', cancel)
    window.addEventListener('blur', clearGesture)
    document.addEventListener('visibilitychange', hidden)
  }, [enabled, onTrigger, clearGesture])

  return { onPointerDown }
}
