import gsap from 'gsap'
import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'
import { introComposition, INTRO_ROTATION } from '../../world/introComposition'

export const FIRST_INTERIOR_PHASE = 1
export const MAX_PHASE = 3

const TRANSITION_DURATION = 1.85
const duration = (seconds: number) => useExperience.getState().reducedMotion ? 0.01 : seconds
const CAMERA_TWEEN_PROPERTIES = 'cameraX,cameraY,cameraZ,targetX,targetY,targetZ,cubeX,particleRush,aboutQuiet'
const EXPLORE_TWEEN_PROPERTIES = 'cubeRotX,cubeRotY,cubeRotZ'

let cameraTween: gsap.core.Animation | null = null
let blackoutTween: gsap.core.Tween | null = null
let blackoutElement: HTMLDivElement | null = null
let settleTween: gsap.core.Tween | null = null

// Keep rendered frames alive until the world tweens and shader fades settle.
const keepSceneMoving = (seconds: number) => {
  settleTween?.kill()
  useExperience.getState().setSceneSettling(true)
  settleTween = gsap.delayedCall(useExperience.getState().reducedMotion ? .18 : seconds, () => {
    settleTween = null
    useExperience.getState().setSceneSettling(false)
  })
}

const getCameraPositions = (isMobile: boolean) => {
  const intro = introComposition(isMobile)
  return [
    { z: intro.cameraZ, y: intro.cameraY, targetX: intro.targetX, targetY: intro.targetY, targetZ: 0 },
    { z: isMobile ? 6.6 : 4.4, y: isMobile ? 1.1 : 0.7, targetX: 0, targetY: 0, targetZ: 0 },
    { z: -4, y: 0, targetX: 0, targetY: 0, targetZ: -20 },
    { z: -8, y: 0, targetX: 0, targetY: 0, targetZ: -20 },
  ]
}

const aboutCubeX = (mobile: boolean) => mobile ? -7 : -9

const killCameraTween = () => {
  cameraTween?.kill()
  cameraTween = null
  gsap.killTweensOf(worldState, CAMERA_TWEEN_PROPERTIES)
}

const killExploreTween = () => {
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

  const cameraTarget = {
    cameraX: 0,
    cameraY: target.y,
    cameraZ: target.z,
    targetX: target.targetX,
    targetY: target.targetY,
    targetZ: target.targetZ,
  }
  const travel = gsap.timeline({
    onComplete: () => {
      if (cameraTween === travel) cameraTween = null
      onComplete?.()
    },
  })
  cameraTween = travel
  if (state.reducedMotion) {
    travel.to(worldState, { ...cameraTarget, ...(phaseIndex === 1 ? { cubeRotX: .18, cubeRotY: -1.9, cubeRotZ: -.08 } : INTRO_ROTATION), cubeX: phaseIndex === 1 ? aboutCubeX(state.isMobile) : 0, particleRush: 0, aboutQuiet: phaseIndex === 1 ? 1 : 0, duration: .01 })
  } else if (phaseIndex === 1) {
    // Returning from the inner world first brings the camera outside the glass.
    const outsideAt = worldState.cameraZ < 1.45 ? 1.35 : 0
    if (outsideAt) travel.to(worldState, { ...cameraTarget, cubeX: 0, ...INTRO_ROTATION, duration: outsideAt, ease: 'sine.inOut' }, 0)
    travel.to(worldState, { ...cameraTarget, cubeX: aboutCubeX(state.isMobile), cubeRotX: .18, cubeRotY: -1.9, cubeRotZ: -.08, duration: 1.45, ease: 'power2.inOut' }, outsideAt)
      .to(worldState, { particleRush: 1, duration: .3, ease: 'power2.out' }, outsideAt)
      .to(worldState, { particleRush: 0, duration: .85, ease: 'sine.inOut' }, outsideAt + .3)
      .to(worldState, { aboutQuiet: 1, duration: .55, ease: 'sine.inOut' }, outsideAt + .9)
  } else {
    // A shifted cube must be seated in the camera's path before the dive starts.
    const returnAt = phaseIndex > 1 && Math.abs(worldState.cubeX) > .01 ? 1.2 : 0
    if (returnAt) travel.to(worldState, { cubeX: 0, ...INTRO_ROTATION, aboutQuiet: 0, particleRush: 0, targetX: 0, targetY: 0, targetZ: 0, duration: returnAt, ease: 'power2.inOut' }, 0)
    travel.to(worldState, { ...cameraTarget, cubeX: 0, ...INTRO_ROTATION, particleRush: 0, aboutQuiet: 0, duration: TRANSITION_DURATION, ease: 'sine.inOut' }, returnAt)
  }
  keepSceneMoving(travel.duration() + 2)
}

