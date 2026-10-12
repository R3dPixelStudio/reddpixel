export const cubeInteraction = { rotationX: 0, rotationY: 0, hitPointerId: -1, dragging: false }

// Bounded angular speed gives a large object weight, even after a fast swipe.
export function weightedRotation(current: number, target: number, delta: number) {
  const dt = Math.min(delta, .05)
  const step = (target - current) * (1 - Math.exp(-4 * dt))
  return current + Math.max(-1.2 * dt, Math.min(1.2 * dt, step))
}

export const TAP_SLOP = 10

export function isCubeTap(maxDistanceSquared: number, cancelled = false) {
  return !cancelled && maxDistanceSquared <= TAP_SLOP * TAP_SLOP
}

// A side-two cube stays inside this sphere at every rotation.
export const CUBE_CLEARANCE = Math.sqrt(3) + .05

export function innerWorldReveal(cameraZ: number) {
  const t = Math.min(1, Math.max(0, (-cameraZ - CUBE_CLEARANCE) / .9))
  return t * t * (3 - 2 * t)
}

export function neutralRotation(angle: number) {
  return ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
}
