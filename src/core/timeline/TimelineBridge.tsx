import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { worldState } from '../../world/worldState'
import { useExperience } from '../../stores/useExperience'

const TimelineBridge: React.FC = () => {
  const parallax = useRef({ x: 0, y: 0 })
  useFrame((state, delta) => {
    const { currentPhase, isMobile, reducedMotion } = useExperience.getState()
    const camera = state.camera

    const pointerActive = currentPhase <= 1 && !isMobile && !reducedMotion
    parallax.current.x = MathUtils.damp(parallax.current.x, pointerActive ? state.pointer.x * 1.5 : 0, 3.08, delta)
    parallax.current.y = MathUtils.damp(parallax.current.y, pointerActive ? state.pointer.y * 1.5 : 0, 3.08, delta)
    // GSAP already eases the camera. Damping it again left a stale position when idle frames stopped.
    camera.position.set(worldState.cameraX + parallax.current.x, worldState.cameraY + parallax.current.y, worldState.cameraZ)

    camera.lookAt(worldState.targetX, worldState.targetY, worldState.targetZ)
  }, -1)

  return null
}

export default TimelineBridge
