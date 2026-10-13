// The cube stays at the origin; About visits the particle source to its left.
export const INTRO_ROTATION = { cubeRotX: -.12, cubeRotY: -.85, cubeRotZ: -.17 }

export function introComposition(mobile: boolean) {
  return {
    cameraX: 0, cameraY: mobile ? 1.4 : 1.15, cameraZ: mobile ? 8.4 : 5.7,
    targetX: mobile ? .85 : 1.8, targetY: mobile ? -.8 : -.48, targetZ: 0,
    ...INTRO_ROTATION,
  }
}

