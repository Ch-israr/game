"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/game/store";
import { LEVELS } from "@/game/levels";
import { GameCanvas } from "./GameCanvas";
import { GameHUD, HintToast } from "./GameHUD";
import { PowerMeter } from "./PowerMeter";
import { StartScreen } from "./StartScreen";
import { LevelCompleteModal } from "./LevelCompleteModal";
import { GameCompleteScreen } from "./GameCompleteScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { LevelSelectScreen } from "./LevelSelectScreen";
import { AchievementToasts } from "./AchievementToasts";
import { AchievementsScreen } from "./AchievementsScreen";
import { TutorialOverlay } from "./TutorialOverlay";
import { SettingsPanel } from "./SettingsPanel";
import { ConfettiBurst } from "./ConfettiBurst";

export function MiniGolf() {
  const screen = useGameStore((s) => s.screen);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const sinkAnim = useGameStore((s) => s.sinkAnim);
  const initPrefs = useGameStore((s) => s.initPrefs);
  const course = LEVELS[currentLevelIndex] ?? LEVELS[0];

  // Load persisted prefs (mute/music/difficulty/camera) on client mount.
  // Deferred to useEffect to avoid SSR hydration mismatch.
  useEffect(() => {
    initPrefs();
  }, [initPrefs]);

  const showScene = screen === "playing" || screen === "level-complete";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-sky-200">
      {/* 3D scene only mounted during active play / level-complete so transitions are smooth */}
      {showScene && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0"
        >
          <GameCanvas />
        </motion.div>
      )}

      {/* In-game HUD */}
      {screen === "playing" && (
        <>
          <GameHUD />
          <PowerMeter />
          {/* key remounts the toast each level so the intro animation replays */}
          <HintToast key={course.id} message={course.hint} />
        </>
      )}

      {/* Achievement toasts (show anywhere except menu) */}
      {screen !== "menu" && <AchievementToasts />}

      {/* Confetti burst on every sink (celebration) */}
      <ConfettiBurst trigger={sinkAnim} />

      {/* Tutorial overlay (shows on first play) */}
      {screen === "playing" && <TutorialOverlay />}

      {/* Settings panel (accessible from HUD settings button + menu) */}
      <SettingsPanel />

      {/* Level complete modal (scene visible behind) */}
      {screen === "level-complete" && <LevelCompleteModal />}

      {/* Full-screen overlays */}
      <AnimatePresence mode="wait">
        {screen === "menu" && <StartScreen key="start" />}
        {screen === "level-select" && <LevelSelectScreen key="select" />}
        {screen === "leaderboard" && <LeaderboardScreen key="lb" />}
        {screen === "achievements" && <AchievementsScreen key="ach" />}
        {screen === "game-complete" && <GameCompleteScreen key="done" />}
      </AnimatePresence>
    </div>
  );
}

