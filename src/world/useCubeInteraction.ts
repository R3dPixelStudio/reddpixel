import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import { MODES, useExperience } from '../stores/useExperience'
import { cubeInteraction, isCubeTap, neutralRotation } from './cubeInteraction'

type Gesture = { id: number; startX: number; startY: number; lastX: number; lastY: number; distanceSquared: number }

export function useCubeInteraction() {
  const canvas = useThree(state => state.gl.domElement)
  const target = useRef({ x: 0, y: 0 })
  const gesture = useRef<Gesture | null>(null)

  useEffect(() => {
    const canInteract = () => {
      const state = useExperience.getState()
      return state.isCubeReady && !state.isTransitioning && !state.isContentView && !state.isSceneObscured && !state.reducedMotion &&
        (state.currentPhase === 0 || (state.currentPhase === 1 && state.mode === MODES.EXPLORE))
    }
    const release = () => {
      const previous = gesture.current
      gesture.current = null
      if (previous && canvas.hasPointerCapture(previous.id)) canvas.releasePointerCapture(previous.id)
    }
    const neutralize = () => {
      release()
      cubeInteraction.hitPointerId = -1
      cubeInteraction.rotationY = neutralRotation(cubeInteraction.rotationY)
      target.current.x = 0
      target.current.y = 0
      if ((Math.abs(cubeInteraction.rotationX) > .002 || Math.abs(cubeInteraction.rotationY) > .002) && !useExperience.getState().isCubeInteracting) useExperience.getState().setCubeInteracting(true)
    }
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) { neutralize(); return }
      if ((!useExperience.getState().isMobile && event.pointerType === 'mouse') || !event.isPrimary || event.button !== 0 || !canInteract()) return
      release()
      cubeInteraction.hitPointerId = -1
      gesture.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, distanceSquared: 0 }
      useExperience.getState().setCubeInteracting(true)
    }
    const move = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || event.pointerId !== current.id) return
      if (!canInteract()) { neutralize(); return }
      current.distanceSquared = Math.max(current.distanceSquared, (event.clientX - current.startX) ** 2 + (event.clientY - current.startY) ** 2)
      if (!isCubeTap(current.distanceSquared)) {
        if (!canvas.hasPointerCapture(event.pointerId)) canvas.setPointerCapture(event.pointerId)
        const sensitivity = 3.5 / Math.max(280, canvas.clientWidth)
        target.current.y += (event.clientX - current.lastX) * sensitivity
        target.current.x = MathUtils.clamp(target.current.x + (event.clientY - current.lastY) * sensitivity, -.9, .9)
      }
      current.lastX = event.clientX
      current.lastY = event.clientY
    }
    const up = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || event.pointerId !== current.id) return
      current.distanceSquared = Math.max(current.distanceSquared, (event.clientX - current.startX) ** 2 + (event.clientY - current.startY) ** 2)
      if (canInteract() && isCubeTap(current.distanceSquared) && cubeInteraction.hitPointerId !== event.pointerId) {
        const bounds = canvas.getBoundingClientRect()
        target.current.y += ((event.clientX - bounds.left) / bounds.width - .5) * .7
        target.current.x = MathUtils.clamp(target.current.x + ((event.clientY - bounds.top) / bounds.height - .5) * .4, -.9, .9)
      }
      gesture.current = null
    }
    const cancel = (event: PointerEvent) => {
      if (gesture.current?.id === event.pointerId) neutralize()
    }
    const hidden = () => { if (document.hidden) neutralize() }
    const secondary = (event: PointerEvent) => { if (!event.isPrimary && gesture.current) neutralize() }
    const unsubscribe = useExperience.subscribe((state, previous) => {
      if ((state.isTransitioning && !previous.isTransitioning) || state.currentPhase !== previous.currentPhase ||
          (state.isContentView && !previous.isContentView) || (state.reducedMotion && !previous.reducedMotion) ||
          (state.isSceneObscured && !previous.isSceneObscured)) neutralize()
    })
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointerdown', secondary)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    canvas.addEventListener('lostpointercapture', cancel)
    window.addEventListener('blur', neutralize)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      unsubscribe(); release()
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerdown', secondary)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      canvas.removeEventListener('lostpointercapture', cancel)
      window.removeEventListener('blur', neutralize)
      document.removeEventListener('visibilitychange', hidden)
      cubeInteraction.rotationX = 0; cubeInteraction.rotationY = 0; cubeInteraction.hitPointerId = -1
      useExperience.getState().setCubeInteracting(false)
    }
  }, [canvas])

  useFrame((_state, delta) => {
    const state = useExperience.getState()
    if (state.reducedMotion) { cubeInteraction.rotationX = 0; cubeInteraction.rotationY = 0 }
    else {
      cubeInteraction.rotationX = MathUtils.damp(cubeInteraction.rotationX, target.current.x, 9, Math.min(delta, .1))
      cubeInteraction.rotationY = MathUtils.damp(cubeInteraction.rotationY, target.current.y, 9, Math.min(delta, .1))
    }
    const settled = Math.abs(cubeInteraction.rotationX - target.current.x) < .002 && Math.abs(cubeInteraction.rotationY - target.current.y) < .002
    if (settled && !gesture.current && state.isCubeInteracting) state.setCubeInteracting(false)
  }, -2)
}
