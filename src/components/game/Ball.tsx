"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { CourseDef } from "@/game/types";
import { stepBall, resetBall, surfaceAt, BALL_RADIUS } from "@/game/physics";
import type { PhysicsBall } from "@/game/ball-state";
import { useGameStore } from "@/game/store";
import { getSound } from "@/game/sound";
import { haptic } from "@/game/haptics";
import {
  startShotRecording,
  recordPathPoint,
  endShotRecording,
  clearHoleShots,
} from "@/game/shot-recorder";

const TRAIL_MAX = 28;

interface BallProps {
  ballRef: React.MutableRefObject<PhysicsBall | null>;
  course: CourseDef;
  levelIndex: number; // changes when level changes -> reset ball
}

export function Ball({ ballRef, course, levelIndex }: BallProps) {
  const meshRef = useRef<THREE.Group>(null);
  const sinkPhase = useRef(0);
  const recordingStarted = useRef(false);

  // Ball trail: a ring-buffer of recent ball positions, kept in a ref (only
  // accessed inside useFrame callbacks — never during render). Each frame we
  // build a *new* BufferAttribute from a copied slice, so no hook return value
  // is ever mutated.
  const trailBuf = useRef<Float32Array>(new Float32Array(TRAIL_MAX * 3));
  const trailHead = useRef(0);
  const trailCount = useRef(0);
  const trailRef = useRef<THREE.Points>(null);
  const trailGeo = useMemo(() => new THREE.BufferGeometry(), []);

  // Reset ball whenever the level changes. resetBall takes the physics
  // surface height as pos[1] — the tee's surface height, not the visual
  // tee-pad height (teePos[1] = 0.11 would drop the ball on spawn).
  useEffect(() => {
    if (ballRef.current) {
      const surf = surfaceAt(course, course.teePos[0], course.teePos[2], 0);
      resetBall(ballRef.current, [
        course.teePos[0],
        surf.height,
        course.teePos[2],
      ]);
      sinkPhase.current = 0;
      trailHead.current = 0;
      trailCount.current = 0;
      trailGeo.setDrawRange(0, 0);
      clearHoleShots();
    }
  }, [levelIndex, course.teePos, trailGeo]);

  useFrame((state, delta) => {
    const ball = ballRef.current;
    const mesh = meshRef.current;
    if (!ball || !mesh) return;

    const ballState = useGameStore.getState().ballState;
    const time = state.clock.elapsedTime;

    // Start recording when the ball begins moving
    if (ballState === "moving" && !recordingStarted.current) {
      recordingStarted.current = true;
      startShotRecording(useGameStore.getState().strokes);
    }

    if (ballState === "moving") {
      // Dynamic substeps: process the full frame delta in small chunks so the
      // ball moves correctly even at low frame rates (e.g. headless browser).
      const targetStep = 1 / 90; // small enough to avoid tunneling
      const steps = Math.max(2, Math.min(40, Math.ceil(delta / targetStep)));
      const dt = delta / steps;
      for (let i = 0; i < steps; i++) {
        const ev = stepBall(ball, course, time, dt);
        if (ev.sunk) {
          useGameStore.getState().setBallState("holed");
          sinkPhase.current = 0;
          getSound().play("cup");
          haptic("sink");
          recordPathPoint(ball.x, ball.y, ball.z);
          endShotRecording();
          recordingStarted.current = false;
          break;
        }
        if (ev.waterHit) {
          getSound().play("splash");
          haptic("water");
          // Spawn splash particles at the ball's water-impact position
          spawnSplash(ball.x, 0.1, ball.z);
          const safe = { x: ball.safeX, y: ball.safeY, z: ball.safeZ };
          resetBall(ball, [safe.x, safe.y - BALL_RADIUS, safe.z]);
          useGameStore.getState().incrementStroke();
          useGameStore.getState().markWaterHit();
          useGameStore.setState({ lastPenaltyReason: "water" });
          useGameStore.getState().setBallState("idle");
          break;
        }
        if (ev.wallHit) {
          getSound().play("wall", Math.min(1.5, Math.hypot(ball.vx, ball.vz) / 6));
          haptic("wall");
        }
        if (ev.bumperHit) {
          getSound().play("bumper", Math.min(1.5, Math.hypot(ball.vx, ball.vz) / 6));
          haptic("bumper");
        }
        if (ev.teleported) {
          getSound().play("warp");
          haptic("warp");
        }
        if (ev.stopped) {
          ball.safeX = ball.x;
          ball.safeY = ball.y;
          ball.safeZ = ball.z;
          useGameStore.getState().setBallState("idle");
          break;
        }
      }

      // Record path point for shot replay
      recordPathPoint(ball.x, ball.y, ball.z);

      // End recording when ball stops or sinks
      const currentBallState = useGameStore.getState().ballState;
      if (currentBallState !== "moving" && recordingStarted.current) {
        endShotRecording();
        recordingStarted.current = false;
      }

      // Push trail point (only when reasonably fast)
      const speed = Math.hypot(ball.vx, ball.vy, ball.vz);
      if (speed > 1.2 && trailRef.current) {
        const buf = trailBuf.current;
        const idx = trailHead.current * 3;
        buf[idx] = ball.x;
        buf[idx + 1] = ball.y;
        buf[idx + 2] = ball.z;
        trailHead.current = (trailHead.current + 1) % TRAIL_MAX;
        trailCount.current = Math.min(trailCount.current + 1, TRAIL_MAX);
        // Build a fresh ordered array (oldest -> newest) and a new attribute
        const ordered = new Float32Array(trailCount.current * 3);
        for (let k = 0; k < trailCount.current; k++) {
          const src =
            ((trailHead.current - trailCount.current + k + TRAIL_MAX) % TRAIL_MAX) * 3;
          ordered[k * 3] = buf[src];
          ordered[k * 3 + 1] = buf[src + 1];
          ordered[k * 3 + 2] = buf[src + 2];
        }
        trailGeo.setAttribute("position", new THREE.BufferAttribute(ordered, 3));
        trailGeo.setDrawRange(0, trailCount.current);
        const mat = trailRef.current.material as THREE.PointsMaterial;
        mat.opacity = Math.min(0.7, speed / 12);
      }
    } else if (ballState === "holed" || ballState === "sunk") {
      sinkPhase.current += delta * 3;
      const p = Math.min(sinkPhase.current, 1.5);
      ball.y = course.holePos[1] + 0.06 - p * 0.25;
      const s = Math.max(0.05, 1 - p * 0.7);
      mesh.scale.setScalar(s);
      if (ballState === "holed" && sinkPhase.current > 0.6) {
        useGameStore.getState().ballSunk();
      }
    } else {
      mesh.scale.setScalar(1);
      // fade out trail when idle
      if (trailRef.current && trailCount.current > 0) {
        const mat = trailRef.current.material as THREE.PointsMaterial;
        mat.opacity *= 0.85;
        if (mat.opacity < 0.02) {
          trailCount.current = 0;
          trailHead.current = 0;
          trailGeo.setDrawRange(0, 0);
        }
      }
    }

    // Sync mesh transform
    mesh.position.set(ball.x, ball.y, ball.z);
  });

  return (
    <>
      {/* Ball trail (points that fade with speed) */}
      <points ref={trailRef} geometry={trailGeo} frustumCulled={false}>
        <pointsMaterial
          color="#ffffff"
          size={0.16}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <group ref={meshRef}>
        {/* Soft contact shadow that scales with height (fake AO) */}
        <ShadowBlob ballRef={ballRef} />
        {/* The golf ball — glossy with environment reflection */}
        <mesh castShadow>
          <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.18}
            metalness={0.15}
            envMapIntensity={1.1}
          />
        </mesh>
      </group>

      {/* Splash particle bursts (spawned on water hits) */}
      <SplashBursts />
    </>
  );
}

