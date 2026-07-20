import gsap from 'gsap'
import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'

export const FIRST_INTERIOR_PHASE = 1
export const MAX_PHASE = 3

const TRANSITION_DURATION = 1.2
const CAMERA_TWEEN_PROPERTIES = 'cameraX,cameraY,cameraZ,targetX,targetY,targetZ'
const EXPLORE_TWEEN_PROPERTIES = 'targetX,targetY,cubeRotX,cubeRotY,cubeRotZ'

let cameraTween: gsap.core.Tween | null = null
let exploreTween: gsap.core.Tween | null = null
let blackoutTween: gsap.core.Tween | null = null
let blackoutElement: HTMLDivElement | null = null

const getCameraPositions = (isMobile: boolean) => [
  { z: isMobile ? 14 : 14, y: 1.5, targetX: 0, targetY: 0, targetZ: 0 },
  { z: isMobile ? 8 : 4.5, y: isMobile ? 1.5 : 0.5, targetX: 0, targetY: 0, targetZ: 0 },
  { z: -4, y: 0, targetX: 0, targetY: 0, targetZ: -20 },
  { z: -8, y: 0, targetX: 0, targetY: 0, targetZ: -20 },
]

// ============================================================================
// THE ORACLE'S TARGET: Control the spinning cube's position in Phase 1
// ============================================================================
const getAboutExploreTarget = (isMobile: boolean) => ({
  // EDIT MOBILE X HERE: 0 is center. Positive moves cube left, negative moves right.
  x: isMobile ? 1.5 : 1.5, 
  // EDIT MOBILE Y HERE: 0 is center. Positive moves cube down, negative moves up.
  y: isMobile ? 0.0 : 0.0  
})

const killCameraTween = () => {
  cameraTween?.kill()
  cameraTween = null
  gsap.killTweensOf(worldState, CAMERA_TWEEN_PROPERTIES)
}

const killExploreTween = () => {
  exploreTween?.kill()
  exploreTween = null
  gsap.killTweensOf(worldState, EXPLORE_TWEEN_PROPERTIES)
}

const finishTransition = (phase: number) => {
  const state = useExperience.getState()
  if (state.currentPhase !== phase) return

  state.setIsTransitioning(false)
  if (phase >= FIRST_INTERIOR_PHASE) enterExploreMode()
}

const animateCameraToPhase = (phaseIndex: number, onComplete?: () => void) => {
  const state = useExperience.getState()
  const positions = getCameraPositions(state.isMobile)
  const target = positions[phaseIndex] ?? positions[0]

  killCameraTween()

  const tween = gsap.to(worldState, {
    cameraX: 0,
    cameraY: target.y,
    cameraZ: target.z,
    targetX: target.targetX,
    targetY: target.targetY,
    targetZ: target.targetZ,
    duration: TRANSITION_DURATION,
    ease: 'power3.inOut',
    onComplete: () => {
      if (cameraTween === tween) cameraTween = null
      onComplete?.()
    },
  })

  cameraTween = tween
}

export const syncCameraToLayout = (): void => {
  const state = useExperience.getState()
  if (state.currentPhase > 1) return

  const target = getCameraPositions(state.isMobile)[state.currentPhase]
  const isAboutExplore = state.currentPhase === 1 && state.mode === MODES.EXPLORE
  
  // Fetch our new combined X and Y targets
  const aboutExploreTarget = getAboutExploreTarget(state.isMobile)

  if (!state.isCubeReady || blackoutElement) {
    killCameraTween()
    Object.assign(worldState, {
      cameraX: 0,
      cameraY: target.y,
      cameraZ: target.z,
      targetX: isAboutExplore ? aboutExploreTarget.x : target.targetX,
      targetY: isAboutExplore ? aboutExploreTarget.y : target.targetY, // Updated to use dynamic Y
      targetZ: target.targetZ,
    })
    return
  }

  if (state.isTransitioning) {
    animateCameraToPhase(state.currentPhase, () => finishTransition(state.currentPhase))
    return
  }

  killCameraTween()

  const tween = gsap.to(worldState, {
    cameraX: 0,
    cameraY: target.y,
    cameraZ: target.z,
    targetX: isAboutExplore ? aboutExploreTarget.x : target.targetX,
    targetY: isAboutExplore ? aboutExploreTarget.y : target.targetY, // Updated to use dynamic Y
    targetZ: target.targetZ,
    duration: 0.65,
    ease: 'power3.inOut',
    onComplete: () => {
      if (cameraTween === tween) cameraTween = null
    },
  })

  cameraTween = tween
}

