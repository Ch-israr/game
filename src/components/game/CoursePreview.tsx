"use client";

import { useMemo } from "react";
import type { CourseDef } from "@/game/types";

// A lightweight top-down SVG preview of a course layout.
// Renders the fairway, tee, hole, walls, water, sand, and hazards as colored
// shapes. Much cheaper than a 3D preview and gives players a quick overview.
interface Props {
  course: CourseDef;
  size?: number; // px width
}

const COLORS = {
  fairway: "#4a7d3a",
  fairwayDark: "#3f6b34",
  rough: "#2f5d2a",
  wall: "#5b4636",
  water: "#38bdf8",
  waterDark: "#0c4a6e",
  sand: "#e0c074",
  tee: "#9ca3af",
  hole: "#0a0a0a",
  bumper: "#f43f5e",
  ramp: "#c8854a",
  platform: "#0e7490",
  wind: "#86efac",
  teleport: "#f472b6",
  windmill: "#0d9488",
  conveyor: "#fbbf24",
};

export function CoursePreview({ course, size = 120 }: Props) {
  const { width, length } = course.bounds;
  // SVG viewBox: pad by 1 unit on each side for walls
  const pad = 1.5;
  const vbW = width + pad * 2;
  const vbH = length + pad * 2;
  const aspect = vbW / vbH;
  const w = size;
  const h = Math.round(size / aspect);

  // Scale factor: SVG units -> px (we just use viewBox, so scale is implicit)
  const sx = (x: number) => x + width / 2 + pad;
  const sy = (z: number) => z + length / 2 + pad;

  const accent = course.accent;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="rounded-lg"
      style={{ background: COLORS.rough }}
    >
      {/* Fairway */}
      <rect
        x={sx(-width / 2)}
        y={sy(-length / 2)}
        width={width}
        height={length}
        fill={COLORS.fairway}
        rx={0.5}
      />
      {/* Mowing stripes (subtle) */}
      {Array.from({ length: Math.floor(length / 2) }).map((_, i) => (
        <rect
          key={i}
          x={sx(-width / 2)}
          y={sy(-length / 2 + i * 2)}
          width={width}
          height={1}
          fill={i % 2 === 0 ? COLORS.fairway : COLORS.fairwayDark}
          opacity={0.5}
        />
      ))}

      {/* Water hazards */}
      {course.waterHazards.map((w, i) => (
        <rect
          key={`w${i}`}
          x={sx(w.pos[0] - w.size[0] / 2)}
          y={sy(w.pos[2] - w.size[1] / 2)}
          width={w.size[0]}
          height={w.size[1]}
          fill={COLORS.water}
          rx={0.3}
          opacity={0.85}
        />
      ))}

      {/* Sand traps */}
      {course.sandTraps.map((s, i) => (
        <rect
          key={`s${i}`}
          x={sx(s.pos[0] - s.size[0] / 2)}
          y={sy(s.pos[2] - s.size[1] / 2)}
          width={s.size[0]}
          height={s.size[1]}
          fill={COLORS.sand}
          rx={0.3}
        />
      ))}

      {/* Conveyors */}
      {course.conveyors.map((c, i) => (
        <rect
          key={`cv${i}`}
          x={sx(c.pos[0] - c.size[0] / 2)}
          y={sy(c.pos[2] - c.size[2] / 2)}
          width={c.size[0]}
          height={c.size[2]}
          fill={COLORS.conveyor}
          rx={0.2}
          opacity={0.8}
        />
      ))}

      {/* Ramps (as triangles) */}
      {course.ramps.map((r, i) => (
        <rect
          key={`r${i}`}
          x={sx(r.pos[0] - r.size[0] / 2)}
          y={sy(r.pos[2] - r.size[2] / 2)}
          width={r.size[0]}
          height={r.size[2]}
          fill={COLORS.ramp}
          rx={0.2}
          opacity={0.75}
        />
      ))}

      {/* Moving platforms */}
      {course.movingPlatforms.map((p, i) => (
        <rect
          key={`p${i}`}
          x={sx(p.pos[0] - p.size[0] / 2)}
          y={sy(p.pos[2] - p.size[2] / 2)}
          width={p.size[0]}
          height={p.size[2]}
          fill={COLORS.platform}
          rx={0.2}
        />
      ))}

      {/* Walls */}
      {course.walls.map((wall, i) => (
        <rect
          key={`wall${i}`}
          x={sx(wall.pos[0] - wall.size[0] / 2)}
          y={sy(wall.pos[2] - wall.size[2] / 2)}
          width={wall.size[0]}
          height={wall.size[2]}
          fill={wall.color ?? COLORS.wall}
          rx={0.15}
        />
      ))}

      {/* Bumpers (circles) */}
      {course.bumpers.map((b, i) => (
        <circle
          key={`b${i}`}
          cx={sx(b.pos[0])}
          cy={sy(b.pos[2])}
          r={b.radius}
          fill={b.color ?? COLORS.bumper}
        />
      ))}

      {/* Teleporters (circles with accent) */}
      {course.teleporters.map((tp, i) => (
        <circle
          key={`tp${i}`}
          cx={sx(tp.pos[0])}
          cy={sy(tp.pos[2])}
          r={tp.radius}
          fill={tp.color ?? COLORS.teleport}
          opacity={0.8}
        />
      ))}

      {/* Windmills (circle at hub) */}
      {course.windmills.map((wm, i) => (
        <circle
          key={`wm${i}`}
          cx={sx(wm.pos[0])}
          cy={sy(wm.pos[2])}
          r={wm.bladeLength * 0.4}
          fill={wm.color ?? COLORS.windmill}
          opacity={0.7}
        />
      ))}

      {/* Wind zones (translucent) */}
      {course.windZones.map((wz, i) => (
        <rect
          key={`wz${i}`}
          x={sx(wz.pos[0] - wz.size[0] / 2)}
          y={sy(wz.pos[2] - wz.size[2] / 2)}
          width={wz.size[0]}
          height={wz.size[2]}
          fill={wz.color ?? COLORS.wind}
          opacity={0.25}
          rx={0.2}
        />
      ))}

      {/* Tee marker */}
      <circle
        cx={sx(course.teePos[0])}
        cy={sy(course.teePos[2])}
        r={0.35}
        fill={COLORS.tee}
        stroke="#fff"
        strokeWidth={0.08}
      />
      {/* Tee label dot */}
      <circle cx={sx(course.teePos[0])} cy={sy(course.teePos[2])} r={0.15} fill="#fff" />

      {/* Hole */}
      <circle
        cx={sx(course.holePos[0])}
        cy={sy(course.holePos[2])}
        r={0.32}
        fill={COLORS.hole}
      />
      {/* Hole flag marker (accent dot) */}
      <circle
        cx={sx(course.holePos[0])}
        cy={sy(course.holePos[2])}
        r={0.15}
        fill={accent}
        opacity={0.9}
      />
    </svg>
  );
}
