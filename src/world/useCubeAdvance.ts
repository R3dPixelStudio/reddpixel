import { useCallback, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

/**
 * Advances the phase on ANY complete press-and-release on the cube --
 * a clean tap or a drag/swipe, it doesn't matter.
 *
 * Why the old `onPointerUp`-on-the-mesh approach missed drags:
 * R3F re-raycasts on release, so onPointerUp only fires if the ray is
 * STILL hitting this exact mesh at the moment the finger lifts. Any
 * drag that moves off the cube's on-screen footprint before release
 * (which is most drags) never hits the mesh again, so the handler
 * never fires at all -- it looks like "drag does nothing".
 *
 * Fix: capture the gesture on pointerdown, then listen on `window`
 * for the up/cancel so it fires no matter where the pointer ends up.
 */
export function useCubeAdvance(onTrigger: () => void, enabled: boolean) {
  const active = useRef(false)

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!enabled) return
      e.stopPropagation()
      active.current = true

      const onUp = () => {
        if (active.current) onTrigger()
        active.current = false
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }

      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [enabled, onTrigger]
  )

  return { onPointerDown }
}
