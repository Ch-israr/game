"use client";

// Records the ball's path during a shot for replay on the level-complete modal.
// Module-level singleton so the Ball component can write and the LevelCompleteModal
// can read without prop drilling.

export interface ShotPath {
  points: [number, number, number][]; // [x, y, z] positions over time
  strokes: number; // which stroke this was (1-indexed)
}

// All shots for the current hole. Reset when the hole changes.
let currentHoleShots: ShotPath[] = [];
let currentShot: ShotPath | null = null;
let recording = false;

export function startShotRecording(strokeNumber: number): void {
  currentShot = { points: [], strokes: strokeNumber };
  recording = true;
}

export function recordPathPoint(x: number, y: number, z: number): void {
  if (!recording || !currentShot) return;
  // Throttle: only record if moved > 0.1 units from last point
  const last = currentShot.points[currentShot.points.length - 1];
  if (last) {
    const dx = x - last[0];
    const dy = y - last[1];
    const dz = z - last[2];
    if (dx * dx + dy * dy + dz * dz < 0.01) return;
  }
  currentShot.points.push([x, y, z]);
}

export function endShotRecording(): void {
  if (currentShot && currentShot.points.length > 1) {
    currentHoleShots.push(currentShot);
  }
  currentShot = null;
  recording = false;
}

export function getHoleShots(): ShotPath[] {
  return currentHoleShots;
}

export function clearHoleShots(): void {
  currentHoleShots = [];
  currentShot = null;
  recording = false;
}
