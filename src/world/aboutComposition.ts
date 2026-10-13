export function aboutComposition(mobile: boolean) {
  return {
    cameraX: -6,
    cameraY: mobile ? 1.4 : 1.15,
    cameraZ: mobile ? 8.4 : 5.7,
    targetX: -7.3,
    targetY: mobile ? .5 : .25,
    targetZ: 0,
  }
}

// Updated only by the About frame's ResizeObserver, never by the render loop.
export const aboutSourceAnchor = { left: -.9, right: .9, top: .88, bottom: -.72, revision: 0 }