// ---- Splash particle system -------------------------------------------------
interface SplashBurst {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; // 0..1 remaining
}
const SPLASH_BURSTS: SplashBurst[] = [];
const SPLASH_PARTICLES_PER_HIT = 14;

function spawnSplash(x: number, y: number, z: number) {
  for (let i = 0; i < SPLASH_PARTICLES_PER_HIT; i++) {
    const ang = (i / SPLASH_PARTICLES_PER_HIT) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 2 + Math.random() * 3;
    SPLASH_BURSTS.push({
      x,
      y,
      z,
      vx: Math.cos(ang) * speed,
      vy: 3 + Math.random() * 3.5,
      vz: Math.sin(ang) * speed,
      life: 1,
    });
  }
}

const SPLASH_GRAVITY = 16;
const MAX_BURSTS = 200;

function SplashBursts() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_BURSTS * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MAX_BURSTS * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);

  useFrame((_, delta) => {
    if (SPLASH_BURSTS.length === 0) {
      if (geo.drawRange.count !== 0) geo.setDrawRange(0, 0);
      return;
    }
    const dt = Math.min(delta, 1 / 30);
    // update physics
    for (const p of SPLASH_BURSTS) {
      p.vy -= SPLASH_GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt * 1.3;
      if (p.y < 0.02) {
        p.y = 0.02;
        p.vy = Math.abs(p.vy) * 0.3; // tiny bounce
        p.vx *= 0.5;
        p.vz *= 0.5;
      }
    }
    // cull dead
    for (let i = SPLASH_BURSTS.length - 1; i >= 0; i--) {
      if (SPLASH_BURSTS[i].life <= 0) SPLASH_BURSTS.splice(i, 1);
    }
    // Build fresh buffers (no mutation of hook-return arrays) and replace attrs
    const n = Math.min(SPLASH_BURSTS.length, MAX_BURSTS);
    const posArr = new Float32Array(n * 3);
    const colArr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = SPLASH_BURSTS[i];
      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
      const lf = Math.max(0, p.life);
      colArr[i * 3] = 0.55 * lf;
      colArr[i * 3 + 1] = 0.85 * lf;
      colArr[i * 3 + 2] = 1.0 * lf;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
    geo.setDrawRange(0, n);
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.14}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// A circular shadow blob that stays on the ground under the ball and
// scales/fades with the ball's height (so jumps feel airy).
function ShadowBlob({ ballRef }: { ballRef: React.MutableRefObject<PhysicsBall | null> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const ball = ballRef.current;
    const mesh = ref.current;
    if (!ball || !mesh) return;
    // ground height is ~0; ball sits at BALL_RADIUS when grounded
    const h = Math.max(0, ball.y - BALL_RADIUS);
    const scale = Math.max(0.45, 1 - h * 0.18);
    const op = Math.max(0.05, 0.32 - h * 0.05);
    mesh.scale.setScalar(scale);
    mesh.position.set(ball.x, 0.015, ball.z);
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = op;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[BALL_RADIUS * 1.3, 24]} />
      <meshBasicMaterial color="#0a1a0a" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}
