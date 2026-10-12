import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'
import { introComposition } from '../../world/introComposition'

export const initExperience = (): void => {
  const state = useExperience.getState()

  state.setPhase(0)
  state.setMode(MODES.LANDING)
  state.setIsTransitioning(false)

  Object.assign(worldState, introComposition(state.isMobile))
}
