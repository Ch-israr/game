"use client";

// Haptic feedback for mobile devices using the Vibration API.
// Falls back to no-op on devices without vibration support (desktop, iOS Safari).

export type HapticPattern =
  | "putt" // light tap on shot
  | "wall" // medium tap on wall hit
  | "bumper" // sharp tap on bumper hit
  | "sink" // success pattern on hole sink
  | "water" // error pattern on water hit
  | "warp"; // double tap on teleport

const PATTERNS: Record<HapticPattern, number | number[]> = {
  putt: 15,
  wall: 30,
  bumper: [10, 20, 10],
  sink: [30, 40, 30, 40, 60],
  water: [40, 30, 40],
  warp: [10, 30, 10],
};

export function haptic(pattern: HapticPattern): void {
  if (typeof window === "undefined") return;
  if (typeof navigator === "undefined") return;
  // navigator.vibrate is the standard API (Chrome/Android). iOS Safari doesn't
  // support it, so we silently no-op there.
  const vibrate = (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate;
  if (typeof vibrate !== "function") return;
  try {
    vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore — some browsers throw if not allowed */
  }
}
