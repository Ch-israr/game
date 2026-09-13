// Core type definitions for the 3D Mini Golf game

export type Vec3 = [number, number, number];

export type BallState = "idle" | "aiming" | "moving" | "holed" | "sunk";

export interface WallDef {
  pos: Vec3;
  size: Vec3; // width, height, depth
  color?: string;
}

export interface RampDef {
  pos: Vec3; // center of the ramp base
  size: Vec3; // width (x), height (peak), depth (z)
  rotationY: number; // radians, direction the ramp ascends toward
  color?: string;
}

export interface MovingPlatformDef {
  pos: Vec3; // center resting position
  size: Vec3; // width, height, depth
  axis: "x" | "z";
  distance: number; // travel distance from center
  speed: number; // units per second
  phase?: number; // starting phase 0..2PI
  color?: string;
}

export interface WaterHazardDef {
  pos: Vec3;
  size: Vec3; // width, depth (y is surface height)
  color?: string;
}

export interface SandTrapDef {
  pos: Vec3;
  size: Vec3;
  color?: string;
}

export interface BumperDef {
  // Circular bouncy bumper
  pos: Vec3;
  radius: number;
  height?: number;
  color?: string;
}

export interface WindZoneDef {
  // A rectangular zone that applies a constant force to the ball while inside.
  pos: Vec3; // center (xz), y is display height
  size: Vec3; // width (x), height (y, visual only), depth (z)
  force: Vec3; // acceleration applied per second [x, y, z]
  color?: string;
}

export interface TeleporterDef {
  // Pair of pads: enter one, exit the other instantly.
  pos: Vec3; // pad center
  radius: number;
  target: Vec3; // exit position (will be snapped to ground)
  color?: string;
}

export interface WindmillDef {
  // A rotating blade assembly that knocks the ball around.
  pos: Vec3; // center of the hub (on the ground)
  bladeLength: number; // length of each blade from hub
  bladeWidth: number;
  bladeHeight: number;
  rpm: number; // rotations per minute (sign = direction)
  color?: string;
}

export interface ConveyorDef {
  // A rectangular belt that pushes the ball along its forward axis.
  pos: Vec3; // center
  size: Vec3; // width (x), height (y, visual), length (z, forward axis)
  speed: number; // units/sec along +z (negative = -z)
  color?: string;
}

export interface CourseDef {
  id: number;
  name: string;
  subtitle: string;
  par: number;
  teePos: Vec3;
  holePos: Vec3;
  // Course fairway bounds (rectangle centered at origin in XZ plane)
  bounds: { width: number; length: number };
  accent: string; // accent color for theme
  walls: WallDef[];
  ramps: RampDef[];
  movingPlatforms: MovingPlatformDef[];
  waterHazards: WaterHazardDef[];
  sandTraps: SandTrapDef[];
  bumpers: BumperDef[];
  windZones: WindZoneDef[];
  teleporters: TeleporterDef[];
  windmills: WindmillDef[];
  conveyors: ConveyorDef[];
  // optional intro hint shown on level start
  hint?: string;
}

export interface LevelResult {
  strokes: number;
  par: number;
  score: ScoreGrade;
}

export type ScoreGrade = "hole-in-one" | "eagle" | "birdie" | "par" | "bogey" | "double-bogey" | "over";
