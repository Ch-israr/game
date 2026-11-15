# Mini Golf 3D — Project Worklog

## Current Project Status (Round 12 — more levels)

A fun, addictive 3D Mini Golf game built with Next.js 16 + React Three Fiber.
**This round added three new levels (15–17) — a loop course, a multi-tier
elevation course, and a pinball field — taking the game from 14 to 17 holes.**

### Assessment from QA (physics solver + headless browser)
- **Lint: clean** (0 errors, 0 warnings).
- **Runtime: no errors**. Only the pre-existing `THREE.Clock deprecated`
  warning (R3F internal) and Google Fonts fetch failures in this sandbox
  (no external network from the VM shell; unrelated to the game code).
- **Playability verified with a headless solver** using the real physics
  engine (`stepBall`): all 17 levels sink within par + 3. New levels:
  The Grand Loop in 5 (par 5), Sky Terraces in 3 (par 5),
  Flipper Frenzy in 3 (par 5).
- **Browser verified**: menu shows "17 holes", level select shows all three
  new levels, each loads with its 3D canvas, HUD shows Hole 15/17, 16/17,
  17/17, and a drag putt registers strokes. Screenshots in
  `~/workspace/game-test/shot-l1{5,6,7}.png`.
- **Production build: not verifiable in this sandbox** — `next build` fails
  fetching Geist from Google Fonts, and fails identically on the pristine
  pre-change code (verified via `git stash`). Pre-existing environment
  issue, not caused by this round.

---

## Round 12 — Completed Modifications

### 1. Three new levels (`src/game/levels.ts`)
- **15. The Grand Loop** (par 5, 12×26): the cup sits inside a walled
  island whose only opening is the north gate. A cross-wall with gaps only
  at the far edges forces a full loop around the outside; conveyors in the
  side channels carry the ball north, then it crosses the north strip and
  enters through the gate. Water flanks the gate; sand punishes straight
  shots at the cross-wall.
- **16. Sky Terraces** (par 5, 10×24): three terraces at heights 0.6 / 1.2 /
  1.8, built from static moving platforms (distance 0 — the only raised
  floors the heightfield physics supports), connected by ramps whose bases
  sit at the previous terrace's height. Guard walls on the middle and top
  terraces, water pools on the ground below. The cup sits on the top
  terrace.
- **17. Flipper Frenzy** (par 5, 10×24): a pinball table — dense bumper
  field, a windmill spinner, two fast shuttling platforms as flippers
  guarding the cup, side-lane conveyors as the safe route around the water
  "drain" in front of the cup, and sand outlanes.

### 2. Elevated-hole rendering (`src/components/game/Course.tsx`)
- The cup, rim, green ring and flagpole now sit at `holePos[1]` instead of
  a hardcoded y ≈ 0, so the Sky Terraces cup renders on the top terrace.
  All existing levels have `holePos[1] = 0`, so they are unchanged.

### 3. Level-count updates (14 → 17)
- Start screen, settings panel, tutorial overlay and leaderboard empty
  state now say 17 holes.
- Achievements: "Course Pro", "Speed Golfer" and "Course Finisher" now
  require 17 holes. "Speed Golfer" threshold rescaled with total par
  (55 → 70): under 57 strokes instead of under 42 (both 13 under par).
- Prisma `Score` comment updated (it still said "all 8 holes").

### 4. Bug fix found by the solver: Level 2 was unwinnable
- **The Dogleg's central wall spanned the full fairway width (8 units on
  an 8-wide course) with no gap and no bypass** (no ramps, bumpers or
  teleporters on that level), so the ball could never reach the hole.
  Shortened the wall to 6.4 units, leaving a 0.8 gap at each end — the
  hint already said "go around". Verified: the solver now sinks it in 2
  strokes (par 3).

---

## Verification Results (physics solver + headless browser)
- Lint: **clean**.
- Solver (real `stepBall` physics, greedy shots along each level's intended
  route): **17/17 levels sink within par + 3**. New levels: 15 in 5,
  16 in 3, 17 in 3. Level 2 (fixed) in 2.
- Solver notes: a ball cannot rest on a ramp slope (gravity beats
  friction), so routes are verified via terrace/platform waypoints, not
  ramp positions. Conveyors act as one-way valves — a ball cannot crawl
  south inside a northbound conveyor channel at low power, so the Grand
  Loop route exits the channel at its north end before turning.
- Browser (Playwright, headless Chromium + SwiftShader, local dev server):
  menu, level select (all 17 cards), and all three new levels render;
  putts register. No JS errors — only font-fetch failures from the
  sandbox having no external network.
