export const FLOOR_Y = -1.78
export const REFLECTION_LAYER = 30

// Exterior visuals stay visible through About and disappear only inside the cube.
export function outerSceneVisibility(cameraZ: number) {
  const t = Math.min(1, Math.max(0, (cameraZ + .25) / 1.7))
  return t * t * (3 - 2 * t)
}
