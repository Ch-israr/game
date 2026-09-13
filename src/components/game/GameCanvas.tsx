"use client";

import { useRef, useCallback, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Course } from "./Course";
import { Ball } from "./Ball";
import { CameraRig } from "./CameraRig";
import { AimLine } from "./AimLine";
import { LEVELS } from "@/game/levels";
import { useGameStore } from "@/game/store";
import { createBall } from "@/game/ball-state";
import type { PhysicsBall } from "@/game/ball-state";
import { applyShot } from "@/game/physics";
import { getSound } from "@/game/sound";
import { haptic } from "@/game/haptics";

const MAX_DRAG_PX = 170;

interface SceneProps {
  ballRef: React.MutableRefObject<PhysicsBall | null>;
}

function Scene({ ballRef }: SceneProps) {
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const course = LEVELS[currentLevelIndex] ?? LEVELS[0];

  return (
    <>
      <CameraRig ballRef={ballRef} />
      <Course course={course} />
      <Ball ballRef={ballRef} course={course} levelIndex={currentLevelIndex} />
      <AimLine ballRef={ballRef} />
    </>
  );
}

// Procedural grass-textured material: a canvas with subtle noise speckle so the
// fairway isn't a flat solid color.
function useGrassTexture(baseColor: string, accent: string) {
  return useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);
    // speckle noise for grass grain
    const base = parseHex(baseColor);
    const acc = parseHex(accent);
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const t = Math.random();
      const r = Math.round(base[0] * (1 - t) + acc[0] * t);
      const g = Math.round(base[1] * (1 - t) + acc[1] * t);
      const b = Math.round(base[2] * (1 - t) + acc[2] * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const s = Math.random() * 2 + 0.5;
      ctx.fillRect(x, y, s, s);
    }
    // subtle mowing stripes
    for (let i = 0; i < size; i += 16) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, i, size, 8);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 8);
    tex.anisotropy = 4;
    return tex;
  }, [baseColor, accent]);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// The textured fairway + surrounding rough ground + sky + trees + sun.
