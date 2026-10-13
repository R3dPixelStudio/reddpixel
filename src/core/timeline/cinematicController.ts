import gsap from 'gsap'
import { useExperience, MODES } from '../../stores/useExperience'
import { worldState } from '../../world/worldState'
import { introComposition, INTRO_ROTATION } from '../../world/introComposition'
import { aboutComposition } from '../../world/aboutComposition'

export const FIRST_INTERIOR_PHASE = 1
export const MAX_PHASE = 3

const TRANSITION_DURATION = 1.85
const duration = (seconds: number) => useExperience.getState().reducedMotion ? 0.01 : seconds
const CAMERA_TWEEN_PROPERTIES = 'cameraX,cameraY,cameraZ,targetX,targetY,targetZ,cubeX,particleRush,aboutFocus'
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

const getCameraPositions = (isMobile: boolean) => [
  introComposition(isMobile),
  aboutComposition(isMobile),
  { cameraX: 0, cameraY: 0, cameraZ: -4, targetX: 0, targetY: 0, targetZ: -20 },
  { cameraX: 0, cameraY: 0, cameraZ: -8, targetX: 0, targetY: 0, targetZ: -20 },
]

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
  const target = getCameraPositions(state.isMobile)[phaseIndex]
  const intro = introComposition(state.isMobile)
  killCameraTween()
  const travel = gsap.timeline({ onComplete: () => {
    if (cameraTween !== travel) return
    cameraTween = null
    onComplete?.()
  } })
  cameraTween = travel
  const revealAbout = () => {
    const current = useExperience.getState()
    if (cameraTween === travel && current.currentPhase === 1) current.setMode(MODES.EXPLORE)
  }
  if (state.reducedMotion) {
    travel.to(worldState, { ...target, ...INTRO_ROTATION, cubeX: 0, particleRush: 0, aboutFocus: phaseIndex === 1 ? 1 : 0, duration: .01 })
  } else if (phaseIndex === 1 && worldState.aboutFocus > .01 && worldState.cameraZ > 1.45) {
    // Resizes and interrupted pans continue toward the source without retracing the cube.
    travel.to(worldState, { ...target, aboutFocus: 1, particleRush: 0, cubeX: 0, duration: .65, ease: 'sine.inOut' })
      .call(revealAbout, [], .2)
  } else if (phaseIndex === 1) {
    // Come outside first when returning from the interior. The cube never translates.
    const outsideAt = worldState.cameraZ < 1.45 ? 1.3 : 0
    if (outsideAt) travel.to(worldState, { ...intro, cubeX: 0, aboutFocus: 0, particleRush: 0, duration: outsideAt, ease: 'sine.inOut' }, 0)
    // First show the previously hidden side, then follow the flow to its source.
    travel.to(worldState, { cameraX: -1.15, cameraY: intro.cameraY, cameraZ: intro.cameraZ, targetX: 0, targetY: .1, targetZ: 0, ...INTRO_ROTATION, cubeX: 0, duration: .55, ease: 'sine.inOut' }, outsideAt)
      .to(worldState, { ...target, aboutFocus: 1, duration: 1.3, ease: 'power2.inOut' }, outsideAt + .55)
      .to(worldState, { particleRush: .8, duration: .4, ease: 'sine.out' }, outsideAt + .3)
      .to(worldState, { particleRush: 0, duration: 1.05, ease: 'sine.inOut' }, outsideAt + .7)
      .call(revealAbout, [], outsideAt + 1.1)
  } else if (phaseIndex > 1 && (Math.abs(worldState.cameraX) > .1 || worldState.aboutFocus > .01)) {
    // Return to the glass before crossing it; preserve the interior's geometric reveal.
    travel.to(worldState, { cameraX: 0, cameraY: state.isMobile ? 1.1 : .7, cameraZ: state.isMobile ? 6.6 : 4.4, targetX: 0, targetY: 0, targetZ: 0, ...INTRO_ROTATION, cubeX: 0, aboutFocus: 0, particleRush: 0, duration: 1.25, ease: 'sine.inOut' }, 0)
      .to(worldState, { ...target, duration: TRANSITION_DURATION, ease: 'sine.inOut' }, 1.25)
  } else {
    travel.to(worldState, { ...target, ...INTRO_ROTATION, cubeX: 0, aboutFocus: 0, particleRush: 0, duration: TRANSITION_DURATION, ease: 'sine.inOut' })
  }
  keepSceneMoving(travel.duration() + 2)
}

export const syncCameraToLayout = (): void => {
  const state = useExperience.getState()
  // Startup navigation is resumed when the scene is ready, from its visible origin.
  if (!state.isCubeReady) {
    Object.assign(worldState, introComposition(state.isMobile), { cubeX: 0, particleRush: 0, aboutFocus: 0 })
    return
  }
  if (state.currentPhase > 1) return

  const target = getCameraPositions(state.isMobile)[state.currentPhase]

  if (blackoutElement) {
    killCameraTween()
    Object.assign(worldState, {
      ...target,
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
    ...target,
    cubeX: 0,
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
    ...landing,
    ...INTRO_ROTATION,
    cubeX: 0,
    particleRush: 0,
    aboutFocus: 0,
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
