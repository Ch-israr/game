"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/game/store";

export function PowerMeter() {
  const ballState = useGameStore((s) => s.ballState);
  const power = useGameStore((s) => s.aimPower);
  const spin = useGameStore((s) => s.aimSpin);
  const visible = ballState === "aiming";

  const pct = Math.round(power * 100);
  // color band
  const barColor =
    power < 0.5
      ? "#4ade80"
      : power < 0.8
      ? "#facc15"
      : "#ef4444";

  // Spin display: -1 (left curve) .. 0 (straight) .. +1 (right curve)
  const spinPct = Math.round(Math.abs(spin) * 100);
  const spinDir = spin < -0.08 ? "left" : spin > 0.08 ? "right" : "straight";
  const spinColor = spinDir === "straight" ? "#9ca3af" : "#a855f7";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          // Bottom-right, above the HUD button column: the old bottom-centre
          // spot sat directly over the ball while aiming.
          className="pointer-events-none absolute bottom-[21.5rem] right-3 z-20 w-80 max-w-[calc(100vw-1.5rem)] sm:right-4"
        >
          <div className="w-full max-w-xs rounded-2xl border border-white/40 bg-white/80 px-4 py-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/60">
            {/* Power row */}
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span className="text-muted-foreground">Power</span>
              <span className="text-foreground">{pct}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: barColor }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.05 }}
              />
              {/* power tick marks */}
              <div className="absolute inset-0 flex justify-between px-[2px]">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-full w-px bg-white/40" />
                ))}
              </div>
            </div>
            {/* Spin row */}
            <div className="mt-2 mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span className="text-muted-foreground">Spin</span>
              <span style={{ color: spinColor }}>
                {spinDir === "straight"
                  ? "Straight"
                  : `${spinDir === "left" ? "←" : "→"} ${spinPct}%`}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              {/* center marker */}
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
              {/* spin bar — fills from center outward */}
              <motion.div
                className="absolute inset-y-0 rounded-full"
                style={{
                  background: spinColor,
                  left: spin >= 0 ? "50%" : `${50 - spinPct / 2}%`,
                  width: `${spinPct / 2}%`,
                }}
                transition={{ duration: 0.05 }}
              />
            </div>
            <div className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Drag back to aim · Curve sideways for spin
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
