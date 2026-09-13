// Difficulty configuration — read by the physics engine to scale challenge.
// A module-level singleton so the hot physics loop doesn't need to thread
// a param through every call.

export type Difficulty = "easy" | "normal" | "hard";

export interface DifficultyConfig {
  // Multipliers applied to base physics constants
  frictionMul: number; // grass friction (higher = ball stops sooner)
  maxShotSpeedMul: number; // max putt power
  windForceMul: number; // wind zone strength
  bumperRestitutionMul: number; // how bouncy bumpers are
  // UI helpers
  label: string;
  description: string;
  accent: string;
  // par adjustment (added to each hole's par; negative = harder)
  parOffset: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultyConfig> = {
  easy: {
    frictionMul: 1.15, // ball stops a bit quicker (forgiving)
    maxShotSpeedMul: 1.1, // a touch more power available
    windForceMul: 0.6, // winds are gentler
    bumperRestitutionMul: 0.9,
    label: "Easy",
    description: "Gentler friction, lighter winds",
    accent: "#22c55e",
    parOffset: 1, // par +1 (more forgiving target)
  },
  normal: {
    frictionMul: 1.0,
    maxShotSpeedMul: 1.0,
    windForceMul: 1.0,
    bumperRestitutionMul: 1.0,
    label: "Normal",
    description: "Balanced challenge",
    accent: "#3b82f6",
    parOffset: 0,
  },
  hard: {
    frictionMul: 0.82, // ball rolls further (harder to stop near hole)
    maxShotSpeedMul: 0.95,
    windForceMul: 1.4, // winds are fierce
    bumperRestitutionMul: 1.15,
    label: "Hard",
    description: "Slick greens, strong winds",
    accent: "#ef4444",
    parOffset: -1, // par -1 (tighter target)
  },
};

let current: Difficulty = "normal";

export function setDifficulty(d: Difficulty) {
  current = d;
}
export function getDifficulty(): Difficulty {
  return current;
}
export function getDifficultyConfig(): DifficultyConfig {
  return DIFFICULTY[current];
}
