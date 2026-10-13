import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera } from 'three'
import { worldState } from '../../world/worldState'
import { CUBE_CLEARANCE, cubeInteraction } from '../../world/cubeInteraction'
import { useExperience } from '../../stores/useExperience'

const TimelineBridge: React.FC = () => {
  const parallax = useRef({ x: 0, y: 0 })
  useFrame((state, delta) => {
    const { currentPhase, isMobile, reducedMotion, isTransitioning } = useExperience.getState()
    const camera = state.camera
    if (camera instanceof PerspectiveCamera) {
      const fov = worldState.cameraZ >= -CUBE_CLEARANCE ? 38 : 45
      const next = reducedMotion ? fov : MathUtils.damp(camera.fov, fov, 2, Math.min(delta, .1))
      if (Math.abs(camera.fov - fov) > .001) {
        camera.fov = Math.abs(next - fov) < .01 ? fov : next
        camera.updateProjectionMatrix()
      }
    }

    const pointerActive = currentPhase <= 1 && !isMobile && !reducedMotion && !isTransitioning && !cubeInteraction.dragging
    parallax.current.x = MathUtils.damp(parallax.current.x, pointerActive ? state.pointer.x * .28 : 0, 3.08, Math.min(delta, .1))
    parallax.current.y = MathUtils.damp(parallax.current.y, pointerActive ? state.pointer.y * .16 : 0, 3.08, Math.min(delta, .1))
    // GSAP already eases the camera. Damping it again left a stale position when idle frames stopped.
    camera.position.set(worldState.cameraX + parallax.current.x, worldState.cameraY + parallax.current.y, worldState.cameraZ)

    camera.lookAt(worldState.targetX, worldState.targetY, worldState.targetZ)
  }, -1)

  return null
}

export default TimelineBridge
