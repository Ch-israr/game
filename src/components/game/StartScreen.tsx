"use client";

import { motion } from "framer-motion";
import { Play, Flag, Trophy, Waves, Mountain, Wind, Sparkles, Volume2, BarChart3, Grid3x3, Zap, Calendar } from "lucide-react";
import { useGameStore } from "@/game/store";
import { DIFFICULTY, type Difficulty } from "@/game/difficulty";
import { Button } from "@/components/ui/button";
import { Hero3D } from "./Hero3D";

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const goToLeaderboard = useGameStore((s) => s.goToLeaderboard);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);
  const goToAchievements = useGameStore((s) => s.goToAchievements);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 p-4"
    >
      {/* Decorative floating shapes */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[12%] h-24 w-24 rounded-full bg-white/30 blur-xl"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[22%] h-32 w-32 rounded-full bg-white/20 blur-2xl"
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/50 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <motion.div
          initial={{ scale: 0.8, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="mb-2 flex justify-center"
        >
          <div className="relative">
            <Hero3D />
            <motion.div
              aria-hidden
              className="absolute -right-1 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow"
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-base">⛳</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
        >
          Mini Golf <span className="text-emerald-600">3D</span>
        </motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="mt-2 text-center text-sm text-slate-600 sm:text-base"
        >
          Putt, bounce and fly across 17 tricky courses. Aim with a flick, master the hazards, sink the cup.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 grid grid-cols-4 gap-2"
        >
          {[
            { icon: Mountain, label: "Ramps", color: "text-orange-500" },
            { icon: Wind, label: "Wind", color: "text-emerald-500" },
            { icon: Waves, label: "Water", color: "text-sky-500" },
            { icon: Sparkles, label: "Teleport", color: "text-pink-500" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white/70 px-2 py-3"
            >
              <f.icon className={`h-5 w-5 ${f.color}`} />
              <span className="text-[11px] font-medium text-slate-700">{f.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Difficulty selector */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.34 }}
          className="mt-4"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Zap className="h-3.5 w-3.5" /> Difficulty
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY) as Difficulty[]).map((key) => {
              const cfg = DIFFICULTY[key];
              const active = difficulty === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDifficulty(key)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-2.5 text-center transition-all ${
                    active
                      ? "border-transparent text-white shadow-md"
                      : "border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300"
                  }`}
                  style={active ? { background: cfg.accent } : undefined}
                >
                  <span className="text-sm font-bold">{cfg.label}</span>
                  <span
                    className={`text-[9px] leading-tight ${
                      active ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {cfg.description}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* How to play */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="mt-5 rounded-2xl bg-slate-900 p-4 text-slate-100"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            How to play
          </div>
          <ol className="space-y-1.5 text-sm">
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">1.</span>
              <span>Touch &amp; drag back from the ball to aim (slingshot style).</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">2.</span>
              <span>Pull farther for more power — watch the meter.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">3.</span>
              <span>Release to putt. Beat par to score Birdies &amp; Eagles!</span>
            </li>
          </ol>
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.46 }}
          className="mt-6 flex flex-col gap-2"
        >
          <Button
            size="lg"
            className="w-full gap-2 rounded-2xl bg-emerald-600 text-base font-bold shadow-lg hover:bg-emerald-700"
            onClick={startGame}
          >
            <Play className="h-5 w-5" /> Start Playing
          </Button>
          {/* Daily Challenge — prominent secondary CTA */}
          <Button
            size="md"
            className="w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold text-white shadow-lg hover:from-amber-600 hover:to-orange-600"
            onClick={startDailyChallenge}
          >
            <Calendar className="h-4 w-4" /> Daily Challenge
            <span className="ml-auto rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">
              {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 rounded-xl bg-white/60"
              onClick={goToLevelSelect}
            >
              <Grid3x3 className="h-4 w-4" /> Levels
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 rounded-xl bg-white/60"
              onClick={goToLeaderboard}
            >
              <BarChart3 className="h-4 w-4" /> Scores
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 rounded-xl bg-white/60"
              onClick={goToAchievements}
            >
              <Trophy className="h-4 w-4" /> Awards
            </Button>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <Trophy className="h-3.5 w-3.5" /> 17 holes · <Volume2 className="h-3.5 w-3.5" /> sound · mobile &amp; touch friendly
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
