"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, BarChart3 } from "lucide-react";
import { useGameStore, scoreGradeLabel } from "@/game/store";
import { LEVELS } from "@/game/levels";
import { Button } from "@/components/ui/button";
import { ScoreSubmitForm } from "./LeaderboardScreen";

export function GameCompleteScreen() {
  const results = useGameStore((s) => s.results);
  const totalStrokes = useGameStore((s) => s.totalStrokes);
  const startGame = useGameStore((s) => s.startGame);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const goToLeaderboard = useGameStore((s) => s.goToLeaderboard);

  const totalPar = LEVELS.reduce((acc, l) => acc + l.par, 0);
  const diff = totalStrokes - totalPar;

  const completed = results.length === LEVELS.length;
  const holeStrokes = results.map((r) => r.strokes);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-amber-300 via-emerald-300 to-emerald-200 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-4 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg"
          >
            <Trophy className="h-9 w-9 text-white" />
          </motion.div>
          <h2 className="text-2xl font-black text-slate-900">Course Complete!</h2>
          <p className="mt-1 text-sm text-slate-600">
            You finished all {LEVELS.length} holes.
          </p>
        </div>

        {/* Total score */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-100 py-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Strokes
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalStrokes}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 py-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Par
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalPar}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 py-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Score
            </div>
            <div
              className={`text-2xl font-extrabold ${
                diff <= 0 ? "text-emerald-600" : "text-orange-500"
              }`}
            >
              {diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`}
            </div>
          </div>
        </div>

        {/* Grade breakdown bar chart */}
        {completed && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Per-Hole Performance
              </span>
              <div className="flex gap-2 text-[9px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Under
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Par
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-orange-500" /> Over
                </span>
              </div>
            </div>
            {/* Bars */}
            <div className="flex h-20 items-end gap-1">
              {LEVELS.map((l, i) => {
                const r = results[i];
                if (!r) return null;
                const diff = r.strokes - r.par;
                const barColor =
                  diff < 0 ? "#10b981" : diff === 0 ? "#0ea5e9" : "#f97316";
                // height: 0 at par, +1 per stroke over, capped at 4
                const heightPct = Math.min(100, 30 + Math.abs(diff) * 18);
                return (
                  <motion.div
                    key={l.id}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 120 }}
                    className="group relative flex-1 rounded-t-md"
                    style={{ background: barColor }}
                    title={`${l.name}: ${r.strokes} (${diff === 0 ? "E" : diff > 0 ? `+${diff}` : diff})`}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-600">
                      {r.strokes}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            {/* Par line labels */}
            <div className="mt-1 flex gap-1">
              {LEVELS.map((l, i) => {
                const r = results[i];
                if (!r) return null;
                return (
                  <div
                    key={l.id}
                    className="flex-1 text-center text-[7px] font-semibold text-slate-400"
                    style={{ color: l.accent }}
                  >
                    {l.id}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scorecard */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[auto_1fr_auto_auto] bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <div className="px-3 py-2">#</div>
            <div className="px-3 py-2 text-left">Hole</div>
            <div className="px-3 py-2 text-center">Par</div>
            <div className="px-3 py-2 text-center">Strokes</div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {LEVELS.map((l, i) => {
              const r = results[i];
              return (
                <div
                  key={l.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] border-t border-slate-100 text-sm"
                >
                  <div
                    className="px-3 py-2 font-bold text-white"
                    style={{ background: l.accent }}
                  >
                    {l.id}
                  </div>
                  <div className="px-3 py-2 text-left text-slate-700">{l.name}</div>
                  <div className="px-3 py-2 text-center text-slate-500">{l.par}</div>
                  <div className="px-3 py-2 text-center font-bold text-slate-900">
                    {r ? r.strokes : "—"}
                    {r && (
                      <span className="ml-1 text-[10px] text-slate-400">
                        {scoreGradeLabel(r.grade).split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {!completed && (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                Final hole not recorded
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {completed && (
            <ScoreSubmitForm
              totalStrokes={totalStrokes}
              par={totalPar}
              holeStrokes={holeStrokes}
              holesPlayed={results.length}
              onDone={goToLeaderboard}
            />
          )}
          <Button
            size="lg"
            className="w-full gap-2 rounded-2xl bg-emerald-600 font-bold shadow-lg hover:bg-emerald-700"
            onClick={startGame}
          >
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2 rounded-2xl"
              onClick={goToLeaderboard}
            >
              <BarChart3 className="h-4 w-4" /> Leaderboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2 rounded-2xl"
              onClick={goToMenu}
            >
              <Home className="h-4 w-4" /> Menu
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
