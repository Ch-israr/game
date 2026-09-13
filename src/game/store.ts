"use client";

import { create } from "zustand";
import type { CourseDef, ScoreGrade } from "./types";
import { LEVELS } from "./levels";
import { setDifficulty, type Difficulty } from "./difficulty";
import { checkAchievements, type Achievement } from "./achievements";
import { loadPrefs, savePrefs } from "./prefs";
import { getSound } from "./sound";

export type Screen =
  | "menu"
  | "playing"
  | "level-complete"
  | "game-complete"
  | "leaderboard"
  | "level-select"
  | "achievements";
export type CameraView = "follow" | "topdown";

export interface HoleScore {
  levelId: number;
  levelName: string;
  strokes: number;
  par: number;
  grade: ScoreGrade;
}

interface GameState {
  screen: Screen;
  currentLevelIndex: number;
  strokes: number; // strokes on current hole
  totalStrokes: number; // across all completed holes
  ballState: "idle" | "aiming" | "moving" | "holed" | "sunk";
  results: HoleScore[]; // per-hole results

  // aiming (populated while aiming)
  aimAngle: number; // radians, direction ball will travel (in XZ plane)
  aimPower: number; // 0..1
  aimSpin: number; // -1..1, side spin for curved shots (Magnus effect)

  // view / audio prefs
  cameraView: CameraView;
  muted: boolean;
  musicOn: boolean;
  difficulty: Difficulty;
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
  dailyChallengeMode: boolean; // true when playing the daily challenge hole

  // transient feedback
  lastPenaltyReason: "water" | null;
  sinkAnim: number; // counter for sink animation trigger
  hitWaterThisHole: boolean; // tracked for water_survivor achievement
  pendingAchievements: Achievement[]; // queue shown as toasts
  tutorialStep: number; // -1 = not shown, 0..N = active step
  settingsOpen: boolean; // settings panel open

  // actions
  startGame: () => void;
  startLevel: (index: number) => void;
  startDailyChallenge: () => void;
  goToMenu: () => void;
  goToLeaderboard: () => void;
  goToLevelSelect: () => void;
  goToAchievements: () => void;
  setBallState: (s: GameState["ballState"]) => void;
  setAim: (angle: number, power: number, spin: number) => void;
  incrementStroke: () => void;
  resetHole: () => void;
  ballSunk: () => void;
  nextLevel: () => void;
  retryLevel: () => void;
  toggleCameraView: () => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  setDifficulty: (d: Difficulty) => void;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  markWaterHit: () => void;
  dismissAchievement: (id: string) => void;
  setTutorialStep: (step: number) => void;
  toggleSettings: () => void;
  resetProgress: () => void;
  initPrefs: () => void;
}

