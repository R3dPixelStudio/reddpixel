import React from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { worldState } from '../../world/worldState'
import { useExperience } from '../../stores/useExperience'

const TimelineBridge: React.FC = () => {
  useFrame((state, delta) => {
    const { currentPhase, isMobile } = useExperience.getState()
    const camera = state.camera

    let targetCamX = worldState.cameraX
    let targetCamY = worldState.cameraY

    if ((currentPhase === 0 || currentPhase === 1) && !isMobile) {
      targetCamX += state.pointer.x * 1.5
      targetCamY += state.pointer.y * 1.5
    }

    camera.position.x = MathUtils.damp(camera.position.x, targetCamX, 3.08, delta)
    camera.position.y = MathUtils.damp(camera.position.y, targetCamY, 3.08, delta)
    camera.position.z = MathUtils.damp(camera.position.z, worldState.cameraZ, 3.08, delta)

    camera.lookAt(worldState.targetX, worldState.targetY, worldState.targetZ)
  })

  return null
}

export default TimelineBridge
