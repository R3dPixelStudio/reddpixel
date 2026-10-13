import { introComposition } from './introComposition'

interface WorldState {
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    targetX: number;
    targetY: number;
    targetZ: number;
    cubeRotX: number;
    cubeRotY: number;
    cubeRotZ: number;
    cubeX: number;
    particleRush: number;
    aboutFocus: number;
  }
  
  export const worldState: WorldState = {
    ...introComposition(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches),
    cubeX: 0,
    particleRush: 0,
    aboutFocus: 0,
  }
