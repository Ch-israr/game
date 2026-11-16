"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw, Flag } from "lucide-react";
import { useGameStore, scoreGradeLabel } from "@/game/store";
import { LEVELS } from "@/game/levels";
import { Button } from "@/components/ui/button";
import type { ScoreGrade } from "@/game/types";
import { ShotReplay } from "./ShotReplay";

function gradeColor(grade: ScoreGrade): string {
  switch (grade) {
    case "hole-in-one":
      return "#f59e0b";
    case "eagle":
      return "#a855f7";
    case "birdie":
      return "#22c55e";
    case "par":
      return "#0ea5e9";
    case "bogey":
      return "#f97316";
    case "double-bogey":
      return "#ef4444";
    case "over":
      return "#dc2626";
  }
}

function gradeEmoji(grade: ScoreGrade): string {
  switch (grade) {
    case "hole-in-one":
      return "🏆";
    case "eagle":
      return "🦅";
    case "birdie":
      return "🐦";
    case "par":
      return "🎯";
    case "bogey":
      return "😐";
    case "double-bogey":
      return "😬";
    case "over":
      return "😖";
  }
}

export function LevelCompleteModal() {
  const screen = useGameStore((s) => s.screen);
  const results = useGameStore((s) => s.results);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const retryLevel = useGameStore((s) => s.retryLevel);

  const lastResult = results[results.length - 1];
  const visible = screen === "level-complete" && !!lastResult;
  const course = LEVELS[currentLevelIndex] ?? LEVELS[0];

  return (
    <AnimatePresence>
      {visible && lastResult ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl"
          >
            {/* Banner */}
            <div
              className="relative px-6 py-8 text-center text-white"
              style={{
                background: `linear-gradient(135deg, ${gradeColor(lastResult.grade)}, ${gradeColor(lastResult.grade)}cc)`,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
                // Keyframed rotate must use a tween: framer-motion only
                // supports two keyframes with a spring (a spring here
                // throws a pageerror on level complete).
                transition={{ delay: 0.15, type: "tween", duration: 0.5, ease: "easeInOut" }}
                className="mx-auto mb-2 text-6xl"
              >
                {gradeEmoji(lastResult.grade)}
              </motion.div>
              <div className="text-2xl font-black tracking-tight drop-shadow">
                {scoreGradeLabel(lastResult.grade)}
              </div>
              <div className="mt-0.5 text-sm text-white/90">
                Hole {lastResult.levelId}: {lastResult.levelName}
              </div>

              {/* confetti dots */}
              {lastResult.grade !== "over" &&
                Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    aria-hidden
                    className="absolute h-2 w-2 rounded-full bg-white/80"
                    style={{ left: "50%", top: "40%" }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: (Math.random() - 0.5) * 260,
                      y: (Math.random() - 0.5) * 160,
                      opacity: 0,
                      scale: 0.5,
                    }}
                    transition={{ duration: 1.1, delay: 0.2 + i * 0.02 }}
                  />
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 px-6 py-5">
              <Stat label="Strokes" value={String(lastResult.strokes)} />
              <Stat label="Par" value={String(lastResult.par)} />
              <Stat
                label="vs Par"
                value={
                  lastResult.strokes - lastResult.par === 0
                    ? "E"
                    : lastResult.strokes - lastResult.par > 0
                    ? `+${lastResult.strokes - lastResult.par}`
                    : `${lastResult.strokes - lastResult.par}`
                }
                accent
              />
            </div>

            {/* Shot replay mini-map */}
            <div className="px-6 pb-3">
              <ShotReplay course={course} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 rounded-xl"
                onClick={retryLevel}
              >
                <RotateCcw className="h-4 w-4" /> Replay
              </Button>
              {currentLevelIndex + 1 < LEVELS.length ? (
                <Button
                  className="flex-[1.6] gap-1.5 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                  onClick={nextLevel}
                >
                  Next Hole <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="flex-[1.6] gap-1.5 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                  onClick={nextLevel}
                >
                  <Flag className="h-4 w-4" /> Finish
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 py-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={`text-2xl font-extrabold ${
          accent ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