export const syncCameraToLayout = (): void => {
  const state = useExperience.getState()
  // Startup navigation is resumed when the scene is ready, from its visible origin.
  if (!state.isCubeReady) {
    Object.assign(worldState, introComposition(state.isMobile), { cubeX: 0, particleRush: 0, aboutQuiet: 0 })
    return
  }
  if (state.currentPhase > 1) return

  const target = getCameraPositions(state.isMobile)[state.currentPhase]

  if (blackoutElement) {
    killCameraTween()
    Object.assign(worldState, {
      cameraX: 0,
      cameraY: target.y,
      cameraZ: target.z,
      targetX: target.targetX,
      targetY: target.targetY,
      targetZ: target.targetZ,
    })
    return
  }

  if (state.isTransitioning) {
    animateCameraToPhase(state.currentPhase, () => finishTransition(state.currentPhase))
    return
  }

  killCameraTween()

  keepSceneMoving(2)
  const tween = gsap.to(worldState, {
    cameraX: 0,
    cameraY: target.y,
    cameraZ: target.z,
    targetX: target.targetX,
    targetY: target.targetY,
    targetZ: target.targetZ,
    cubeX: state.currentPhase === 1 ? aboutCubeX(state.isMobile) : 0,
    duration: duration(0.65),
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
  if (blackoutElement) gsap.killTweensOf(blackoutElement)
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
    ...INTRO_ROTATION,
    cubeX: 0,
    particleRush: 0,
    aboutQuiet: 0,
  })
}

const cycleToLanding = () => {
  const state = useExperience.getState()
  if (state.reducedMotion) {
    resetToLanding()
    state.setIsTransitioning(false)
    return
  }
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

  jumpToPhase(state.currentPhase + 1)
}

export const goBack = (): void => {
  const state = useExperience.getState()
  if (state.isTransitioning || state.currentPhase <= 0) return

  jumpToPhase(state.currentPhase - 1)
}

export const jumpToPhase = (targetPhase: number): void => {
  const state = useExperience.getState()
  const targetIsInvalid = !Number.isInteger(targetPhase) || targetPhase < 0 || targetPhase > MAX_PHASE

  const isSettledAtTarget = targetPhase === state.currentPhase && !state.isTransitioning &&
    (targetPhase === 0 ? state.mode === MODES.LANDING : state.mode === MODES.EXPLORE)
  if (targetIsInvalid || isSettledAtTarget) return
  removeBlackout()
  killCameraTween()
  killExploreTween()

  state.setIsTransitioning(true)
  if (state.isCubeReady && state.mode === MODES.EXPLORE) exitExploreMode()

  state.setPhase(targetPhase)
  state.setMode(targetPhase === 0 ? MODES.LANDING : MODES.TRAVERSAL)

  // Keep the latest destination pending; no invisible tweens during shader compilation.
  if (!state.isCubeReady) return

  animateCameraToPhase(targetPhase, () => finishTransition(targetPhase))
}

export const resumePendingPhase = (): void => {
  const state = useExperience.getState()
  if (state.isCubeReady && state.isTransitioning) jumpToPhase(state.currentPhase)
}

export const enterExploreMode = (): void => {
  keepSceneMoving(2)
  useExperience.getState().setMode(MODES.EXPLORE)
}

export const exitExploreMode = (): void => {
  useExperience.getState().setMode(MODES.TRAVERSAL)
  killExploreTween()
}

export const destroyCinematicController = (): void => {
  settleTween?.kill()
  settleTween = null
  useExperience.getState().setSceneSettling(false)
  killCameraTween()
  killExploreTween()
  removeBlackout()
  useExperience.getState().setIsTransitioning(false)
}
