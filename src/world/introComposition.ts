// The cube stays at the origin: traversal and the interior reveal share that space.
export const INTRO_ROTATION = { cubeRotX: -.12, cubeRotY: -.85, cubeRotZ: -.17 }

export function introComposition(mobile: boolean) {
  return {
    cameraX: 0, cameraY: mobile ? 1.4 : 1.15, cameraZ: mobile ? 8.4 : 5.7,
    targetX: mobile ? .85 : 1.8, targetY: mobile ? -.8 : -.2, targetZ: 0,
    ...INTRO_ROTATION,
  }
}