function Environment3D() {
  const roughTex = useGrassTexture("#2f5d2a", "#1e3d1a");

  return (
    <>
      {/* Surrounding rough ground (textured) — bounded so sky shows beyond */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial map={roughTex} roughness={1} metalness={0} />
      </mesh>

      {/* Decorative trees scattered around the course edge */}
      <Trees />

      {/* A bright "sun" sprite in the sky for visual interest */}
      <Sun />
    </>
  );
}

// A glowing sun disc + directional glow.
function Sun() {
  return (
    <group position={[28, 30, -35]}>
      <mesh>
        <sphereGeometry args={[3.2, 24, 24]} />
        <meshBasicMaterial color="#fff8d6" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5, 24, 24]} />
        <meshBasicMaterial color="#fff2b0" transparent opacity={0.25} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Decorative low-poly trees — varied types (pine + round), colors, and sizes.
function Trees() {
  const trees = useMemo(() => {
    const arr: {
      pos: [number, number, number];
      scale: number;
      rot: number;
      type: "pine" | "round";
      trunkColor: string;
      leafColor: string;
    }[] = [];
    const rng = mulberry32(7);
    const trunkColors = ["#6b4f2a", "#7a5a34", "#5d4628"];
    const pineColors = ["#2f6d2f", "#357a35", "#286028", "#3a8a3a"];
    const roundColors = ["#4a8a3a", "#5a9a4a", "#3a7a2a"];
    for (let i = 0; i < 18; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 15 + rng() * 12;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const isPine = rng() > 0.4;
      arr.push({
        pos: [x, 0, z],
        scale: 0.6 + rng() * 0.9,
        rot: rng() * Math.PI,
        type: isPine ? "pine" : "round",
        trunkColor: trunkColors[Math.floor(rng() * trunkColors.length)],
        leafColor: isPine
          ? pineColors[Math.floor(rng() * pineColors.length)]
          : roundColors[Math.floor(rng() * roundColors.length)],
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={t.scale} rotation={[0, t.rot, 0]}>
          {/* trunk */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
            <meshStandardMaterial color={t.trunkColor} roughness={1} />
          </mesh>
          {t.type === "pine" ? (
            <>
              {/* pine cones */}
              <mesh position={[0, 1.6, 0]} castShadow>
                <coneGeometry args={[0.8, 1.4, 7]} />
                <meshStandardMaterial color={t.leafColor} roughness={1} />
              </mesh>
              <mesh position={[0, 2.3, 0]} castShadow>
                <coneGeometry args={[0.6, 1, 7]} />
                <meshStandardMaterial color={t.leafColor} roughness={1} />
              </mesh>
            </>
          ) : (
            <>
              {/* round/leafy tree — clustered spheres */}
              <mesh position={[0, 1.8, 0]} castShadow>
                <icosahedronGeometry args={[0.75, 0]} />
                <meshStandardMaterial color={t.leafColor} roughness={1} flatShading />
              </mesh>
              <mesh position={[0.4, 1.5, 0.2]} castShadow>
                <icosahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial color={t.leafColor} roughness={1} flatShading />
              </mesh>
              <mesh position={[-0.35, 1.6, -0.15]} castShadow>
                <icosahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color={t.leafColor} roughness={1} flatShading />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function GameCanvas() {
  const ballRef = useRef<PhysicsBall | null>(null);
  // Lazily initialize the ball physics object on first render (no effect needed)
  if (ballRef.current == null) {
    ballRef.current = createBall(LEVELS[0].teePos);
  }

  // Keep the sound engine's mute flag synced with the store (external system)
  const muted = useGameStore((s) => s.muted);
  const musicOn = useGameStore((s) => s.musicOn);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  useEffect(() => {
    getSound().setMuted(muted);
  }, [muted]);
  useEffect(() => {
    getSound().setSfxVolume(sfxVolume);
  }, [sfxVolume]);
  useEffect(() => {
    getSound().setMusicVolume(musicVolume);
  }, [musicVolume]);
  // Start/stop ambient music based on prefs. Only play during active gameplay
  // so it doesn't bleed into menus.
  const screen = useGameStore((s) => s.screen);
  useEffect(() => {
    const s = getSound();
    if (musicOn && !muted && screen === "playing") {
      s.startMusic();
    } else {
      s.stopMusic();
    }
  }, [musicOn, muted, screen]);

  const dragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lateralDev: number; // accumulated lateral deviation for spin detection
    pointerId: number | null;
  }>({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, lateralDev: 0, pointerId: null });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const st = useGameStore.getState();
    if (st.screen !== "playing") return;
    if (st.ballState !== "idle") return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lateralDev: 0,
      pointerId: e.pointerId,
    };
    st.setBallState("aiming");
    st.setAim(0, 0, 0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    const worldX = -dx;
    const worldZ = -dy;
    const mag = Math.hypot(worldX, worldZ);
    const power = Math.min(1, mag / MAX_DRAG_PX);
    let angle = 0;
    if (mag > 0.001) {
      angle = Math.atan2(worldX, -worldZ);
    }
    // Spin: accumulate lateral movement relative to the dominant drag axis.
    // The drag is "back" (dy positive = pull down), so lateral = dx.
    // Normalize by MAX_DRAG_PX so spin reaches ~1 at a full drag width sideways.
    // We use a smoothed instantaneous lateral velocity.
    const stepDx = e.clientX - ds.lastX;
    const stepDy = e.clientY - ds.lastY;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    // Only count lateral when there's meaningful forward drag (dy)
    if (Math.abs(dy) > 8) {
      const lateral = stepDx; // sideways movement this frame
      ds.lateralDev = ds.lateralDev * 0.85 + lateral * 0.15;
    }
    // Spin magnitude: lateral velocity normalized; clamp to [-1, 1]
    const spin = Math.max(-1, Math.min(1, ds.lateralDev / 12));
    useGameStore.getState().setAim(angle, power, spin);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.active) return;
    const spin = Math.max(-1, Math.min(1, ds.lateralDev / 12));
    dragState.current = { active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, lateralDev: 0, pointerId: null };
    const st = useGameStore.getState();
    if (st.aimPower > 0.06 && ballRef.current) {
      applyShot(ballRef.current, st.aimAngle, st.aimPower, spin);
      getSound().play("putt", Math.max(0.4, st.aimPower));
      haptic("putt");
      st.incrementStroke();
      st.setAim(st.aimAngle, 0, 0);
      st.setBallState("moving");
    } else {
      st.setAim(0, 0, 0);
      st.setBallState("idle");
    }
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <Canvas
        shadows="percentage"
        camera={{ position: [0, 14, 13], fov: 45, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Sky-blue background + distance fog */}
        <color attach="background" args={["#9fd3e8"]} />
        <fog attach="fog" args={["#bfe3f0", 30, 95]} />
        <Environment3D />
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <hemisphereLight args={["#dcecff", "#4a6b3a", 0.7]} />
        <directionalLight
          position={[10, 20, 8]}
          intensity={1.5}
          color="#fff6e6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-bias={-0.0004}
        />
        <Scene ballRef={ballRef} />
      </Canvas>
    </div>
  );
}
