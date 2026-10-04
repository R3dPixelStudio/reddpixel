export const cubeInteraction = { rotationX: 0, rotationY: 0, hitPointerId: -1 }

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
