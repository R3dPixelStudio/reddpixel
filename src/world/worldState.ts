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
  }
  
  export const worldState: WorldState = {
    cameraX: 0,
    cameraY: 1.5,  // STARTS HIGHER
    cameraZ: 14,   // STARTS FURTHER BACK
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    cubeRotX: 0,
    cubeRotY: 0,
    cubeRotZ: 0,
  }