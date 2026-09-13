# Mini Golf 3D — Project Worklog

## Current Project Status (Round 11 — webDevReview)

A fun, addictive 3D Mini Golf game built with Next.js 16 + React Three Fiber.
**This round added haptic feedback for mobile devices and a shot trail replay
mini-map on the level-complete modal.**

### Assessment from QA (agent-browser + VLM)
- **Lint: clean** (0 errors, 0 warnings).
- **Runtime: no errors**. Only benign `THREE.Clock deprecated` warning (R3F internal).
- **Golden path verified**: start → putt → hole-in-one → achievements unlock →
  level-complete modal with shot replay.
- **Shot replay verified**: modal shows "SHOT REPLAY | 1 shot | Shot 1" — the
  replay mini-map renders the ball's path on the level-complete modal.
- All 14 levels load without errors.

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

---

## Verification Results (agent-browser)
- Lint: **clean**.
- Golden path: start → putt → hole-in-one → "Hole in One!" modal with
  "SHOT REPLAY | 1 shot | Shot 1 | Replay | Next Hole". ✓
- Haptics: no errors on desktop (Vibration API not available, silent no-op). ✓
- No page errors. Only `THREE.Clock deprecated` warning (R3F internal).

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
7. **More levels**: a loop course, a multi-tier elevation course, a pinball
   field with flippers.
