import type { CourseDef, WallDef } from "./types";

// Helper to build the four boundary walls around a rectangular fairway.
function boundaryWalls(width: number, length: number, height = 1): WallDef[] {
  const t = 0.5; // wall thickness
  const color = "#5b4636"; // warm wood-tone rails
  return [
    { pos: [-width / 2 - t / 2, height / 2, 0], size: [t, height, length + t * 2], color },
    { pos: [width / 2 + t / 2, height / 2, 0], size: [t, height, length + t * 2], color },
    { pos: [0, height / 2, -length / 2 - t / 2], size: [width + t * 2, height, t], color },
    { pos: [0, height / 2, length / 2 + t / 2], size: [width + t * 2, height, t], color },
  ];
}

export const LEVELS: CourseDef[] = [
  // ---------------------------------------------------------------- Level 1
  {
    id: 1,
    name: "First Tee",
    subtitle: "Learn the basics",
    par: 2,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 7, length: 20 },
    accent: "#4ade80",
    hint: "Drag back from the ball to aim, release to putt. Pull farther for more power.",
    walls: [...boundaryWalls(7, 20)],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [],
    sandTraps: [],
    bumpers: [],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 2
  {
    id: 2,
    name: "The Dogleg",
    subtitle: "Bend it around the wall",
    par: 3,
    teePos: [-2.3, 0.11, 8.5],
    holePos: [2.3, 0, -8.5],
    bounds: { width: 8, length: 20 },
    accent: "#fbbf24",
    hint: "A central wall blocks the straight shot. Bank off the rails or go around.",
    walls: [
      ...boundaryWalls(8, 20),
      // Central wall blocks the straight shot but leaves a gap at each end —
      // bank off the rails or go around. (Was full-width: the hole was
      // unreachable, since the wall spanned the whole fairway.)
      { pos: [0, 0.6, 0], size: [6.4, 1.2, 0.6], color: "#5b4636" },
      { pos: [2.3, 0.5, -5], size: [2.4, 1, 0.4], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [],
    sandTraps: [],
    bumpers: [],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 3
  {
    id: 3,
    name: "Lift Off",
    subtitle: "Ramps & elevation",
    par: 3,
    teePos: [0, 0.11, 8.5],
    holePos: [0, 0, -8.5],
    bounds: { width: 8, length: 20 },
    accent: "#f97316",
    hint: "Hit the ramps to clear the barriers. Too slow and you'll roll back.",
    walls: [
      ...boundaryWalls(8, 20),
      { pos: [-2.6, 0.5, 1], size: [2.8, 1, 0.5], color: "#5b4636" },
      { pos: [2.6, 0.5, -3], size: [2.8, 1, 0.5], color: "#5b4636" },
    ],
    ramps: [
      { pos: [0, 0, 3.2], size: [2.6, 0.9, 2.4], rotationY: Math.PI, color: "#c8854a" },
      { pos: [0, 0, -1.2], size: [2.6, 0.9, 2.4], rotationY: 0, color: "#c8854a" },
    ],
    movingPlatforms: [],
    waterHazards: [],
    sandTraps: [],
    bumpers: [],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 4
  {
    id: 4,
    name: "Crosscurrent",
    subtitle: "Ride the moving platforms",
    par: 4,
    teePos: [0, 0.11, 8.5],
    holePos: [0, 0, -8.5],
    bounds: { width: 9, length: 20 },
    accent: "#22d3ee",
    hint: "Time your shot — the platforms drift side to side across the gap.",
    walls: [
      ...boundaryWalls(9, 20),
      { pos: [-3.4, 0.5, -1], size: [2.2, 1, 1], color: "#5b4636" },
      { pos: [3.4, 0.5, 1], size: [2.2, 1, 1], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [
      { pos: [-1.8, 0.05, 2], size: [2.4, 0.3, 2.4], axis: "x", distance: 1.8, speed: 1.4, phase: 0, color: "#0e7490" },
      { pos: [1.8, 0.05, -2], size: [2.4, 0.3, 2.4], axis: "x", distance: 1.8, speed: 1.4, phase: Math.PI, color: "#0e7490" },
    ],
    waterHazards: [],
    sandTraps: [],
    bumpers: [],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 5
  {
    id: 5,
    name: "The Lagoon",
    subtitle: "Avoid the water",
    par: 3,
    teePos: [0, 0.11, 8.5],
    holePos: [0, 0, -8.5],
    bounds: { width: 9, length: 20 },
    accent: "#38bdf8",
    hint: "Water resets your ball with a stroke penalty. Aim for the sand strip — it's slow but safe.",
    walls: [...boundaryWalls(9, 20)],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [
      { pos: [-2.7, 0, 0], size: [3.6, 7], color: "#0c4a6e" },
      { pos: [2.7, 0, 0], size: [3.6, 7], color: "#0c4a6e" },
    ],
    sandTraps: [{ pos: [0, 0, 0], size: [1.6, 7], color: "#e0c074" }],
    bumpers: [],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 6
  {
    id: 6,
    name: "The Gauntlet",
    subtitle: "Everything you've learned",
    par: 5,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 9, length: 22 },
    accent: "#a78bfa",
    hint: "Bumpers, ramps, water, sand and a moving platform. Good luck!",
    walls: [
      ...boundaryWalls(9, 22),
      { pos: [-2.2, 0.5, 4], size: [4.6, 1, 0.4], color: "#5b4636" },
      { pos: [2.2, 0.5, -2], size: [4.6, 1, 0.4], color: "#5b4636" },
    ],
    ramps: [{ pos: [0, 0, 0.5], size: [2.4, 0.7, 2], rotationY: Math.PI, color: "#c8854a" }],
    movingPlatforms: [
      { pos: [0, 0.05, -5], size: [2.2, 0.3, 2.2], axis: "x", distance: 2.2, speed: 1.1, phase: 0, color: "#0e7490" },
    ],
    waterHazards: [{ pos: [0, 0, -7.5], size: [3, 2], color: "#0c4a6e" }],
    sandTraps: [{ pos: [0, 0, -3.5], size: [2.4, 2], color: "#e0c074" }],
    bumpers: [
      { pos: [-2, 0, 1.5], radius: 0.45, height: 0.9, color: "#f43f5e" },
      { pos: [2, 0, -0.5], radius: 0.45, height: 0.9, color: "#f43f5e" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 7
  {
    id: 7,
    name: "Wind Tunnel",
    subtitle: "The breeze is not your friend",
    par: 4,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 9, length: 22 },
    accent: "#34d399",
    hint: "Crosswinds push the ball sideways. Lead your aim into the wind to hold your line.",
    walls: [
      ...boundaryWalls(9, 22),
      // a couple of low guard walls to make the wind matter
      { pos: [-2.5, 0.45, 2], size: [1.6, 0.9, 0.4], color: "#5b4636" },
      { pos: [2.5, 0.45, -3], size: [1.6, 0.9, 0.4], color: "#5b4636" },
    ],
    ramps: [{ pos: [0, 0, -5], size: [2.2, 0.5, 1.8], rotationY: Math.PI, color: "#c8854a" }],
    movingPlatforms: [],
    waterHazards: [],
    sandTraps: [{ pos: [0, 0, -7], size: [2, 2], color: "#e0c074" }],
    bumpers: [],
    // Crosswind blowing +X across the middle third of the course
    windZones: [
      { pos: [0, 0.4, 2], size: [9, 1.2, 7], force: [3.2, 0, 0], color: "#86efac" },
      // opposing wind near the hole for extra challenge
      { pos: [0, 0.4, -6], size: [9, 1.2, 4], force: [-2.6, 0, 0], color: "#86efac" },
    ],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 8
  {
    id: 8,
    name: "Warp Drive",
    subtitle: "Teleport to victory",
    par: 4,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 10, length: 22 },
    accent: "#ec4899",
    hint: "Step on a glowing pad to warp across the course. Watch for the water guarding the cup!",
    walls: [
      ...boundaryWalls(10, 22),
      // central blocking wall — must use teleporters to get past
      { pos: [0, 0.7, 0], size: [10, 1.4, 0.6], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [
      // water guarding the hole approach
      { pos: [0, 0, -7.5], size: [5, 2.4], color: "#0c4a6e" },
    ],
    sandTraps: [{ pos: [-3, 0, -8], size: [1.5, 3], color: "#e0c074" }],
    bumpers: [
      { pos: [3, 0, 5], radius: 0.4, height: 0.8, color: "#f43f5e" },
    ],
    windZones: [],
    teleporters: [
      // Pad A (near tee, right side) -> warps to near-hole left side
      { pos: [3, 0, 6], radius: 0.55, target: [-3, 0.11, -5], color: "#f472b6" },
      // Pad B (near tee, left side) -> warps to near-hole right side
      { pos: [-3, 0, 6], radius: 0.55, target: [3, 0.11, -5], color: "#22d3ee" },
    ],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 9
  {
    id: 9,
    name: "The Spiral",
    subtitle: "Wind your way to the center",
    par: 5,
    teePos: [0, 0.11, 9.5],
    holePos: [0, 0, 0],
    bounds: { width: 11, length: 22 },
    accent: "#fb923c",
    hint: "Follow the spiral path inward — cutting across is blocked by walls. Bumpers guard the center.",
    walls: [
      ...boundaryWalls(11, 22),
      // Outer ring gap on the right
      { pos: [-3, 0.6, 5], size: [4, 1.2, 0.5], color: "#5b4636" },
      // Mid ring barrier
      { pos: [3, 0.6, 1], size: [4, 1.2, 0.5], color: "#5b4636" },
      { pos: [0, 0.6, -3.5], size: [5, 1.2, 0.5], color: "#5b4636" },
      // Inner ring around the hole
      { pos: [-1.6, 0.5, -1], size: [2.2, 1, 0.4], color: "#5b4636" },
      { pos: [1.6, 0.5, 1], size: [2.2, 1, 0.4], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [],
    sandTraps: [
      { pos: [-3, 0, -1], size: [2, 2], color: "#e0c074" },
      { pos: [3, 0, 3], size: [2, 2], color: "#e0c074" },
    ],
    bumpers: [
      { pos: [0, 0, 2.5], radius: 0.4, height: 0.8, color: "#f43f5e" },
      { pos: [0, 0, -2.5], radius: 0.4, height: 0.8, color: "#f43f5e" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 10
  {
    id: 10,
    name: "Pinball Park",
    subtitle: "Bounce to the cup",
    par: 4,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 10, length: 22 },
    accent: "#e879f9",
    hint: "A field of bouncy bumpers — bank shots are your friend. Aim carefully, chaos awaits!",
    walls: [
      ...boundaryWalls(10, 22),
      // a couple of guide rails
      { pos: [-3.5, 0.5, 4], size: [0.6, 1, 3], color: "#5b4636" },
      { pos: [3.5, 0.5, -2], size: [0.6, 1, 3], color: "#5b4636" },
    ],
    ramps: [
      { pos: [0, 0, 6], size: [2, 0.4, 1.5], rotationY: Math.PI, color: "#c8854a" },
    ],
    movingPlatforms: [],
    waterHazards: [
      { pos: [0, 0, -7], size: [2.5, 2], color: "#0c4a6e" },
    ],
    sandTraps: [],
    // Dense bumper field in the middle
    bumpers: [
      { pos: [-2.2, 0, 3], radius: 0.42, height: 0.85, color: "#f43f5e" },
      { pos: [2.2, 0, 3], radius: 0.42, height: 0.85, color: "#f59e0b" },
      { pos: [0, 0, 1], radius: 0.42, height: 0.85, color: "#f43f5e" },
      { pos: [-2.2, 0, -1], radius: 0.42, height: 0.85, color: "#f59e0b" },
      { pos: [2.2, 0, -1], radius: 0.42, height: 0.85, color: "#f43f5e" },
      { pos: [-1.1, 0, -3], radius: 0.38, height: 0.8, color: "#f59e0b" },
      { pos: [1.1, 0, -3], radius: 0.38, height: 0.8, color: "#f43f5e" },
      { pos: [-2.5, 0, -5], radius: 0.38, height: 0.8, color: "#f59e0b" },
      { pos: [2.5, 0, -5], radius: 0.38, height: 0.8, color: "#f43f5e" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 11
  {
    id: 11,
    name: "Windmill Way",
    subtitle: "Time the spinning blades",
    par: 4,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 10, length: 22 },
    accent: "#14b8a6",
    hint: "A windmill guards the path. Time your putt so the blades don't knock you off course!",
    walls: [
      ...boundaryWalls(10, 22),
      // side guard walls near the windmill
      { pos: [-4, 0.5, 0], size: [0.6, 1, 4], color: "#5b4636" },
      { pos: [4, 0.5, 0], size: [0.6, 1, 4], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [],
    sandTraps: [
      { pos: [0, 0, -6], size: [2.5, 2], color: "#e0c074" },
    ],
    bumpers: [],
    windZones: [],
    teleporters: [],
    windmills: [
      // Central windmill with 4 blades, slow rotation
      {
        pos: [0, 0, 0],
        bladeLength: 3.2,
        bladeWidth: 0.5,
        bladeHeight: 0.5,
        rpm: 8,
        color: "#0d9488",
      },
    ],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 12
  {
    id: 12,
    name: "Conveyor Belt",
    subtitle: "Ride the moving walkway",
    par: 4,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, -9],
    bounds: { width: 9, length: 22 },
    accent: "#f59e0b",
    hint: "Conveyor belts push the ball along — ride them forward, but watch out for the one going the wrong way!",
    walls: [
      ...boundaryWalls(9, 22),
      // side walls creating a corridor for the conveyors
      { pos: [-3, 0.5, 2], size: [0.5, 1, 6], color: "#5b4636" },
      { pos: [3, 0.5, 2], size: [0.5, 1, 6], color: "#5b4636" },
      { pos: [-3, 0.5, -5], size: [0.5, 1, 5], color: "#5b4636" },
      { pos: [3, 0.5, -5], size: [0.5, 1, 5], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [
      // water on the sides so going off-course is punishing
      { pos: [-4, 0, -1], size: [1.5, 8], color: "#0c4a6e" },
      { pos: [4, 0, -1], size: [1.5, 8], color: "#0c4a6e" },
    ],
    sandTraps: [],
    bumpers: [
      { pos: [0, 0, -7], radius: 0.4, height: 0.8, color: "#f43f5e" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [
      // Forward conveyor (pushes toward hole, -z)
      { pos: [0, 0, 4], size: [4, 0.04, 5], speed: -2.5, color: "#fbbf24" },
      // Reverse conveyor (pushes back toward tee, +z) — must overpower it
      { pos: [0, 0, -3], size: [4, 0.04, 4], speed: 2.0, color: "#f87171" },
    ],
  },

  // ---------------------------------------------------------------- Level 13
  {
    id: 13,
    name: "Loop the Loop",
    subtitle: "Around and around",
    par: 5,
    teePos: [0, 0.11, 9],
    holePos: [0, 0, 9.5], // hole is back near the tee, on the far side of the loop
    bounds: { width: 11, length: 22 },
    accent: "#06b6d4",
    hint: "The hole is just behind you — but walls force a full loop around the course. Use spin to navigate the curves!",
    walls: [
      ...boundaryWalls(11, 22),
      // central island that blocks the straight path
      { pos: [0, 0.7, 2], size: [8, 1.4, 1], color: "#5b4636" },
      // guide walls to force clockwise flow
      { pos: [-4, 0.5, -2], size: [0.6, 1, 6], color: "#5b4636" },
      { pos: [4, 0.5, -5], size: [0.6, 1, 5], color: "#5b4636" },
    ],
    ramps: [
      // ramp to get over the central wall going back
      { pos: [0, 0, 6.5], size: [3, 0.6, 2], rotationY: 0, color: "#c8854a" },
    ],
    movingPlatforms: [],
    waterHazards: [
      // water in the center of the loop
      { pos: [0, 0, -2], size: [4, 3], color: "#0c4a6e" },
    ],
    sandTraps: [
      { pos: [-3, 0, -4], size: [2, 2], color: "#e0c074" },
      { pos: [3, 0, 0], size: [2, 2], color: "#e0c074" },
    ],
    bumpers: [
      { pos: [-3, 0, 6], radius: 0.4, height: 0.8, color: "#f43f5e" },
      { pos: [3, 0, -8], radius: 0.4, height: 0.8, color: "#f59e0b" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 14
  {
    id: 14,
    name: "Elevation Nation",
    subtitle: "Up, down, and around",
    par: 5,
    teePos: [0, 0.11, 9.5],
    holePos: [0, 0, -9.5],
    bounds: { width: 10, length: 24 },
    accent: "#8b5cf6",
    hint: "Multiple ramps and a windmill guard the path. Time your shots and use ramps to launch over obstacles!",
    walls: [
      ...boundaryWalls(10, 24),
      // staggered guard walls
      { pos: [-3, 0.5, 3], size: [4, 1, 0.4], color: "#5b4636" },
      { pos: [3, 0.5, -1], size: [4, 1, 0.4], color: "#5b4636" },
      { pos: [-3, 0.5, -5], size: [4, 1, 0.4], color: "#5b4636" },
    ],
    ramps: [
      // ramp to launch over the first guard wall
      { pos: [0, 0, 4.5], size: [2.4, 0.8, 2], rotationY: Math.PI, color: "#c8854a" },
      // ramp near the windmill
      { pos: [0, 0, -2.5], size: [2.4, 0.6, 1.8], rotationY: Math.PI, color: "#c8854a" },
    ],
    movingPlatforms: [],
    waterHazards: [
      // water pit before the hole
      { pos: [0, 0, -7], size: [3, 2], color: "#0c4a6e" },
    ],
    sandTraps: [
      { pos: [-2.5, 0, 0], size: [1.5, 2], color: "#e0c074" },
      { pos: [2.5, 0, -3], size: [1.5, 2], color: "#e0c074" },
    ],
    bumpers: [
      { pos: [2, 0, 2], radius: 0.4, height: 0.8, color: "#f43f5e" },
      { pos: [-2, 0, -4], radius: 0.4, height: 0.8, color: "#f59e0b" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [
      // windmill guarding the approach to the hole
      {
        pos: [0, 0, -4],
        bladeLength: 2.8,
        bladeWidth: 0.45,
        bladeHeight: 0.45,
        rpm: 10,
        color: "#7c3aed",
      },
    ],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 15
  {
    id: 15,
    name: "The Grand Loop",
    subtitle: "Round the island to the cup",
    par: 5,
    teePos: [0, 0.11, 11.5],
    holePos: [0, 0, 0],
    bounds: { width: 12, length: 26 },
    accent: "#a3e635",
    hint: "The cup sits inside a walled island — only the north gate is open. Loop around the outside to reach it; the side conveyors will carry you north.",
    walls: [
      ...boundaryWalls(12, 26),
      // Cross-wall south of the island: gaps only at the far left/right edges,
      // so the ball must loop around the sides instead of going straight.
      { pos: [0, 0.6, 5], size: [9.2, 1.2, 0.6], color: "#5b4636" },
      // Central island around the hole: solid on south/west/east, north gate open.
      { pos: [0, 0.6, 2.5], size: [5, 1.2, 0.5], color: "#5b4636" },
      { pos: [-2.5, 0.6, 0], size: [0.5, 1.2, 5], color: "#5b4636" },
      { pos: [2.5, 0.6, 0], size: [0.5, 1.2, 5], color: "#5b4636" },
      { pos: [-1.65, 0.6, -2.5], size: [1.7, 1.2, 0.5], color: "#5b4636" },
      { pos: [1.65, 0.6, -2.5], size: [1.7, 1.2, 0.5], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [],
    waterHazards: [
      // Pools flanking the north gate — the centre lane into the gate is safe.
      { pos: [-2.2, 0, -4.2], size: [1.8, 1.8], color: "#0c4a6e" },
      { pos: [2.2, 0, -4.2], size: [1.8, 1.8], color: "#0c4a6e" },
    ],
    sandTraps: [{ pos: [0, 0, 8.5], size: [2.5, 2], color: "#e0c074" }],
    bumpers: [
      { pos: [-4.5, 0, -9.5], radius: 0.4, height: 0.8, color: "#f43f5e" },
      { pos: [4.5, 0, -9.5], radius: 0.4, height: 0.8, color: "#f59e0b" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [
      // Side channels push the ball north around the loop.
      { pos: [-4.4, 0, 0], size: [2.6, 0.04, 14], speed: -2, color: "#a3e635" },
      { pos: [4.4, 0, 0], size: [2.6, 0.04, 14], speed: -2, color: "#a3e635" },
    ],
  },

  // ---------------------------------------------------------------- Level 16
  {
    id: 16,
    name: "Sky Terraces",
    subtitle: "Climb three terraces to the cup",
    par: 5,
    teePos: [0, 0.11, 10.5],
    // Hole sits on the top terrace (y = 1.8); the cup visuals use holePos[1].
    holePos: [0, 1.8, -8.5],
    bounds: { width: 10, length: 24 },
    accent: "#fb7185",
    hint: "Climb three terraces — each ramp lifts you to the next. Fall off and you'll have to climb again; the water below is not forgiving.",
    walls: [
      ...boundaryWalls(10, 24),
      // Guard walls on the middle terrace (top y = 1.2), open at the south
      // (ramp in) and north (ramp out) ends.
      { pos: [-2, 1.6, -2], size: [0.4, 0.8, 4], color: "#5b4636" },
      { pos: [2, 1.6, -2], size: [0.4, 0.8, 4], color: "#5b4636" },
      // Guard walls on the top terrace (top y = 1.8), open at the south
      // (ramp in) end only.
      { pos: [-2, 2.2, -8.5], size: [0.4, 0.8, 3], color: "#5b4636" },
      { pos: [2, 2.2, -8.5], size: [0.4, 0.8, 3], color: "#5b4636" },
      { pos: [0, 2.2, -10], size: [4.4, 0.8, 0.4], color: "#5b4636" },
    ],
    ramps: [
      // Ground (0) -> terrace 1 (top 0.6)
      { pos: [0, 0, 7], size: [3, 0.6, 3], rotationY: 0, color: "#c8854a" },
      // Terrace 1 (0.6) -> terrace 2 (top 1.2)
      { pos: [0, 0.6, 0.5], size: [3, 0.6, 3], rotationY: 0, color: "#c8854a" },
      // Terrace 2 (1.2) -> terrace 3 (top 1.8)
      { pos: [0, 1.2, -5.5], size: [3, 0.6, 3], rotationY: 0, color: "#c8854a" },
    ],
    // Terraces are static moving platforms (distance 0): their flat tops are
    // the only raised floors the physics engine supports.
    movingPlatforms: [
      { pos: [0, 0.1, 4], size: [4, 0.5, 4], axis: "x", distance: 0, speed: 1, phase: 0, color: "#0e7490" },
      { pos: [0, 0.7, -2], size: [4, 0.5, 4], axis: "x", distance: 0, speed: 1, phase: 0, color: "#0e7490" },
      { pos: [0, 1.3, -8.5], size: [4, 0.5, 3], axis: "x", distance: 0, speed: 1, phase: 0, color: "#0e7490" },
    ],
    waterHazards: [
      // Ground-level pools beside the climb — falling off a terrace here costs a stroke.
      { pos: [-3.8, 0, 1], size: [1.6, 8], color: "#0c4a6e" },
      { pos: [3.8, 0, -3], size: [1.6, 8], color: "#0c4a6e" },
    ],
    sandTraps: [],
    bumpers: [
      { pos: [-2.5, 0, 8], radius: 0.4, height: 0.8, color: "#f43f5e" },
      { pos: [2.5, 0, -6], radius: 0.4, height: 0.8, color: "#f59e0b" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [],
    conveyors: [],
  },

  // ---------------------------------------------------------------- Level 17
  {
    id: 17,
    name: "Flipper Frenzy",
    subtitle: "Pinball chaos at the cup",
    par: 5,
    teePos: [0, 0.11, 10.5],
    holePos: [0, 0, -10.5],
    bounds: { width: 10, length: 24 },
    accent: "#ef4444",
    hint: "Pinball chaos — bumpers, a spinner and two flippers guard the cup. The side lanes are the safe way round the water; the middle is a gamble.",
    walls: [
      ...boundaryWalls(10, 24),
      // Guide walls separating the centre bumper field from the side lanes.
      { pos: [-2.2, 0.5, 3], size: [0.5, 1, 6], color: "#5b4636" },
      { pos: [2.2, 0.5, 3], size: [0.5, 1, 6], color: "#5b4636" },
    ],
    ramps: [],
    movingPlatforms: [
      // "Flippers": fast shuttling platforms guarding the water in front of
      // the cup. They meet at the centre but never overlap.
      { pos: [-1.3, 0.05, -7.5], size: [1.5, 0.3, 0.9], axis: "x", distance: 0.55, speed: 4.5, phase: 0, color: "#dc2626" },
      { pos: [1.3, 0.05, -7.5], size: [1.5, 0.3, 0.9], axis: "x", distance: 0.55, speed: 4.5, phase: Math.PI, color: "#dc2626" },
    ],
    waterHazards: [
      // The drain: guards the direct route to the cup — go around via the sides.
      { pos: [0, 0, -8.5], size: [3, 1.6], color: "#0c4a6e" },
    ],
    sandTraps: [
      // Outlanes: slow the ball if it drifts wide up north.
      { pos: [-4.3, 0, -7], size: [1.2, 6], color: "#e0c074" },
      { pos: [4.3, 0, -7], size: [1.2, 6], color: "#e0c074" },
    ],
    bumpers: [
      { pos: [-1.1, 0, 5], radius: 0.42, height: 0.85, color: "#f43f5e" },
      { pos: [1.1, 0, 5], radius: 0.42, height: 0.85, color: "#f59e0b" },
      { pos: [0, 0, 3], radius: 0.42, height: 0.85, color: "#f43f5e" },
      { pos: [-1.1, 0, 1], radius: 0.42, height: 0.85, color: "#f59e0b" },
      { pos: [1.1, 0, 1], radius: 0.42, height: 0.85, color: "#f43f5e" },
      { pos: [-2, 0, -4.5], radius: 0.38, height: 0.8, color: "#f59e0b" },
      { pos: [2, 0, -4.5], radius: 0.38, height: 0.8, color: "#f43f5e" },
    ],
    windZones: [],
    teleporters: [],
    windmills: [
      // The spinner in the middle of the table.
      {
        pos: [0, 0, -1.5],
        bladeLength: 2.4,
        bladeWidth: 0.45,
        bladeHeight: 0.45,
        rpm: 12,
        color: "#dc2626",
      },
    ],
    conveyors: [
      // Side lanes carry the ball north, around the water, to the cup.
      { pos: [-3.2, 0, 1], size: [1.8, 0.04, 12], speed: -2.5, color: "#fbbf24" },
      { pos: [3.2, 0, 1], size: [1.8, 0.04, 12], speed: -2.5, color: "#fbbf24" },
    ],
  },
];

export function getLevel(id: number): CourseDef | undefined {
  return LEVELS.find((l) => l.id === id);
}
