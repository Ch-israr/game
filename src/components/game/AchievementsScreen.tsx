"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Lock, Check } from "lucide-react";
import { useGameStore } from "@/game/store";
import { ACHIEVEMENTS, getUnlockedAchievements } from "@/game/achievements";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AchievementsScreen() {
  const goToMenu = useGameStore((s) => s.goToMenu);
  const startGame = useGameStore((s) => s.startGame);
  // Read unlocked achievements once on mount via lazy initializer (no effect).
  const [unlocked] = useState<Set<string>>(() => getUnlockedAchievements());

  const unlockedCount = unlocked.size;
  const totalCount = ACHIEVEMENTS.length;
  const progressPct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-gradient-to-b from-violet-400 via-fuchsia-300 to-amber-200 p-4"
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
            <h2 className="text-2xl font-black text-slate-900">Achievements</h2>
            <p className="text-xs text-slate-600">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-5 rounded-2xl border border-white/50 bg-white/85 p-4 shadow-lg backdrop-blur-md"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-bold text-slate-800">
                Your Progress
              </span>
            </div>
            <span className="text-lg font-extrabold text-amber-600">
              {progressPct}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.2 }}
            />
          </div>
        </motion.div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 gap-2 pb-6 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a, i) => {
            const isUnlocked = unlocked.has(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 shadow-sm transition-all ${
                  isUnlocked
                    ? "border-amber-300/60 bg-gradient-to-br from-amber-50 to-yellow-100"
                    : "border-slate-200 bg-slate-100/80"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner ${
                    isUnlocked
                      ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                      : "bg-slate-300 grayscale"
                  }`}
                >
                  {isUnlocked ? (
                    a.icon
                  ) : (
                    <Lock className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-sm font-bold ${
                      isUnlocked ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {a.name}
                  </div>
                  <div
                    className={`text-[11px] leading-tight ${
                      isUnlocked ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {isUnlocked ? a.description : "???"}
                  </div>
                </div>
                {/* Check badge */}
                {isUnlocked && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pb-6">
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl bg-white/60"
            onClick={goToMenu}
          >
            <ArrowLeft className="h-4 w-4" /> Menu
          </Button>
          <Button
            className="flex-[1.4] gap-2 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
            onClick={startGame}
          >
            <Trophy className="h-4 w-4" /> Play to earn more
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
