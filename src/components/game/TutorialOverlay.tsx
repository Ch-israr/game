"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, MousePointer2, Gauge, RotateCw, Camera, Trophy } from "lucide-react";
import { useGameStore } from "@/game/store";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  icon: typeof MousePointer2;
  title: string;
  body: string;
  highlight?: "aim" | "power" | "spin" | "camera" | "controls";
}

const STEPS: TutorialStep[] = [
  {
    icon: MousePointer2,
    title: "Aim by Dragging",
    body: "Touch & drag back from the ball (slingshot style). The further you pull, the more power. Release to putt!",
    highlight: "aim",
  },
  {
    icon: Gauge,
    title: "Power & Distance",
    body: "Watch the power meter at the bottom — green = soft, yellow = medium, red = max power. Pull farther to reach distant holes.",
    highlight: "power",
  },
  {
    icon: RotateCw,
    title: "Add Spin for Curves",
    body: "Drag sideways while pulling back to add spin. The ball will curve in flight — perfect for bending around obstacles!",
    highlight: "spin",
  },
  {
    icon: Camera,
    title: "Switch Camera View",
    body: "Tap the grid icon (bottom-right) to switch to a top-down aim view for tricky shots. Tap again to return to follow cam.",
    highlight: "camera",
  },
  {
    icon: Trophy,
    title: "Earn Achievements",
    body: "Sink putts, score birdies, and complete all 17 holes to unlock achievements. Check the Awards screen from the menu!",
    highlight: "controls",
  },
];

export function TutorialOverlay() {
  const step = useGameStore((s) => s.tutorialStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const visible = step >= 0 && step < STEPS.length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setTutorialStep(-1)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with step indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step
                        ? "w-6 bg-emerald-500"
                        : i < step
                        ? "w-1.5 bg-emerald-300"
                        : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setTutorialStep(-1)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Skip tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 text-center">
              <motion.div
                key={step}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg"
              >
                {(() => {
                  const Icon = STEPS[step].icon;
                  return <Icon className="h-8 w-8 text-white" />;
                })()}
              </motion.div>
              <motion.h3
                key={`t${step}`}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-2 text-xl font-black text-slate-900"
              >
                {STEPS[step].title}
              </motion.h3>
              <motion.p
                key={`b${step}`}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm leading-relaxed text-slate-600"
              >
                {STEPS[step].body}
              </motion.p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-[11px] font-medium text-slate-400">
                Step {step + 1} of {STEPS.length}
              </span>
              <Button
                size="sm"
                className="gap-1 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                onClick={() => {
                  if (step + 1 >= STEPS.length) {
                    setTutorialStep(-1);
                  } else {
                    setTutorialStep(step + 1);
                  }
                }}
              >
                {step + 1 >= STEPS.length ? "Start Playing" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
