"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Play, Lock, MapPin } from "lucide-react";
import { useGameStore } from "@/game/store";
import { LEVELS } from "@/game/levels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoursePreview } from "./CoursePreview";

// Read best-per-hole scores from localStorage (persistent across sessions).
function getBestScores(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("mg_best_per_hole");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function LevelSelectScreen() {
  const goToMenu = useGameStore((s) => s.goToMenu);
  const startLevel = useGameStore((s) => s.startLevel);
  const best = getBestScores();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-gradient-to-b from-emerald-400 via-emerald-300 to-sky-200 p-4"
    >
      <div className="mx-auto w-full max-w-lg pt-2">
        {/* Header */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4 flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/60"
            onClick={goToMenu}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Select Hole</h2>
            <p className="text-xs text-slate-600">
              Jump to any course — your best score is shown below each.
            </p>
          </div>
        </motion.div>

        {/* Level grid */}
        <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-2">
          {LEVELS.map((course, i) => {
            const bestScore = best[course.id];
            const isBest =
              bestScore !== undefined && bestScore <= course.par;
            return (
              <motion.button
                key={course.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startLevel(i)}
                className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/85 p-4 text-left shadow-lg backdrop-blur-md transition-shadow hover:shadow-xl"
              >
                {/* Accent bar */}
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: course.accent }}
                />
                {/* Number badge + best score */}
                <div className="mb-2 flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-white shadow-md"
                    style={{ background: course.accent }}
                  >
                    {course.id}
                  </div>
                  {bestScore !== undefined ? (
                    <Badge
                      className={`gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                        isBest
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      Best {bestScore}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-white/60 bg-white/60 px-2 py-0.5 text-[10px] text-slate-500"
                    >
                      <MapPin className="h-2.5 w-2.5" /> New
                    </Badge>
                  )}
                </div>
                {/* Course preview (top-down SVG) */}
                <div className="mb-2 flex justify-center rounded-lg bg-slate-100/80 p-1.5">
                  <CoursePreview course={course} size={130} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {course.name}
                </h3>
                <p className="text-[10px] text-slate-500">{course.subtitle}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Par {course.par}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-2.5 w-2.5" /> Play
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Locked hint */}
        <p className="pb-6 text-center text-[11px] text-slate-500">
          <Lock className="mr-1 inline h-3 w-3" />
          All holes are open — practice any course anytime.
        </p>
      </div>
    </motion.div>
  );
}
