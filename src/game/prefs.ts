"use client";

import type { Difficulty } from "./difficulty";

// Persisted user preferences (mute, music, difficulty, camera view, volumes).
// Loaded once on first client render; saved whenever they change.

const PREFS_KEY = "mg_prefs";

export interface UserPrefs {
  muted: boolean;
  musicOn: boolean;
  difficulty: Difficulty;
  cameraView: "follow" | "topdown";
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
}

const DEFAULT_PREFS: UserPrefs = {
  muted: false,
  musicOn: true,
  difficulty: "normal",
  cameraView: "follow",
  sfxVolume: 0.5,
  musicVolume: 0.5,
};

export function loadPrefs(): UserPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    return {
      muted: typeof parsed.muted === "boolean" ? parsed.muted : DEFAULT_PREFS.muted,
      musicOn: typeof parsed.musicOn === "boolean" ? parsed.musicOn : DEFAULT_PREFS.musicOn,
      difficulty: parsed.difficulty ?? DEFAULT_PREFS.difficulty,
      cameraView: parsed.cameraView ?? DEFAULT_PREFS.cameraView,
      sfxVolume: typeof parsed.sfxVolume === "number" ? parsed.sfxVolume : DEFAULT_PREFS.sfxVolume,
      musicVolume: typeof parsed.musicVolume === "number" ? parsed.musicVolume : DEFAULT_PREFS.musicVolume,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: UserPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore storage errors */
  }
}
