// Mutable ball physics state. Kept in a ref (not Zustand) so per-frame
// physics updates don't trigger React re-renders.
export interface PhysicsBall {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number; // side spin (-1..1) for Magnus curve effect
  safeX: number; // last safe position (for water reset)
  safeY: number;
  safeZ: number;
  onPlatform: number | null;
  restFrames: number;
  justTeleported: boolean; // debounce so we don't instantly re-trigger
}

export function createBall(teePos: [number, number, number]): PhysicsBall {
  return {
    x: teePos[0],
    y: teePos[1] + 0.2,
    z: teePos[2],
    vx: 0,
    vy: 0,
    vz: 0,
    spin: 0,
    safeX: teePos[0],
    safeY: teePos[1] + 0.2,
    safeZ: teePos[2],
    onPlatform: null,
    restFrames: 0,
    justTeleported: false,
  };
}
