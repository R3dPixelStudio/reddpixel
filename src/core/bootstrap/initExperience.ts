import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'

export const initExperience = (): void => {
  const state = useExperience.getState()

  state.setPhase(0)
  state.setMode(MODES.LANDING)
  state.setIsTransitioning(false)

  Object.assign(worldState, {
    cameraX: 0,
    cameraY: 1.5,
    cameraZ:  14,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    cubeRotX: 0,
    cubeRotY: 0,
    cubeRotZ: 0,
  })
}
