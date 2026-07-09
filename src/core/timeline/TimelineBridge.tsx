import React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import { worldState } from '../../world/worldState'
import { useExperience } from '../../stores/useExperience'

const TimelineBridge: React.FC = () => {
  const camera = useThree((state) => state.camera)

  useFrame((state) => {
    const { currentPhase, isMobile } = useExperience.getState()

    let targetCamX = worldState.cameraX
    let targetCamY = worldState.cameraY

    // THE FIX: Camera tilts in BOTH Landing (0) and About (1) phases!
    if ((currentPhase === 0 || currentPhase === 1) && !isMobile) {
      targetCamX += state.pointer.x * 1.5
      targetCamY += state.pointer.y * 1.5
    }

    camera.position.x = MathUtils.lerp(camera.position.x, targetCamX, 0.05)
    camera.position.y = MathUtils.lerp(camera.position.y, targetCamY, 0.05)
    camera.position.z = MathUtils.lerp(camera.position.z, worldState.cameraZ, 0.05)

    camera.lookAt(worldState.targetX, worldState.targetY, worldState.targetZ)
  })

  return null
}

export default TimelineBridge