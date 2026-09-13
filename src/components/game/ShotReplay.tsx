"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { CourseDef } from "@/game/types";
import { getHoleShots } from "@/game/shot-recorder";

// Renders a top-down replay of all shots taken on the current hole.
// Shown on the level-complete modal as a mini-map with animated paths.
export function ShotReplay({ course }: { course: CourseDef }) {
  const shots = getHoleShots();
  const { width, length } = course.bounds;
  const pad = 1.5;
  const vbW = width + pad * 2;
  const vbH = length + pad * 2;

  const sx = (x: number) => x + width / 2 + pad;
  const sy = (z: number) => z + length / 2 + pad;

  // Color each shot differently
  const shotColors = ["#fbbf24", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#ec4899"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Shot Replay
        </span>
        <span className="text-[10px] text-slate-400">
          {shots.length} shot{shots.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex justify-center">
        <svg
          width={220}
          height={Math.round(220 * (vbH / vbW))}
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="rounded-lg"
          style={{ background: "#2f5d2a" }}
        >
          {/* Fairway */}
          <rect
            x={sx(-width / 2)}
            y={sy(-length / 2)}
            width={width}
            height={length}
            fill="#4a7d3a"
            rx={0.5}
          />
          {/* Tee */}
          <circle
            cx={sx(course.teePos[0])}
            cy={sy(course.teePos[2])}
            r={0.3}
            fill="#9ca3af"
            stroke="#fff"
            strokeWidth={0.08}
          />
          {/* Hole */}
          <circle
            cx={sx(course.holePos[0])}
            cy={sy(course.holePos[2])}
            r={0.3}
            fill="#0a0a0a"
          />
          <circle
            cx={sx(course.holePos[0])}
            cy={sy(course.holePos[2])}
            r={0.12}
            fill={course.accent}
          />
          {/* Shot paths */}
          {shots.map((shot, i) => {
            const color = shotColors[i % shotColors.length];
            if (shot.points.length < 2) return null;
            const d = shot.points
              .map((p, j) => `${j === 0 ? "M" : "L"} ${sx(p[0])} ${sy(p[2])}`)
              .join(" ");
            return (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={0.12}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1.2, delay: 0.2 + i * 0.3, ease: "easeInOut" }}
              />
            );
          })}
          {/* Shot number labels at start points */}
          {shots.map((shot, i) => {
            const color = shotColors[i % shotColors.length];
            const p = shot.points[0];
            if (!p) return null;
            return (
              <motion.circle
                key={`lbl${i}`}
                cx={sx(p[0])}
                cy={sy(p[2])}
                r={0.18}
                fill={color}
                stroke="#fff"
                strokeWidth={0.05}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + i * 0.3, type: "spring", stiffness: 200 }}
              />
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      {shots.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {shots.map((shot, i) => (
            <div key={i} className="flex items-center gap-1 text-[9px] text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: shotColors[i % shotColors.length] }}
              />
              <span>Shot {shot.strokes}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
