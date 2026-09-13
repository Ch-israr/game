"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Home, RotateCw, Crown, Medal, Award } from "lucide-react";
import { useGameStore } from "@/game/store";
import { useLeaderboard } from "@/game/use-leaderboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

function diffLabel(d: number): string {
  return d === 0 ? "E" : d > 0 ? `+${d}` : `${d}`;
}
function diffColor(d: number): string {
  return d <= 0 ? "text-emerald-600" : "text-orange-500";
}
function rankIcon(i: number) {
  if (i === 0) return <Crown className="h-4 w-4 text-amber-500" />;
  if (i === 1) return <Medal className="h-4 w-4 text-slate-400" />;
  if (i === 2) return <Award className="h-4 w-4 text-amber-700" />;
  return <span className="text-xs font-bold text-slate-400">{i + 1}</span>;
}

export function LeaderboardScreen() {
  const goToMenu = useGameStore((s) => s.goToMenu);
  const startGame = useGameStore((s) => s.startGame);
  const { scores, loading, error, refresh } = useLeaderboard();
  // Read any freshly-submitted score id once on mount (lazy initializer avoids
  // setState-in-effect). sessionStorage is a browser API, safe at render.
  const [highlightId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const id = sessionStorage.getItem("mg_last_score_id");
      if (id) {
        sessionStorage.removeItem("mg_last_score_id");
        return id;
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-indigo-400 via-sky-300 to-emerald-200 p-4"
    >
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Leaderboard</h2>
              <p className="text-[11px] text-slate-500">Top 10 best rounds</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={goToMenu}
            title="Back to menu"
          >
            <Home className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
            <p className="text-sm text-slate-500">Loading scores…</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Couldn&apos;t load scores.
            <br />
            <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
              <RotateCw className="mr-1 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : scores.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-2 text-5xl">🎯</div>
            <p className="text-sm font-semibold text-slate-700">
              No scores yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Be the first to complete all 14 holes!
            </p>
            <Button
              className="mt-4 gap-2 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
              onClick={startGame}
            >
              Play now
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 bg-slate-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              <div className="w-6 text-center">#</div>
              <div>Player</div>
              <div className="text-center">Strokes</div>
              <div className="w-12 text-center">vs Par</div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {scores.map((s, i) => {
                const isHi = s.id === highlightId;
                return (
                  <motion.div
                    key={s.id}
                    initial={isHi ? { backgroundColor: "#bbf7d0" } : false}
                    animate={{ backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 2 }}
                    className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm ${
                      isHi ? "bg-emerald-50" : i % 2 ? "bg-slate-50/60" : ""
                    }`}
                  >
                    <div className="flex h-6 w-6 items-center justify-center">
                      {rankIcon(i)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-800">
                        {s.playerName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {s.holesPlayed} holes
                      </div>
                    </div>
                    <div className="text-center font-bold text-slate-900">
                      {s.totalStrokes}
                    </div>
                    <div
                      className={`w-12 text-center font-extrabold ${diffColor(
                        s.diff
                      )}`}
                    >
                      {diffLabel(s.diff)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-1.5 rounded-xl"
            onClick={goToMenu}
          >
            <Home className="h-4 w-4" /> Menu
          </Button>
          <Button
            className="flex-[1.4] gap-1.5 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
            onClick={startGame}
          >
            <RotateCw className="h-4 w-4" /> Play Again
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Inline name-entry + submit shown on the game-complete screen.
export function ScoreSubmitForm({
  totalStrokes,
  par,
  holeStrokes,
  holesPlayed,
  onDone,
}: {
  totalStrokes: number;
  par: number;
  holeStrokes: number[];
  holesPlayed: number;
  onDone: () => void;
}) {
  const { submit } = useLeaderboard();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const ok = await submit({
      playerName: name || "Anonymous",
      totalStrokes,
      par,
      holeStrokes,
      holesPlayed,
    });
    setSubmitting(false);
    if (ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-center">
        <Badge className="gap-1 bg-emerald-600 text-white">
          <Trophy className="h-3.5 w-3.5" /> Saved to leaderboard!
        </Badge>
        <Button variant="outline" size="sm" onClick={onDone} className="mt-1 rounded-xl">
          View Leaderboard
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Save your score
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          placeholder="Your name"
          className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          maxLength={20}
        />
        <Button
          className="gap-1.5 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700 disabled:opacity-60"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Submit"}
        </Button>
      </div>
      <p className="mt-1.5 text-[10px] text-slate-400">
        {totalStrokes} strokes · {diffLabel(totalStrokes - par)} vs par
      </p>
    </div>
  );
}
