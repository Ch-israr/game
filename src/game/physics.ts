import type { CourseDef, MovingPlatformDef, RampDef } from "./types";
import type { PhysicsBall } from "./ball-state";
import { getDifficultyConfig } from "./difficulty";

// ---- Tunable constants --------------------------------------------------
export const BALL_RADIUS = 0.2;
export const GRAVITY = 26;
export const GROUND_FRICTION = 2.0; // deceleration on grass (units/s^2)
export const SAND_FRICTION = 4.5; // sand slows the ball but no longer kills a full putt
export const AIR_DRAG = 0.15;
export const WALL_RESTITUTION = 0.62; // kept: lower values break the bank-shot routes on L2/L8 (solver-verified)
export const BUMPER_RESTITUTION = 0.9; // bumpers return most energy, never add any
export const REST_SPEED = 0.16; // below this speed, ball can come to rest
export const REST_FRAMES = 8; // consecutive slow frames before stopping
export const HOLE_RADIUS = 0.38;
export const HOLE_CAPTURE_SPEED = 4; // a putt must arrive at a makeable pace
export const HOLE_ATTRACT_RADIUS = 0.6;
export const MAX_SHOT_SPEED = 15;
export const SPIN_FORCE = 4.0; // Magnus side-force coefficient for curved shots
export const WINDMILL_MAX_SPEED = 6; // a windmill hit never launches the ball faster than this
export const PLATFORM_TOP_Y_OFFSET = 0; // platforms store their top in pos.y + size.y

// ---- Helpers ------------------------------------------------------------
function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function platformPosition(plat: MovingPlatformDef, time: number) {
  const phase = plat.phase ?? 0;
  const offset = Math.sin(plat.speed * time + phase) * plat.distance;
  const vel = plat.speed * Math.cos(plat.speed * time + phase) * plat.distance;
  const pos = [...plat.pos] as [number, number, number];
  const v = [0, 0, 0] as [number, number, number];
  if (plat.axis === "x") {
    pos[0] += offset;
    v[0] = vel;
  } else {
    pos[2] += offset;
    v[2] = vel;
  }
  return { pos, vel: v };
}

// Returns the surface height at (x,z) considering ramps and platforms,
// plus the surface normal (world space) and a tag describing what we're on.
export interface SurfaceInfo {
  height: number;
  normal: [number, number, number];
  kind: "ground" | "ramp" | "platform";
  rampIndex?: number;
  platformIndex?: number;
}

function transformLocal(ramp: RampDef, x: number, z: number) {
  const dx = x - ramp.pos[0];
  const dz = z - ramp.pos[2];
  const c = Math.cos(ramp.rotationY);
  const s = Math.sin(ramp.rotationY);
  // local = R^T (world - pos)
  return { lx: c * dx - s * dz, lz: s * dx + c * dz };
}

function rampSurface(ramp: RampDef, x: number, z: number): SurfaceInfo | null {
  const { lx, lz } = transformLocal(ramp, x, z);
  const w = ramp.size[0];
  const d = ramp.size[2];
  if (Math.abs(lx) > w / 2 || Math.abs(lz) > d / 2) return null;
  // slope ascends toward -local Z (peak at lz = -d/2)
  const peak = ramp.size[1];
  const t = clamp(0.5 - lz / d, 0, 1); // 0 at near edge, 1 at far edge
  const height = ramp.pos[1] + peak * t;
  // surface normal in local space (computed earlier): (0, d, peak) normalized
  const nl = Math.hypot(d, peak) || 1;
  let nx = 0;
  let ny = d / nl;
  let nz = peak / nl;
  // rotate normal to world (R * n_local)
  const c = Math.cos(ramp.rotationY);
  const s = Math.sin(ramp.rotationY);
  const wnx = c * nx + s * nz;
  const wnz = -s * nx + c * nz;
  return { height, normal: [wnx, ny, wnz], kind: "ramp" };
}

