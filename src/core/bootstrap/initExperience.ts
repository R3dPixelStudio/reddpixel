import { useExperience, MODES } from '../../stores/useExperience'

export const initExperience = (): void => {
  // Force reset state on hard refresh to prevent stuck states
  useExperience.getState().setPhase(0)
  useExperience.getState().setMode(MODES.LANDING)
  useExperience.getState().setIsTransitioning(false)
}