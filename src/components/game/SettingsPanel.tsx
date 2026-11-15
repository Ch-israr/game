"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Music, Music2, Trash2, Settings } from "lucide-react";
import { useGameStore } from "@/game/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function SettingsPanel() {
  const open = useGameStore((s) => s.settingsOpen);
  const toggleSettings = useGameStore((s) => s.toggleSettings);
  const muted = useGameStore((s) => s.muted);
  const musicOn = useGameStore((s) => s.musicOn);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const resetProgress = useGameStore((s) => s.resetProgress);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={toggleSettings}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-black text-slate-900">Settings</h3>
              </div>
              <button
                onClick={toggleSettings}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-3 px-5 py-5">
              {/* Sound effects toggle */}
              <button
                onClick={toggleMute}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all ${
                  muted
                    ? "border-slate-200 bg-slate-50"
                    : "border-emerald-300 bg-emerald-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      muted ? "bg-slate-300" : "bg-emerald-500"
                    }`}
                  >
                    {muted ? (
                      <VolumeX className="h-5 w-5 text-white" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900">
                      Sound Effects
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {muted ? "Off" : "On — putt, bump, splash"}
                    </div>
                  </div>
                </div>
              </button>

              {/* Music toggle */}
              <button
                onClick={toggleMusic}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all ${
                  musicOn
                    ? "border-violet-300 bg-violet-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      musicOn ? "bg-violet-500" : "bg-slate-300"
                    }`}
                  >
                    {musicOn ? (
                      <Music2 className="h-5 w-5 text-white" />
                    ) : (
                      <Music className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900">
                      Background Music
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {musicOn ? "On — ambient pad" : "Off"}
                    </div>
                  </div>
                </div>
              </button>

              {/* Volume sliders */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Volume2 className="h-3 w-3" /> Volume Controls
                </div>
                {/* SFX volume */}
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Sound Effects</span>
                    <span className="font-mono text-slate-400">{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[Math.round(sfxVolume * 100)]}
                    onValueChange={(v) => setSfxVolume(v[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
                {/* Music volume */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Music</span>
                    <span className="font-mono text-slate-400">{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[Math.round(musicVolume * 100)]}
                    onValueChange={(v) => setMusicVolume(v[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {/* Danger zone */}
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                  Danger Zone
                </div>
                <p className="mb-2 text-[11px] text-slate-500">
                  Clears all achievements, best scores, and tutorial state.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 rounded-xl border-red-300 text-red-600 hover:bg-red-100"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.confirm("Reset all progress? This cannot be undone.")
                    ) {
                      resetProgress();
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Reset Progress
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-center text-[10px] text-slate-400">
              Mini Golf 3D · 17 holes · Made with React Three Fiber
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