- Build: `next build` fails on Google Fonts fetch in this sandbox, on
  pristine code too. Needs a networked environment (or Vercel) to confirm.

## Unresolved issues / risks
- The `THREE.Clock` deprecation warning is emitted by R3F internals; harmless.
- Post-processing (Bloom) was removed in round 4 to fix a frame-rate bug.
- The sandbox's headless browser runs at low FPS (software WebGL); the dynamic
  substeps fix ensures the game is playable. On real hardware it runs at 60 FPS.
- Haptics only work on Android Chrome (Vibration API); iOS Safari doesn't
  support it. This is expected — the feature enhances Android UX without
  affecting other platforms.
- The shot recorder is module-level (not React state), so the ShotReplay
  component reads it at render time. This works because the modal mounts after
  the shot data is finalized.
- The engine has no true vertical loop-the-loop: physics is a heightfield,
  so "loop" levels are horizontal circuits (levels 13 and 15), and there
  are no rotating flippers — Flipper Frenzy's flippers are fast shuttling
  platforms. A real loop/flipper would need new physics + obstacle types.
- The solver found several existing levels sinkable in 1 stroke from the
  tee with a perfect shot (levels 1, 3, 6, 7, 11, 13). That is a solver
  artifact (perfect aim/power), not a human difficulty problem — pars are
  for humans — but level 13's cup sits right behind its tee by design.

## Priority recommendations for the next phase
1. **Course editor**: let players design + share custom holes (save to DB).
2. **Replay/share**: record a hole's shot sequence and share a link.
3. **Daily challenge leaderboard**: separate leaderboard for daily challenge
   scores (filtered by date).
4. **Mobile performance**: reduce shadow map size on mobile; LOD for trees.
5. **Re-add Bloom conditionally**: detect hardware WebGL and enable post-processing
   only on capable devices.
6. **Animated ball trail on replay**: show an animated ball following the
   recorded path instead of just static lines.
7. **More levels**: the worklog's three suggestions (loop, multi-tier,
   pinball) are now done as levels 15–17. Next ideas: a course with
   teleporters as the main mechanic, or a night/glow theme round.

---

## Round 11 — Completed Modifications

### 1. Haptic Feedback (Mobile)
- New `src/game/haptics.ts` module using the Vibration API:
  - 6 patterns: `putt` (15ms), `wall` (30ms), `bumper` (10-20-10ms),
    `sink` (success pattern: 30-40-30-40-60ms), `water` (error: 40-30-40ms),
    `warp` (double tap: 10-30-10ms).
  - Silently no-ops on devices without vibration support (desktop, iOS Safari).
- **Wired into**:
  - `GameCanvas.onPointerUp`: `haptic("putt")` on shot release.
  - `Ball.useFrame`: `haptic("sink")`, `haptic("water")`, `haptic("wall")`,
    `haptic("bumper")`, `haptic("warp")` on corresponding physics events.

### 2. Shot Trail Replay (Level-Complete Modal)
- New `src/game/shot-recorder.ts` module — module-level singleton that records
  the ball's path during each shot:
  - `startShotRecording(strokeNumber)`: begins a new shot path.
  - `recordPathPoint(x, y, z)`: appends a point (throttled to >0.1 unit movement).
  - `endShotRecording()`: finalizes and stores the shot.
  - `getHoleShots()`: returns all shots for the current hole.
  - `clearHoleShots()`: resets on hole change.
- **Ball component**: starts recording when ball begins moving, records path
  points each frame, ends recording on sink/stop/water. Clears on level change.
- New `ShotReplay` component (`src/components/game/ShotReplay.tsx`):
  - Top-down SVG mini-map showing the fairway, tee, hole, and all shot paths.
  - Each shot path is a colored line (6 colors, cycling), animated with
    `pathLength` via Framer Motion (draws in over 1.2s, staggered 0.3s).
  - Start points marked with colored circles + stroke number labels.
  - Legend showing shot numbers with their colors.
- **LevelCompleteModal**: now includes the ShotReplay mini-map between the
  stats grid and the action buttons.

### Verification Results (agent-browser) — Round 11
- Lint: **clean**.
- Golden path: start → putt → hole-in-one → "Hole in One!" modal with
  "SHOT REPLAY | 1 shot | Shot 1 | Replay | Next Hole". ✓
- Haptics: no errors on desktop (Vibration API not available, silent no-op). ✓
- No page errors. Only `THREE.Clock deprecated` warning (R3F internal).
