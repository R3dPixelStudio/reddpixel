import gsap from 'gsap'
import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'

export const FIRST_INTERIOR_PHASE = 1;
export const MAX_PHASE = 3;

// FIX: Track timeouts to kill zombie callbacks!
let transitionTimeout: ReturnType<typeof setTimeout> | null = null;

const clearTransitionTimeout = () => {
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }
};

const getCameraPositions = (isMobile: boolean) => [
  { z: isMobile ? 18.0 : 14.0, y: isMobile ? 1.5 : 1.5, targetX: 0, targetY: 0, targetZ: 0 }, 
  { z: isMobile ? 9.0 : 4.5,   y: isMobile ? 1.5 : 0.5, targetX: 0, targetY: 0, targetZ: 0 }, 
  { z: -4.0, y: 0.0, targetX: 0, targetY: 0, targetZ: -20.0 }, 
  { z: -8.0, y: 0.0, targetX: 0, targetY: 0, targetZ: -20.0 }  
]

const animateCameraToPhase = (phaseIndex: number) => {
  const state = useExperience.getState()
  const positions = getCameraPositions(state.isMobile)
  const target = positions[phaseIndex] || positions[0]
  
  gsap.killTweensOf(worldState) // FIX: Kill EVERYTHING on worldState to prevent races!
  gsap.to(worldState, {
    cameraZ: target.z, cameraY: target.y, 
    targetX: target.targetX, targetY: target.targetY, targetZ: target.targetZ, 
    duration: 1.2, ease: 'power3.inOut'
  })
}

export const goDeeper = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning) return

  clearTransitionTimeout(); // Clear zombies!

  if (state.currentPhase >= MAX_PHASE) {
    state.setIsTransitioning(true)
    
    // FIX: Safely check for existing blackout so we don't spawn a hundred of them
    let blackout = document.getElementById('blackout-screen')
    if (!blackout) {
      blackout = document.createElement('div')
      blackout.id = 'blackout-screen'
      Object.assign(blackout.style, {
        position: 'fixed', inset: '0', backgroundColor: '#020000', zIndex: '99999', opacity: '0', pointerEvents: 'all'
      })
      document.body.appendChild(blackout)
    }

    gsap.killTweensOf(blackout);
    gsap.to(blackout, {
      opacity: 1, duration: 1.0, ease: 'power2.inOut',
      onComplete: () => {
        if (state.mode === MODES.EXPLORE) exitExploreMode();
        state.setPhase(0)
        state.setMode(MODES.LANDING) // FIX: Reset state!
        
        const positions = getCameraPositions(state.isMobile)
        const target = positions[0]
        
        gsap.killTweensOf(worldState)
        worldState.cameraZ = target.z
        worldState.cameraY = target.y
        worldState.targetX = target.targetX
        worldState.targetY = target.targetY
        worldState.targetZ = target.targetZ
        worldState.cubeRotX = 0
        worldState.cubeRotY = 0
        worldState.cubeRotZ = 0

        gsap.to(blackout, {
          opacity: 0, duration: 1.2, delay: 0.3, ease: 'power2.inOut',
          onComplete: () => {
            blackout?.remove()
            state.setIsTransitioning(false)
          }
        })
      }
    })
    return
  }

  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode();

  const nextPhase = state.currentPhase + 1
  state.setPhase(nextPhase)
  animateCameraToPhase(nextPhase)
  
  transitionTimeout = setTimeout(() => {
    state.setIsTransitioning(false)
    if (nextPhase >= 1) enterExploreMode(); 
  }, 1200)
}

export const goBack = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning || state.currentPhase <= 0) return

  clearTransitionTimeout();
  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode();

  const prevPhase = state.currentPhase - 1
  state.setPhase(prevPhase)
  
  if (prevPhase === 0) state.setMode(MODES.LANDING); // FIX: Reset state!

  animateCameraToPhase(prevPhase)
  
  transitionTimeout = setTimeout(() => {
    state.setIsTransitioning(false)
    if (prevPhase >= 1) enterExploreMode(); 
  }, 1200)
}

export const jumpToPhase = (targetPhase: number): void => {
  const state = useExperience.getState()
  // FIX: Protect against invalid phase jumps
  if (targetPhase < 0 || targetPhase > MAX_PHASE || state.isTransitioning || targetPhase === state.currentPhase) return

  clearTransitionTimeout();
  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode();

  state.setPhase(targetPhase)
  if (targetPhase === 0) state.setMode(MODES.LANDING); // FIX: Reset state!

  animateCameraToPhase(targetPhase)
  
  transitionTimeout = setTimeout(() => {
    state.setIsTransitioning(false)
    if (targetPhase >= 1) enterExploreMode(); 
  }, 1200)
}

export const enterExploreMode = (): void => {
  const state = useExperience.getState()
  state.setMode(MODES.EXPLORE)
  
  if (state.currentPhase === 1) {
    const randomSpinX = (Math.random() > 0.5 ? 0.5 : -0.5) * (Math.PI * 0.25 + Math.random() * Math.PI);
    const randomSpinY = (Math.random() > 0.5 ? 0.5 : -0.5) * (Math.PI * 0.25 + Math.random() * Math.PI);

    const targetX = state.isMobile ? 0 : 1.5;
    const targetY = state.isMobile ? 1.5 : 0; 

    gsap.killTweensOf(worldState); // Safety first
    gsap.to(worldState, { 
        targetX: targetX, targetY: targetY, 
        cubeRotX: randomSpinX, cubeRotY: randomSpinY, cubeRotZ: (Math.random() - 0.5) * Math.PI * 0.5,
        duration: 1.5, ease: 'power3.inOut' 
    })
  }
}

export const exitExploreMode = (): void => {
  const state = useExperience.getState()
  state.setMode(MODES.TRAVERSAL)
  
  const positions = getCameraPositions(state.isMobile)
  const baseTarget = positions[state.currentPhase] || positions[0]

  gsap.killTweensOf(worldState); // Safety first
  gsap.to(worldState, { 
      targetX: baseTarget.targetX, targetY: baseTarget.targetY, 
      cubeRotX: 0, cubeRotY: 0, cubeRotZ: 0,
      duration: 1.0, ease: 'power3.inOut' 
  })
}

export const destroyCinematicController = (): void => { 
  gsap.killTweensOf(worldState) 
  clearTransitionTimeout();
}