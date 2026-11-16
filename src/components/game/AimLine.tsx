"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/game/store";
import type { PhysicsBall } from "@/game/ball-state";
import type { CourseDef } from "@/game/types";
import { BALL_RADIUS, stepBall, applyShot } from "@/game/physics";

interface AimLineProps {
  ballRef: React.MutableRefObject<PhysicsBall | null>;
  course: CourseDef;
}

const MIN_LEN = 0.6;
const MAX_PREDICT_LEN = 30; // cap on the predicted rollout shown
const SIM_DT = 1 / 60;
const SIM_MAX_STEPS = 480; // up to 8s of simulated rollout
const CURVE_POINTS = 30;

function powerColor(p: number): string {
  // green -> yellow -> red
  if (p < 0.5) {
    const t = p / 0.5;
    return new THREE.Color().lerpColors(
      new THREE.Color("#4ade80"),
      new THREE.Color("#facc15"),
      t
    ).getStyle();
  }
  const t = (p - 0.5) / 0.5;
  return new THREE.Color().lerpColors(
    new THREE.Color("#facc15"),
    new THREE.Color("#ef4444"),
    t
  ).getStyle();
}

export function AimLine({ ballRef, course }: AimLineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);
  // Curve preview (dotted arc showing predicted curved path)
  const curveRef = useRef<THREE.Line>(null);
  const curveGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(30 * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);

  const color = useMemo(() => new THREE.Color("#4ade80"), []);

  useFrame((state) => {
    const ball = ballRef.current;
    const group = groupRef.current;
    if (!ball || !group) return;
    const { ballState, aimAngle, aimPower, aimSpin } = useGameStore.getState();
    const visible = ballState === "aiming" && aimPower > 0.02;
    group.visible = visible;
    if (!visible) {
      if (curveRef.current) curveRef.current.visible = false;
      return;
    }

    group.position.set(ball.x, 0.12, ball.z);
    group.rotation.y = -aimAngle;

    // Predict the shot with the real engine: clone the ball, apply the
    // aimed shot, and step it forward until it stops, sinks or splashes.
    // The shaft then reaches the predicted stopping point (instead of a
    // fixed power-based length that topped out at 4.5u on an 18u hole),
    // and the curve preview follows the same simulated path — so it uses
    // the engine's constant-friction model rather than the old 3%-per-step
    // exponential decay that understated rollout by ~35%.
    const sim: PhysicsBall = {
      x: ball.x,
      y: ball.y,
      z: ball.z,
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0,
      safeX: ball.x,
      safeY: ball.y,
      safeZ: ball.z,
      onPlatform: null,
      restFrames: 0,
      justTeleported: false,
    };
    applyShot(sim, aimAngle, aimPower, aimSpin);
    const baseTime = state.clock.elapsedTime;
    const path: [number, number][] = [];
    let t = 0;
    for (let i = 0; i < SIM_MAX_STEPS; i++) {
      t += SIM_DT;
      const ev = stepBall(sim, course, baseTime + t, SIM_DT);
      if (i % 16 === 0 && path.length < CURVE_POINTS) path.push([sim.x, sim.z]);
      if (ev.sunk || ev.waterHit || ev.stopped) break;
    }
    if (path.length < CURVE_POINTS) path.push([sim.x, sim.z]);

    // shaft length: endpoint projected onto the aim direction
    const dirX = Math.sin(aimAngle);
    const dirZ = -Math.cos(aimAngle);
    const len = Math.min(
      Math.max((sim.x - ball.x) * dirX + (sim.z - ball.z) * dirZ, MIN_LEN),
      MAX_PREDICT_LEN
    );
    if (shaftRef.current) {
      shaftRef.current.scale.z = len;
      shaftRef.current.position.z = -len / 2;
    }
    if (headRef.current) {
      headRef.current.position.z = -len - 0.18;
    }
    const c = powerColor(aimPower);
    color.set(c);
    if (matRef.current) matRef.current.color.set(c);
    if (headMatRef.current) headMatRef.current.color.set(c);
    if (matRef.current) matRef.current.emissive.set(c);
    if (headMatRef.current) headMatRef.current.emissive.set(c);

    // Draw the simulated path as the curved trajectory preview when spin
    // is significant (world path converted into the group's local space:
    // local -z is the aim direction).
    if (curveRef.current) {
      const spin = aimSpin;
      if (Math.abs(spin) > 0.08 && aimPower > 0.1 && path.length > 1) {
        curveRef.current.visible = true;
        const cos = Math.cos(aimAngle);
        const sin = Math.sin(aimAngle);
        const arr = new Float32Array(CURVE_POINTS * 3);
        let written = 0;
        for (const [px, pz] of path) {
          const dx = px - ball.x;
          const dz = pz - ball.z;
          arr[written * 3] = dx * cos + dz * sin;
          arr[written * 3 + 1] = 0;
          arr[written * 3 + 2] = -dx * sin + dz * cos;
          written++;
        }
        curveGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        curveGeo.setDrawRange(0, written);
      } else {
        curveRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* shaft (thin box along -Z) */}
      <mesh ref={shaftRef} castShadow>
        <boxGeometry args={[0.09, 0.06, 1]} />
        <meshStandardMaterial ref={matRef} color="#4ade80" emissive="#4ade80" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* arrowhead cone (points along -Z) */}
      <mesh ref={headRef} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.36, 16]} />
        <meshStandardMaterial ref={headMatRef} color="#4ade80" emissive="#4ade80" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      {/* aim ring around ball */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[BALL_RADIUS + 0.06, BALL_RADIUS + 0.14, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      {/* curved trajectory preview (dotted line) — shown when spin is applied */}
      {/* Using a thin tube-like line via LineSegments would need drei; use a simple line */}
      <primitive object={makeLineObject(curveGeo)} ref={curveRef} visible={false} />
    </group>
  );
}

// Create a reusable THREE.Line object with a dashed-style material. We keep a
// module-level cache so we don't recreate materials each render.
let cachedLine: THREE.Line | null = null;
function makeLineObject(geo: THREE.BufferGeometry): THREE.Line {
  if (cachedLine) {
    cachedLine.geometry = geo;
    return cachedLine;
  }
  const mat = new THREE.LineBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.5,
  });
  const line = new THREE.Line(geo, mat);
  cachedLine = line;
  return line;
}
