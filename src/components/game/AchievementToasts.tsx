"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/game/store";
import { getSound } from "@/game/sound";

export function AchievementToasts() {
  const pending = useGameStore((s) => s.pendingAchievements);
  const dismiss = useGameStore((s) => s.dismissAchievement);
  // The visible toast is always the first in the queue. Auto-dismiss after 3.5s
  // via a timer (store action in a callback — not setState-in-effect).
  const current = pending[0] ?? null;

  useEffect(() => {
    if (!current) return;
    getSound().play("bumper", 1);
    const t = setTimeout(() => dismiss(current.id), 3500);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ x: 380, opacity: 0, scale: 0.85 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 380, opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="pointer-events-none absolute right-3 top-20 z-40 sm:right-4"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-yellow-100 px-4 py-3 shadow-2xl">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-2xl shadow-md"
            >
              {current.icon}
            </motion.div>
            <div className="leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-widest text-amber-600">
                Achievement Unlocked
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {current.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {current.description}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
