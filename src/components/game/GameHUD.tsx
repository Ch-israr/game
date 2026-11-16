"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Flag,
  Trophy,
  RotateCcw,
  Home,
  Eye,
  Grid3x3,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Calendar,
  Settings,
} from "lucide-react";
import { useGameStore } from "@/game/store";
import { LEVELS } from "@/game/levels";
import { DIFFICULTY } from "@/game/difficulty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GameHUD() {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const strokes = useGameStore((s) => s.strokes);
  const totalStrokes = useGameStore((s) => s.totalStrokes);
  const cameraView = useGameStore((s) => s.cameraView);
  const muted = useGameStore((s) => s.muted);
  const musicOn = useGameStore((s) => s.musicOn);
  const difficulty = useGameStore((s) => s.difficulty);
  const dailyMode = useGameStore((s) => s.dailyChallengeMode);
  const course = LEVELS[currentLevelIndex] ?? LEVELS[0];
  const diffCfg = DIFFICULTY[difficulty];

  const diff = strokes - course.par;
  const diffLabel =
    strokes === 0
      ? "—"
      : diff < 0
      ? `${diff}`
      : diff === 0
      ? "E"
      : `+${diff}`;
  const diffColor =
    strokes === 0
      ? "text-muted-foreground"
      : diff < 0
      ? "text-emerald-500"
      : diff === 0
      ? "text-foreground"
      : "text-orange-500";

  return (
    <>
      {/* Top bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          {/* Level info */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/40 bg-white/70 px-3 py-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/50">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-inner"
              style={{ background: course.accent }}
            >
              {course.id}
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">{course.name}</span>
                {dailyMode && (
                  <Badge className="gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0 text-[9px] font-bold text-white">
                    <Calendar className="h-2.5 w-2.5" /> DAILY
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> Hole {course.id}/{LEVELS.length}
              </div>
            </div>
          </div>

          {/* Stroke counter */}
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/40 bg-white/70 px-4 py-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/50">
            <div className="text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Strokes
              </div>
              <div className="text-xl font-extrabold leading-none text-foreground">
                {strokes}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Par
              </div>
              <div className="text-xl font-bold leading-none text-foreground">
                {course.par}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Score
              </div>
              <div className={`text-xl font-extrabold leading-none ${diffColor}`}>
                {diffLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Level dots */}
        <div className="mx-auto mt-2 flex max-w-3xl items-center justify-center gap-1.5">
          {LEVELS.map((l, i) => {
            const done = i < currentLevelIndex;
            const active = i === currentLevelIndex;
            return (
              <div
                key={l.id}
                className={`h-1.5 rounded-full transition-all ${
                  active
                    ? "w-6"
                    : done
                    ? "w-3 bg-emerald-400"
                    : "w-3 bg-foreground/20"
                }`}
                style={active ? { background: l.accent } : undefined}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Bottom-right controls (grouped vertically) */}
      <div className="absolute bottom-4 right-3 z-20 flex flex-col gap-2 sm:right-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-full shadow-lg"
          onClick={() => useGameStore.getState().toggleSettings()}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={`h-11 w-11 rounded-full shadow-lg ${
            cameraView === "topdown" ? "ring-2 ring-emerald-400" : ""
          }`}
          onClick={() => useGameStore.getState().toggleCameraView()}
          title={cameraView === "follow" ? "Switch to top-down aim view" : "Switch to follow view"}
        >
          {cameraView === "follow" ? (
            <Grid3x3 className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={`h-11 w-11 rounded-full shadow-lg ${
            musicOn ? "" : "ring-2 ring-slate-400 opacity-60"
          }`}
          onClick={() => useGameStore.getState().toggleMusic()}
          title={musicOn ? "Turn music off" : "Turn music on"}
        >
          {musicOn ? <Music2 className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={`h-11 w-11 rounded-full shadow-lg ${muted ? "ring-2 ring-red-400" : ""}`}
          onClick={() => useGameStore.getState().toggleMute()}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-full shadow-lg"
          onClick={() => useGameStore.getState().resetHole()}
          title="Retry hole"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-full shadow-lg"
          onClick={() => useGameStore.getState().goToMenu()}
          title="Menu"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom-left: total strokes + view label + difficulty.
          Vertical stack, pills sized to their content and left-aligned so
          they never overlap each other. */}
      <div className="pointer-events-none absolute bottom-4 left-3 z-20 flex flex-col items-start gap-1.5 sm:left-4">
        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1.5 shadow-lg">
          <Trophy className="h-3.5 w-3.5" /> Total {totalStrokes}
        </Badge>
        <Badge
          variant="outline"
          className="gap-1 rounded-full border-white/40 bg-white/70 px-2.5 py-1 text-[10px] shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/40"
        >
          {cameraView === "follow" ? (
            <>
              <Eye className="h-3 w-3" /> Follow cam
            </>
          ) : (
            <>
              <Grid3x3 className="h-3 w-3" /> Aim view
            </>
          )}
        </Badge>
        <Badge
          className="gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
          style={{ background: diffCfg.accent }}
        >
          {diffCfg.label}
        </Badge>
      </div>
    </>
  );
}

export function HintToast({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, 30] }}
      transition={{ times: [0, 0.08, 0.85, 1], duration: 5.5, ease: "easeOut" }}
      className="pointer-events-none absolute inset-x-0 bottom-20 z-10 flex justify-center px-4"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-2 text-center text-xs font-medium text-foreground shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/60">
        <Flag className="h-3.5 w-3.5" /> {message}
      </div>
    </motion.div>
  );
}
