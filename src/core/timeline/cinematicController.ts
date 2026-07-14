import gsap from 'gsap'
import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'

export const FIRST_INTERIOR_PHASE = 1;
export const MAX_PHASE = 3;

const getCameraPositions = (isMobile: boolean) => [
  { z: isMobile ? 18.0 : 14.0, y: isMobile ? 1.5 : 1.5, targetX: 0, targetY: 0, targetZ: 0 }, 
  
  // THE FIX: Phase 1 is perfectly centered! No drifting!
  { z: isMobile ? 9.0 : 4.5,   y: isMobile ? 1.5 : 0.5, targetX: 0, targetY: 0, targetZ: 0 }, 
  
  { z: -4.0, y: 0.0, targetX: 0, targetY: 0, targetZ: -20.0 }, 
  { z: -8.0, y: 0.0, targetX: 0, targetY: 0, targetZ: -20.0 }  
]
const animateCameraToPhase = (phaseIndex: number) => {
  const state = useExperience.getState()
  const positions = getCameraPositions(state.isMobile)
  const target = positions[phaseIndex] || positions[0]
  
  gsap.killTweensOf(worldState, "cameraZ,cameraY,targetX,targetY,targetZ")
  gsap.to(worldState, {
    cameraZ: target.z, cameraY: target.y, 
    targetX: target.targetX, targetY: target.targetY, targetZ: target.targetZ, 
    duration: 1.2, ease: 'power3.inOut'
  })
}

export const goDeeper = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning) return

  // THE FIX: The Blackout Loop from Phase 3 back to Phase 0!
  if (state.currentPhase >= MAX_PHASE) {
    state.setIsTransitioning(true)
    
    // Summon the magical darkness
    const blackout = document.createElement('div')
    blackout.id = 'blackout-screen'
    Object.assign(blackout.style, {
      position: 'fixed', inset: '0', backgroundColor: '#020000', zIndex: '99999', opacity: '0', pointerEvents: 'all'
    })
    document.body.appendChild(blackout)

    // 1. Fade to black
    gsap.to(blackout, {
      opacity: 1, duration: 1.0, ease: 'power2.inOut',
      onComplete: () => {
        // 2. Under the hood reset (Teleport instantly!)
        if (state.mode === MODES.EXPLORE) exitExploreMode();
        state.setPhase(0)
        
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

        // 3. Fade back to reality
        gsap.to(blackout, {
          opacity: 0, duration: 1.2, delay: 0.3, ease: 'power2.inOut',
          onComplete: () => {
            blackout.remove()
            state.setIsTransitioning(false)
          }
        })
      }
    })
    return
  }

  // Normal Traversal Logic
  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode();

  const nextPhase = state.currentPhase + 1
  state.setPhase(nextPhase)
  animateCameraToPhase(nextPhase)
  
  setTimeout(() => {
    state.setIsTransitioning(false)
    if (nextPhase >= 1) enterExploreMode(); 
  }, 1200)
}

export const goBack = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning || state.currentPhase <= 0) return

  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode();

  const prevPhase = state.currentPhase - 1
  state.setPhase(prevPhase)
  animateCameraToPhase(prevPhase)
  
  setTimeout(() => {
    state.setIsTransitioning(false)
    if (prevPhase >= 1) enterExploreMode(); 
  }, 1200)
}

export const jumpToPhase = (targetPhase: number): void => {
  const state = useExperience.getState()
  if (state.isTransitioning || targetPhase === state.currentPhase) return

  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode();

  state.setPhase(targetPhase)
  animateCameraToPhase(targetPhase)
  
  setTimeout(() => {
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
  const baseTargetX = positions[state.currentPhase].targetX
  const baseTargetY = positions[state.currentPhase].targetY

  gsap.to(worldState, { 
      targetX: baseTargetX, targetY: baseTargetY, 
      cubeRotX: 0, cubeRotY: 0, cubeRotZ: 0,
      duration: 1.0, ease: 'power3.inOut' 
  })
}

export const destroyCinematicController = (): void => { gsap.killTweensOf(worldState) }