export function surfaceAt(
  course: CourseDef,
  x: number,
  z: number,
  time: number
): SurfaceInfo {
  let best: SurfaceInfo = { height: 0, normal: [0, 1, 0], kind: "ground" };
  // Check ramps
  for (let i = 0; i < course.ramps.length; i++) {
    const r = rampSurface(course.ramps[i], x, z);
    if (r && r.height > best.height) {
      best = { ...r, rampIndex: i };
    }
  }
  // Check moving platforms (top surface). Platform top is pos.y + size.y/2? we treat size.y as full height, top = pos.y + size.y
  for (let i = 0; i < course.movingPlatforms.length; i++) {
    const p = course.movingPlatforms[i];
    const { pos } = platformPosition(p, time);
    const hw = p.size[0] / 2;
    const hd = p.size[2] / 2;
    const top = pos[1] + p.size[1];
    if (
      x >= pos[0] - hw &&
      x <= pos[0] + hw &&
      z >= pos[2] - hd &&
      z <= pos[2] + hd &&
      top > best.height
    ) {
      best = { height: top, normal: [0, 1, 0], kind: "platform", platformIndex: i };
    }
  }
  return best;
}

function inRect(
  x: number,
  z: number,
  rx: number,
  rz: number,
  rw: number,
  rd: number
) {
  return (
    x >= rx - rw / 2 && x <= rx + rw / 2 && z >= rz - rd / 2 && z <= rz + rd / 2
  );
}

export interface StepEvents {
  sunk: boolean;
  waterHit: boolean;
  stopped: boolean;
  wallHit: boolean; // a significant wall/bumper collision occurred (for SFX)
  bumperHit: boolean;
  teleported: boolean;
}