const removeBlackout = () => {
  blackoutTween?.kill()
  blackoutTween = null
  gsap.killTweensOf(blackoutElement)
  blackoutElement?.remove()
  blackoutElement = null
}

const resetToLanding = () => {
  const state = useExperience.getState()
  const landing = getCameraPositions(state.isMobile)[0]

  killCameraTween()
  killExploreTween()

  state.setPhase(0)
  state.setMode(MODES.LANDING)

  Object.assign(worldState, {
    cameraX: 0,
    cameraY: landing.y,
    cameraZ: landing.z,
    targetX: landing.targetX,
    targetY: landing.targetY,
    targetZ: landing.targetZ,
    cubeRotX: 0,
    cubeRotY: 0,
    cubeRotZ: 0,
  })
}

const cycleToLanding = () => {
  const state = useExperience.getState()
  state.setIsTransitioning(true)

  if (!blackoutElement) {
    blackoutElement = document.createElement('div')
    blackoutElement.id = 'blackout-screen'
    Object.assign(blackoutElement.style, {
      position: 'fixed',
      inset: '0',
      backgroundColor: '#020000',
      zIndex: '99999',
      opacity: '0',
      pointerEvents: 'all',
    })
    document.body.appendChild(blackoutElement)
  }

  const blackout = blackoutElement
  gsap.killTweensOf(blackout)

  blackoutTween = gsap.to(blackout, {
    opacity: 1,
    duration: 1,
    ease: 'power2.inOut',
    onComplete: () => {
      resetToLanding()

      blackoutTween = gsap.to(blackout, {
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          removeBlackout()
          useExperience.getState().setIsTransitioning(false)
        },
      })
    },
  })
}

export const goDeeper = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning) return

  if (state.currentPhase >= MAX_PHASE) {
    cycleToLanding()
    return
  }

  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode()

  const nextPhase = state.currentPhase + 1
  state.setPhase(nextPhase)
  animateCameraToPhase(nextPhase, () => finishTransition(nextPhase))
}

export const goBack = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning || state.currentPhase <= 0) return

  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode()

  const previousPhase = state.currentPhase - 1
  state.setPhase(previousPhase)
  if (previousPhase === 0) state.setMode(MODES.LANDING)

  animateCameraToPhase(previousPhase, () => finishTransition(previousPhase))
}

export const jumpToPhase = (targetPhase: number): void => {
  const state = useExperience.getState()
  const targetIsInvalid = targetPhase < 0 || targetPhase > MAX_PHASE

  if (targetIsInvalid || state.isTransitioning || targetPhase === state.currentPhase) return

  state.setIsTransitioning(true)
  if (state.mode === MODES.EXPLORE) exitExploreMode()

  state.setPhase(targetPhase)
  if (targetPhase === 0) state.setMode(MODES.LANDING)

  animateCameraToPhase(targetPhase, () => finishTransition(targetPhase))
}

export const enterExploreMode = (): void => {
  const state = useExperience.getState()
  state.setMode(MODES.EXPLORE)

  if (state.currentPhase !== 1) return

  const randomSpinX = (Math.random() > 0.5 ? 0.5 : -0.5) * (Math.PI * 0.25 + Math.random() * Math.PI)
  const randomSpinY = (Math.random() > 0.5 ? 0.5 : -0.5) * (Math.PI * 0.25 + Math.random() * Math.PI)

  // Fetch our new combined X and Y targets
  const exploreTarget = getAboutExploreTarget(state.isMobile)

  killExploreTween()
  exploreTween = gsap.to(worldState, {
    targetX: exploreTarget.x,
    targetY: exploreTarget.y, // No longer hardcoded to 0!
    cubeRotX: randomSpinX,
    cubeRotY: randomSpinY,
    cubeRotZ: (Math.random() - 0.5) * Math.PI * 0.5,
    duration: 1.5,
    ease: 'power3.inOut',
    onComplete: () => {
      exploreTween = null
    },
  })
}

export const exitExploreMode = (): void => {
  const state = useExperience.getState()
  state.setMode(MODES.TRAVERSAL)

  const positions = getCameraPositions(state.isMobile)
  const baseTarget = positions[state.currentPhase] ?? positions[0]

  killExploreTween()
  exploreTween = gsap.to(worldState, {
    targetX: baseTarget.targetX,
    targetY: baseTarget.targetY,
    cubeRotX: 0,
    cubeRotY: 0,
    cubeRotZ: 0,
    duration: 1,
    ease: 'power3.inOut',
    onComplete: () => {
      exploreTween = null
    },
  })
}

export const destroyCinematicController = (): void => {
  killCameraTween()
  killExploreTween()
  removeBlackout()
}