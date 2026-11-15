// Achievement definitions + unlock logic. Achievements persist in localStorage.
import type { HoleScore } from "./store";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji for simplicity
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_sink", name: "First Sink", description: "Sink your first putt", icon: "🏌️" },
  { id: "hole_in_one", name: "Hole in One!", description: "Sink a putt in a single stroke", icon: "🏆" },
  { id: "eagle", name: "Eagle Eye", description: "Score an Eagle (2 under par)", icon: "🦅" },
  { id: "birdie", name: "Birdie", description: "Score a Birdie (1 under par)", icon: "🐦" },
  { id: "three_birdies", name: "Birdie Streak", description: "Score 3 birdies or better in one round", icon: "🔥" },
  { id: "all_par", name: "Course Pro", description: "Finish all 17 holes at par or better", icon: "⛳" },
  { id: "sub_30", name: "Speed Golfer", description: "Complete all 17 holes in under 57 strokes", icon: "⚡" },
  { id: "water_survivor", name: "Splash Survivor", description: "Hit water but still finish the hole", icon: "🌊" },
  { id: "halfway", name: "Halfway There", description: "Complete 6 holes in one round", icon: "🎯" },
  { id: "finisher", name: "Course Finisher", description: "Complete all 17 holes", icon: "🏁" },
];

const STORAGE_KEY = "mg_achievements_unlocked";

export function getUnlockedAchievements(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveUnlocked(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export interface AchievementContext {
  results: HoleScore[]; // completed holes this round
  totalStrokes: number;
  hitWaterThisHole: boolean;
}

// Check for newly-unlocked achievements given the context. Returns the list of
// achievements that were *just* unlocked (so the UI can toast them).
export function checkAchievements(ctx: AchievementContext): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const newly: Achievement[] = [];
  const grant = (a: Achievement) => {
    if (!unlocked.has(a.id)) {
      unlocked.add(a.id);
      newly.push(a);
    }
  };

  const completedCount = ctx.results.length;
  const birdiesOrBetter = ctx.results.filter(
    (r) => r.strokes < r.par
  ).length;
  const allParOrBetter =
    completedCount >= 17 && ctx.results.every((r) => r.strokes <= r.par);
  const lastHole = ctx.results[ctx.results.length - 1];

  if (completedCount >= 1) grant(ACHIEVEMENTS[0]); // first_sink
  if (lastHole) {
    if (lastHole.strokes === 1) grant(ACHIEVEMENTS[1]); // hole_in_one
    if (lastHole.strokes <= lastHole.par - 2) grant(ACHIEVEMENTS[2]); // eagle
    if (lastHole.strokes === lastHole.par - 1) grant(ACHIEVEMENTS[3]); // birdie
  }
  if (birdiesOrBetter >= 3) grant(ACHIEVEMENTS[4]); // three_birdies
  if (allParOrBetter) grant(ACHIEVEMENTS[5]); // all_par
  if (completedCount >= 17 && ctx.totalStrokes < 57) grant(ACHIEVEMENTS[6]); // sub_36
  if (ctx.hitWaterThisHole && lastHole) grant(ACHIEVEMENTS[7]); // water_survivor
  if (completedCount >= 7) grant(ACHIEVEMENTS[8]); // halfway
  if (completedCount >= 17) grant(ACHIEVEMENTS[9]); // finisher

  if (newly.length > 0) saveUnlocked(unlocked);
  return newly;
}