// Advance the ball one physics step. Mutates `ball` in place and returns events.
export function stepBall(
  ball: PhysicsBall,
  course: CourseDef,
  time: number,
  dtIn: number
): StepEvents {
  const dt = Math.min(dtIn, 1 / 20); // cap individual substep to avoid tunneling
  const events: StepEvents = { sunk: false, waterHit: false, stopped: false, wallHit: false, bumperHit: false, teleported: false };

  // Hole attraction / capture check first (works regardless of grounded)
  const ddx = ball.x - course.holePos[0];
  const ddz = ball.z - course.holePos[2];
  const holeDist = Math.hypot(ddx, ddz);
  const speed = Math.hypot(ball.vx, ball.vy, ball.vz);
  if (holeDist < HOLE_RADIUS && speed < HOLE_CAPTURE_SPEED) {
    events.sunk = true;
    return events;
  }
  // gentle attraction when slow & near the cup
  if (holeDist < HOLE_ATTRACT_RADIUS && speed < HOLE_CAPTURE_SPEED * 1.6) {
    const pull = (1 - holeDist / HOLE_ATTRACT_RADIUS) * 2.5;
    ball.vx -= (ddx / (holeDist || 1)) * pull * dt;
    ball.vz -= (ddz / (holeDist || 1)) * pull * dt;
  }

  // Determine support surface
  const surf = surfaceAt(course, ball.x, ball.z, time);
  const grounded = ball.y <= surf.height + BALL_RADIUS + 0.02;

  if (grounded) {
    // Snap to surface
    ball.y = surf.height + BALL_RADIUS;
    const n = surf.normal;
    // Rolling contact: always project velocity onto the tangent plane,
    // removing the normal component regardless of sign. Previously only
    // the into-surface component was removed (with a small bounce), so a
    // ball that landed with a little upward speed kept vy ≈ +0.65
    // forever: speed stayed above REST_SPEED, restFrames never counted,
    // and the ball never came to rest (soft-lock — no next shot).
    const vn = ball.vx * n[0] + ball.vy * n[1] + ball.vz * n[2];
    ball.vx -= vn * n[0];
    ball.vy -= vn * n[1];
    ball.vz -= vn * n[2];

    // Tangential gravity (slope acceleration along surface)
    const gn = 0 * n[0] + -GRAVITY * n[1] + 0 * n[2];
    const ax = 0 - gn * n[0];
    const ay = -GRAVITY - gn * n[1];
    const az = 0 - gn * n[2];
    ball.vx += ax * dt;
    ball.vy += ay * dt;
    ball.vz += az * dt;
    // remove the normal component that tangential gravity may have re-introduced
    const vn2 = ball.vx * n[0] + ball.vy * n[1] + ball.vz * n[2];
    ball.vx -= vn2 * n[0];
    ball.vy -= vn2 * n[1];
    ball.vz -= vn2 * n[2];

    // Friction (sand is much higher) — scaled by difficulty
    const dc = getDifficultyConfig();
    let friction = GROUND_FRICTION * dc.frictionMul;
    for (const s of course.sandTraps) {
      if (inRect(ball.x, ball.z, s.pos[0], s.pos[2], s.size[0], s.size[1])) {
        friction = SAND_FRICTION * dc.frictionMul;
        break;
      }
    }
    const horizSpeed = Math.hypot(ball.vx, ball.vz);
    if (horizSpeed > 0.0001) {
      const decel = friction * dt;
      const factor = Math.max(0, 1 - decel / horizSpeed);
      ball.vx *= factor;
      ball.vz *= factor;
    }
    // zero tiny vertical drift while grounded
    if (Math.abs(ball.vy) < 0.3) ball.vy = 0;

    // Magnus effect: side spin curves the ball's path perpendicular to velocity.
    // Force = spin * speed * coefficient, applied perpendicular to motion dir.
    if (ball.spin !== 0) {
      const sp = Math.hypot(ball.vx, ball.vz);
      if (sp > 0.1) {
        // perpendicular to velocity in XZ: (-vz, vx) normalized
        const perpX = -ball.vz / sp;
        const perpZ = ball.vx / sp;
        const mag = ball.spin * SPIN_FORCE * dt;
        ball.vx += perpX * mag;
        ball.vz += perpZ * mag;
        // spin decays over time
        ball.spin *= Math.max(0, 1 - dt * 0.8);
        if (Math.abs(ball.spin) < 0.02) ball.spin = 0;
      }
    }

    // Wind zone force (applies while grounded too, as a horizontal push)
    for (const wz of course.windZones) {
      if (inRect(ball.x, ball.z, wz.pos[0], wz.pos[2], wz.size[0], wz.size[2])) {
        ball.vx += wz.force[0] * dc.windForceMul * dt;
        ball.vz += wz.force[2] * dc.windForceMul * dt;
        break; // only one zone at a time
      }
    }

    // Conveyor belt push (grounded only — drags the ball along its forward axis)
    for (const cv of course.conveyors) {
      if (inRect(ball.x, ball.z, cv.pos[0], cv.pos[2], cv.size[0], cv.size[2])) {
        // Drag the ball's z-velocity toward the belt speed and never
        // beyond it. Previously a constant acceleration (cv.speed * dt *
        // 3.0) stacked on top of the ball's own speed, so a resting ball
        // reached ~2x the belt speed.
        const dv = cv.speed - ball.vz;
        const maxDelta = 6.0 * dt; // belt accel rate (u/s^2)
        ball.vz += Math.abs(dv) <= maxDelta ? dv : Math.sign(dv) * maxDelta;
        break;
      }
    }

    // Water hazard check (only when truly grounded on the ground level)
    if (surf.kind === "ground" && ball.y - BALL_RADIUS < 0.06) {
      for (const w of course.waterHazards) {
        if (inRect(ball.x, ball.z, w.pos[0], w.pos[2], w.size[0], w.size[1])) {
          events.waterHit = true;
          return events;
        }
      }
    }

    // Moving platform carry
    if (surf.kind === "platform" && surf.platformIndex !== undefined) {
      const p = course.movingPlatforms[surf.platformIndex];
      const { vel } = platformPosition(p, time);
      ball.x += vel[0] * dt;
      ball.z += vel[2] * dt;
      ball.onPlatform = surf.platformIndex;
    } else {
      ball.onPlatform = null;
    }
  } else {
    // Airborne
    ball.vy -= GRAVITY * dt;
    ball.vx *= 1 - AIR_DRAG * dt;
    ball.vz *= 1 - AIR_DRAG * dt;
    ball.onPlatform = null;
    // Wind also affects the ball in the air (slightly stronger)
    const dc2 = getDifficultyConfig();
    for (const wz of course.windZones) {
      if (inRect(ball.x, ball.z, wz.pos[0], wz.pos[2], wz.size[0], wz.size[2])) {
        ball.vx += wz.force[0] * dc2.windForceMul * dt * 1.3;
        ball.vz += wz.force[2] * dc2.windForceMul * dt * 1.3;
        break;
      }
    }
  }

  // Integrate position
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;

  // Teleporter check (only when grounded-ish & slow enough to not re-trigger)
  if (!ball.justTeleported) {
    for (const tp of course.teleporters) {
      const tdx = ball.x - tp.pos[0];
      const tdz = ball.z - tp.pos[2];
      if (tdx * tdx + tdz * tdz < tp.radius * tp.radius) {
        ball.x = tp.target[0];
        ball.z = tp.target[2];
        ball.y = Math.max(ball.y, 0.12 + BALL_RADIUS);
        // dampen velocity a bit so it doesn't immediately fly back
        ball.vx *= 0.55;
        ball.vz *= 0.55;
        ball.justTeleported = true;
        events.teleported = true;
        break;
      }
    }
  } else {
    // clear the flag once we've left all teleporter pads
    let stillOnPad = false;
    for (const tp of course.teleporters) {
      const tdx = ball.x - tp.pos[0];
      const tdz = ball.z - tp.pos[2];
      if (tdx * tdx + tdz * tdz < tp.radius * tp.radius) {
        stillOnPad = true;
        break;
      }
    }
    if (!stillOnPad) ball.justTeleported = false;
  }

  // Clamp inside course bounds (soft, so ball can't escape the fairway)
  const halfW = course.bounds.width / 2;
  const halfL = course.bounds.length / 2;
  if (ball.x < -halfW + BALL_RADIUS) {
    ball.x = -halfW + BALL_RADIUS;
    ball.vx = Math.abs(ball.vx) * WALL_RESTITUTION;
  } else if (ball.x > halfW - BALL_RADIUS) {
    ball.x = halfW - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx) * WALL_RESTITUTION;
  }
  if (ball.z < -halfL + BALL_RADIUS) {
    ball.z = -halfL + BALL_RADIUS;
    ball.vz = Math.abs(ball.vz) * WALL_RESTITUTION;
  } else if (ball.z > halfL - BALL_RADIUS) {
    ball.z = halfL - BALL_RADIUS;
    ball.vz = -Math.abs(ball.vz) * WALL_RESTITUTION;
  }

  // Wall collisions (sphere vs AABB)
  for (const wall of course.walls) {
    const cx = clamp(ball.x, wall.pos[0] - wall.size[0] / 2, wall.pos[0] + wall.size[0] / 2);
    const cy = clamp(ball.y, wall.pos[1] - wall.size[1] / 2, wall.pos[1] + wall.size[1] / 2);
    const cz = clamp(ball.z, wall.pos[2] - wall.size[2] / 2, wall.pos[2] + wall.size[2] / 2);
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dz = ball.z - cz;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < BALL_RADIUS * BALL_RADIUS) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      // push out
      const pen = BALL_RADIUS - dist;
      ball.x += nx * pen;
      ball.y += ny * pen;
      ball.z += nz * pen;
      // reflect velocity along normal
      const vn = ball.vx * nx + ball.vy * ny + ball.vz * nz;
      if (vn < 0) {
        const impactSpeed = Math.abs(vn);
        ball.vx -= (1 + WALL_RESTITUTION) * vn * nx;
        ball.vy -= (1 + WALL_RESTITUTION) * vn * ny;
        ball.vz -= (1 + WALL_RESTITUTION) * vn * nz;
        if (impactSpeed > 1.2) events.wallHit = true;
      }
    }
  }

  // Moving platform side collisions (treat as AABB that moves)
  for (let i = 0; i < course.movingPlatforms.length; i++) {
    const p = course.movingPlatforms[i];
    const { pos } = platformPosition(p, time);
    const cx = clamp(ball.x, pos[0] - p.size[0] / 2, pos[0] + p.size[0] / 2);
    const cy = clamp(ball.y, pos[1] - p.size[1] / 2, pos[1] + p.size[1] / 2);
    const cz = clamp(ball.z, pos[2] - p.size[2] / 2, pos[2] + p.size[2] / 2);
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dz = ball.z - cz;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < BALL_RADIUS * BALL_RADIUS && ball.y - BALL_RADIUS < pos[1] + p.size[1] - 0.05) {
      // only collide with sides (not when resting on top)
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const nz = dz / dist;
      const pen = BALL_RADIUS - dist;
      ball.x += nx * pen;
      ball.z += nz * pen;
      const vn = ball.vx * nx + ball.vz * nz;
      if (vn < 0) {
        ball.vx -= (1 + WALL_RESTITUTION) * vn * nx;
        ball.vz -= (1 + WALL_RESTITUTION) * vn * nz;
      }
    }
  }

  // Bumper collisions (circular, in XZ)
  const dcBumper = getDifficultyConfig();
  const bumperRest = BUMPER_RESTITUTION * dcBumper.bumperRestitutionMul;
  for (const b of course.bumpers) {
    const dx = ball.x - b.pos[0];
    const dz = ball.z - b.pos[2];
    const minDist = b.radius + BALL_RADIUS;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const nz = dz / dist;
      const pen = minDist - dist;
      ball.x += nx * pen;
      ball.z += nz * pen;
      const vn = ball.vx * nx + ball.vz * nz;
      if (vn < 0) {
        ball.vx -= (1 + bumperRest) * vn * nx;
        ball.vz -= (1 + bumperRest) * vn * nz;
      }
      // No extra kick for glancing contact: bumpers return energy, they
      // never add it (the old +1.5 u/s kick turned a 3.0 u/s tap into a
      // 3.76 u/s launch).
      events.bumperHit = true;
    }
  }

  // Windmill blade collisions — rotating rectangular blades that knock the ball.
  // Each windmill has 4 blades; we treat each as a thin rotating box and do
  // a simplified swept check: transform the ball into the blade's local frame
  // (origin at hub, rotated by current angle) and test AABB overlap.
  for (const wm of course.windmills) {
    const ang = (time * wm.rpm * 2 * Math.PI) / 60; // current rotation (radians)
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    // ball relative to hub
    const rx = ball.x - wm.pos[0];
    const rz = ball.z - wm.pos[2];
    // Check all 4 blades (each is offset by 90°). A blade extends from hub to
    // bladeLength along its local +x axis, width = bladeWidth (local z), height ~ bladeHeight.
    for (let bi = 0; bi < 4; bi++) {
      const ba = ang + (bi * Math.PI) / 2;
      const bc = Math.cos(ba);
      const bs = Math.sin(ba);
      // transform ball into this blade's local frame
      const lx = rx * bc + rz * bs;
      const lz = -rx * bs + rz * bc;
      // blade spans lx in [0, bladeLength], lz in [-bladeWidth/2, bladeWidth/2]
      if (
        lx > -BALL_RADIUS &&
        lx < wm.bladeLength + BALL_RADIUS &&
        lz > -wm.bladeWidth / 2 - BALL_RADIUS &&
        lz < wm.bladeWidth / 2 + BALL_RADIUS &&
        ball.y < wm.bladeHeight + BALL_RADIUS
      ) {
        // Collision: one kick per contact, never a runaway.
        // - Push the ball out along the blade's thickness normal (blade
        //   local +z in world coords) so the contact ends this step.
        // - Impart the blade's tangential speed at the contact radius as
        //   a single impulse: the blade drags the ball up to its own
        //   speed, it does not add a full velocity increment every step
        //   (the old code added omega*r*0.6 per step with no dt scaling,
        //   flinging a parked ball to ~14 u/s).
        // - Hard-cap the resulting speed so a windmill hit knocks the
        //   ball aside firmly but never launches it across the course.
        const radialLen = Math.hypot(rx, rz) || 0.0001;
        const nx = rx / radialLen;
        const nz = rz / radialLen;
        // blade local +z maps to world (-sin(ba), cos(ba))
        const nnx = -bs;
        const nnz = bc;
        const pushDir = lz >= 0 ? 1 : -1;
        const pen =
          wm.bladeWidth / 2 + BALL_RADIUS - Math.abs(lz) + 0.02;
        ball.x += nnx * pushDir * Math.max(0, pen);
        ball.z += nnz * pushDir * Math.max(0, pen);
        // tangential velocity from rotation: v = omega × r (in XZ plane, 2D)
        const omega = (wm.rpm * 2 * Math.PI) / 60; // rad/s
        const tangX = -nz;
        const tangZ = nx;
        const bladeT = omega * radialLen; // blade surface speed here
        const ballT = ball.vx * tangX + ball.vz * tangZ;
        const targetT = Math.min(bladeT, WINDMILL_MAX_SPEED);
        if (ballT < targetT) {
          ball.vx += tangX * (targetT - ballT);
          ball.vz += tangZ * (targetT - ballT);
        }
        // also reflect existing velocity a bit (radial / into-blade part)
        const vn = ball.vx * nx + ball.vz * nz;
        if (vn < 0) {
          ball.vx -= (1 + 0.5) * vn * nx;
          ball.vz -= (1 + 0.5) * vn * nz;
        }
        // hard cap on total horizontal speed after the hit
        const sp = Math.hypot(ball.vx, ball.vz);
        if (sp > WINDMILL_MAX_SPEED) {
          ball.vx *= WINDMILL_MAX_SPEED / sp;
          ball.vz *= WINDMILL_MAX_SPEED / sp;
        }
        events.wallHit = true; // reuse wall SFX
        break; // one blade hit per windmill per step is enough
      }
    }
    void cos;
    void sin;
  }

  // Rest detection
  const finalSpeed = Math.hypot(ball.vx, ball.vy, ball.vz);
  if (finalSpeed < REST_SPEED && grounded) {
    ball.restFrames = (ball.restFrames ?? 0) + 1;
    if (ball.restFrames >= REST_FRAMES) {
      ball.vx = 0;
      ball.vy = 0;
      ball.vz = 0;
      events.stopped = true;
    }
  } else {
    ball.restFrames = 0;
  }

  // Safety: if ball falls below the world, reset to safe pos
  if (ball.y < -3) {
    events.waterHit = true;
  }

  return events;
}

