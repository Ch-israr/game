"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/game/store";
import type { PhysicsBall } from "@/game/ball-state";
import { BALL_RADIUS, SPIN_FORCE } from "@/game/physics";

interface AimLineProps {
  ballRef: React.MutableRefObject<PhysicsBall | null>;
}

const MIN_LEN = 0.6;
const MAX_LEN = 4.5;

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

export function AimLine({ ballRef }: AimLineProps) {
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

  useFrame(() => {
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

    const len = MIN_LEN + aimPower * (MAX_LEN - MIN_LEN);
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

    // Build a curved trajectory preview when spin is significant.
    // We simulate a lightweight version of the Magnus effect to draw the arc.
    if (curveRef.current) {
      const spin = aimSpin;
      if (Math.abs(spin) > 0.08 && aimPower > 0.1) {
        curveRef.current.visible = true;
        const speed = aimPower * 15; // approx MAX_SHOT_SPEED
        let vx = 0;
        let vz = -1; // forward in local space
        let px = 0;
        let pz = 0;
        const pts = 30;
        const arr = new Float32Array(pts * 3);
        let written = 0;
        for (let i = 0; i < pts; i++) {
          const dt = 0.06;
          const sp = Math.hypot(vx, vz);
          if (sp < 0.05) break;
          if (spin !== 0) {
            const perpX = -vz / sp;
            const perpZ = vx / sp;
            const mag = spin * SPIN_FORCE * dt;
            vx += perpX * mag;
            vz += perpZ * mag;
          }
          // friction decay
          vx *= 1 - 0.03;
          vz *= 1 - 0.03;
          px += vx * speed * dt;
          pz += vz * speed * dt;
          arr[written * 3] = px;
          arr[written * 3 + 1] = 0;
          arr[written * 3 + 2] = pz;
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