function gradeFromStrokes(strokes: number, par: number): ScoreGrade {
  if (strokes === 1) return "hole-in-one";
  const diff = strokes - par;
  if (diff <= -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double-bogey";
  return "over";
}

export const useGameStore = create<GameState>((set, get) => {
  // Note: prefs are NOT loaded here to avoid SSR/client hydration mismatch.
  // Use default values; `initPrefs()` is called from a client useEffect on mount.
  setDifficulty("normal");

  // Helper to persist current prefs whenever they change
  const persistPrefs = () => {
    const s = get();
    savePrefs({
      muted: s.muted,
      musicOn: s.musicOn,
      difficulty: s.difficulty,
      cameraView: s.cameraView,
      sfxVolume: s.sfxVolume,
      musicVolume: s.musicVolume,
    });
  };

  return {
  screen: "menu",
  currentLevelIndex: 0,
  strokes: 0,
  totalStrokes: 0,
  ballState: "idle",
  results: [],
  aimAngle: 0,
  aimPower: 0,
  aimSpin: 0,
  cameraView: "follow",
  muted: false,
  musicOn: true,
  difficulty: "normal",
  sfxVolume: 0.5,
  musicVolume: 0.5,
  dailyChallengeMode: false,
  lastPenaltyReason: null,
  sinkAnim: 0,
  hitWaterThisHole: false,
  pendingAchievements: [],
  tutorialStep: -1,
  settingsOpen: false,

  startGame: () => {
    setDifficulty(get().difficulty);
    // Show tutorial on first play (tracked in localStorage)
    let tutorialStep = -1;
    if (typeof window !== "undefined") {
      try {
        const seen = window.localStorage.getItem("mg_tutorial_done");
        if (!seen) {
          tutorialStep = 0;
          window.localStorage.setItem("mg_tutorial_done", "1");
        }
      } catch {
        /* ignore */
      }
    }
    set({
      screen: "playing",
      currentLevelIndex: 0,
      strokes: 0,
      totalStrokes: 0,
      ballState: "idle",
      results: [],
      aimAngle: 0,
      aimPower: 0,
      aimSpin: 0,
      dailyChallengeMode: false,
      lastPenaltyReason: null,
      tutorialStep,
    });
  },

  startLevel: (index: number) => {
    setDifficulty(get().difficulty);
    set({
      screen: "playing",
      currentLevelIndex: Math.max(0, Math.min(LEVELS.length - 1, index)),
      strokes: 0,
      totalStrokes: 0,
      ballState: "idle",
      results: [],
      aimAngle: 0,
      aimPower: 0,
      aimSpin: 0,
      dailyChallengeMode: false,
      lastPenaltyReason: null,
    });
  },

  startDailyChallenge: () => {
    setDifficulty(get().difficulty);
    // Pick a deterministic level based on the day of year so everyone plays
    // the same hole on the same day.
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const idx = dayOfYear % LEVELS.length;
    set({
      screen: "playing",
      currentLevelIndex: idx,
      strokes: 0,
      totalStrokes: 0,
      ballState: "idle",
      results: [],
      aimAngle: 0,
      aimPower: 0,
      aimSpin: 0,
      dailyChallengeMode: true,
      lastPenaltyReason: null,
    });
  },

  goToMenu: () =>
    set({ screen: "menu", strokes: 0, ballState: "idle", aimPower: 0 }),

  goToLeaderboard: () => set({ screen: "leaderboard" }),

  goToLevelSelect: () => set({ screen: "level-select" }),

  goToAchievements: () => set({ screen: "achievements" }),

  setBallState: (s) => set({ ballState: s }),

  setAim: (angle, power, spin) => set({ aimAngle: angle, aimPower: power, aimSpin: spin }),

  incrementStroke: () => set((st) => ({ strokes: st.strokes + 1 })),

  resetHole: () =>
    set({ strokes: 0, ballState: "idle", aimPower: 0, aimSpin: 0, hitWaterThisHole: false }),

  ballSunk: () => {
    const { strokes, currentLevelIndex, totalStrokes, results, hitWaterThisHole } = get();
    const course: CourseDef = LEVELS[currentLevelIndex] ?? LEVELS[0];
    const grade = gradeFromStrokes(strokes, course.par);
    const newResults: HoleScore[] = [
      ...results,
      { levelId: course.id, levelName: course.name, strokes, par: course.par, grade },
    ];
    const newTotal = totalStrokes + strokes;
    // Persist best-per-hole score to localStorage (client-side, safe)
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("mg_best_per_hole");
        const best: Record<number, number> = raw ? JSON.parse(raw) : {};
        const prev = best[course.id];
        if (prev === undefined || strokes < prev) {
          best[course.id] = strokes;
          window.localStorage.setItem("mg_best_per_hole", JSON.stringify(best));
        }
      } catch {
        /* ignore storage errors */
      }
    }
    // Check achievements
    const newlyUnlocked = checkAchievements({
      results: newResults,
      totalStrokes: newTotal,
      hitWaterThisHole,
    });
    set({
      ballState: "sunk",
      results: newResults,
      totalStrokes: newTotal,
      sinkAnim: get().sinkAnim + 1,
      pendingAchievements:
        newlyUnlocked.length > 0
          ? [...get().pendingAchievements, ...newlyUnlocked]
          : get().pendingAchievements,
      hitWaterThisHole: false,
    });
    // transition to level-complete screen shortly after sink animation
    setTimeout(() => {
      set({ screen: "level-complete" });
    }, 1400);
  },

  nextLevel: () => {
    const { currentLevelIndex, results, dailyChallengeMode } = get();
    // Daily challenge is a single hole — finish after one level.
    if (dailyChallengeMode) {
      set({ screen: "game-complete" });
      return;
    }
    if (currentLevelIndex + 1 >= LEVELS.length) {
      set({ screen: "game-complete" });
      return;
    }
    set({
      currentLevelIndex: currentLevelIndex + 1,
      strokes: 0,
      ballState: "idle",
      aimPower: 0,
      aimSpin: 0,
      aimAngle: 0,
      screen: "playing",
    });
    void results; // results retained
  },

  retryLevel: () =>
    set({
      strokes: 0,
      ballState: "idle",
      aimPower: 0,
      aimSpin: 0,
      aimAngle: 0,
      screen: "playing",
    }),

  toggleCameraView: () => {
    set((st) => ({ cameraView: st.cameraView === "follow" ? "topdown" : "follow" }));
    persistPrefs();
  },

  toggleMute: () => {
    set((st) => ({ muted: !st.muted }));
    persistPrefs();
  },

  toggleMusic: () => {
    set((st) => ({ musicOn: !st.musicOn }));
    persistPrefs();
  },

  setDifficulty: (d: Difficulty) => {
    setDifficulty(d);
    set({ difficulty: d });
    persistPrefs();
  },

  setSfxVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ sfxVolume: clamped });
    persistPrefs();
  },

  setMusicVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ musicVolume: clamped });
    persistPrefs();
  },

  markWaterHit: () => set({ hitWaterThisHole: true }),

  dismissAchievement: (id: string) =>
    set((st) => ({
      pendingAchievements: st.pendingAchievements.filter((a) => a.id !== id),
    })),

  setTutorialStep: (step: number) => set({ tutorialStep: step }),

  toggleSettings: () => set((st) => ({ settingsOpen: !st.settingsOpen })),

  resetProgress: () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("mg_achievements_unlocked");
        window.localStorage.removeItem("mg_best_per_hole");
        window.localStorage.removeItem("mg_tutorial_done");
      } catch {
        /* ignore */
      }
    }
    set({ pendingAchievements: [], tutorialStep: -1 });
  },

  initPrefs: () => {
    const prefs = loadPrefs();
    setDifficulty(prefs.difficulty);
    set({
      muted: prefs.muted,
      musicOn: prefs.musicOn,
      difficulty: prefs.difficulty,
      cameraView: prefs.cameraView,
      sfxVolume: prefs.sfxVolume,
      musicVolume: prefs.musicVolume,
    });
    // Sync sound engine volumes
    getSound().setSfxVolume(prefs.sfxVolume);
    getSound().setMusicVolume(prefs.musicVolume);
  },
  };
});

// Convenience selector helpers
export function useCurrentCourse(): CourseDef {
  return LEVELS[useGameStore.getState().currentLevelIndex] ?? LEVELS[0];
}

export function scoreGradeLabel(grade: ScoreGrade): string {
  switch (grade) {
    case "hole-in-one":
      return "Hole in One!";
    case "eagle":
      return "Eagle";
    case "birdie":
      return "Birdie";
    case "par":
      return "Par";
    case "bogey":
      return "Bogey";
    case "double-bogey":
      return "Double Bogey";
    case "over":
      return "Over Par";
  }
}