// Apply an impulse to the ball from a shot.
export function applyShot(
  ball: PhysicsBall,
  aimAngle: number,
  power: number,
  spin = 0
) {
  const dc = getDifficultyConfig();
  const speed = clamp(power, 0, 1) * MAX_SHOT_SPEED * dc.maxShotSpeedMul;
  // aimAngle: 0 = forward (-Z), positive rotates CCW
  ball.vx = Math.sin(aimAngle) * speed;
  ball.vz = -Math.cos(aimAngle) * speed;
  ball.vy = 0;
  ball.spin = clamp(spin, -1, 1);
  ball.restFrames = 0;
}

// Reset the ball to a spawn position. `pos[1]` is the PHYSICS surface
// height under the spawn point (ground = 0) — NOT the visual tee-pad
// height (teePos[1] = 0.11). Passing the visual height dropped the ball
// 0.11 on spawn, which fed the soft-lock bounce; callers must pass the
// surface height (see Ball.tsx, which uses surfaceAt for the tee).
export function resetBall(ball: PhysicsBall, pos: [number, number, number]) {
  ball.x = pos[0];
  ball.y = pos[1] + BALL_RADIUS;
  ball.z = pos[2];
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.spin = 0;
  ball.restFrames = 0;
  ball.onPlatform = null;
  ball.justTeleported = false;
  ball.safeX = pos[0];
  ball.safeY = pos[1] + BALL_RADIUS;
  ball.safeZ = pos[2];
}
