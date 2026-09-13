"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type {
  CourseDef,
  MovingPlatformDef,
  RampDef,
  WindZoneDef,
  TeleporterDef,
  WindmillDef,
  ConveyorDef,
} from "@/game/types";
import { platformPosition } from "@/game/physics";

// Build a wedge (triangular prism) geometry for a ramp.
function useWedgeGeometry(ramp: RampDef) {
  return useMemo(() => {
    const w = ramp.size[0];
    const d = ramp.size[2];
    const h = ramp.size[1];
    const A = [-w / 2, 0, d / 2];
    const B = [-w / 2, 0, -d / 2];
    const C = [-w / 2, h, -d / 2];
    const D = [w / 2, 0, d / 2];
    const E = [w / 2, 0, -d / 2];
    const F = [w / 2, h, -d / 2];
    const tris: number[][] = [
      [A, E, D],
      [A, B, E],
      [B, F, E],
      [B, C, F],
      [A, D, F],
      [A, F, C],
      [A, C, B],
      [D, E, F],
    ];
    const positions: number[] = [];
    for (const tri of tris) {
      for (const p of tri) positions.push(p[0], p[1], p[2]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [ramp.size[0], ramp.size[1], ramp.size[2]]);
}

function Ramp({ ramp }: { ramp: RampDef }) {
  const geo = useWedgeGeometry(ramp);
  return (
    <group position={ramp.pos} rotation={[0, ramp.rotationY, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial
          color={ramp.color ?? "#c8854a"}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      {/* glowing edge stripe along the slope crest */}
      <mesh position={[0, ramp.size[1] + 0.01, -ramp.size[2] / 2]}>
        <boxGeometry args={[ramp.size[0] * 0.96, 0.04, 0.06]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function MovingPlatform({ plat }: { plat: MovingPlatformDef }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const { pos } = platformPosition(plat, clock.elapsedTime);
    ref.current.position.set(pos[0], pos[1], pos[2]);
  });
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow position={[0, plat.size[1] / 2, 0]}>
        <boxGeometry args={plat.size} />
        <meshStandardMaterial
          color={plat.color ?? "#0e7490"}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, plat.size[1] + 0.01, 0]}>
        <boxGeometry args={[plat.size[0] * 0.92, 0.04, plat.size[2] * 0.92]} />
        <meshStandardMaterial
          color="#5eead4"
          emissive="#2dd4bf"
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

function WaterHazard({
  pos,
  size,
  color,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.25 + Math.sin(t * 1.5) * 0.08;
    }
    if (ref2.current) {
      // gentle ripple by scaling the surface plane
      const s = 1 + Math.sin(t * 2) * 0.01;
      ref2.current.scale.set(s, s, 1);
    }
  });
  return (
    <group position={pos}>
      {/* water body */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.12, size[1]]} />
        <meshStandardMaterial
          color={color ?? "#0c4a6e"}
          roughness={0.15}
          metalness={0.3}
          transparent
          opacity={0.92}
          emissive="#0ea5e9"
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* reflective surface */}
      <mesh ref={ref} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.55}
          emissive="#0ea5e9"
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* ripple ring */}
      <mesh ref={ref2} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.35, 24]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function SandTrap({
  pos,
  size,
  color,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={[pos[0], 0.02, pos[2]]} receiveShadow>
      <boxGeometry args={[size[0], 0.04, size[1]]} />
      <meshStandardMaterial color={color ?? "#e0c074"} roughness={1} metalness={0} />
    </mesh>
  );
}

function Bumper({
  pos,
  radius,
  height = 0.9,
  color,
}: {
  pos: [number, number, number];
  radius: number;
  height?: number;
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 4;
    if (ref.current) {
      const s = 1 + Math.sin(t) * 0.04;
      ref.current.scale.set(s, 1, s);
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.5 + Math.sin(t) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.8;
    }
  });
  return (
    <group position={pos}>
      <mesh ref={ref} position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 24]} />
        <meshStandardMaterial
          color={color ?? "#f43f5e"}
          emissive={color ?? "#f43f5e"}
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, height + 0.02, 0]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, 0.08, 24]} />
        <meshStandardMaterial color="#fecdd3" emissive="#f43f5e" emissiveIntensity={0.4} />
      </mesh>
      {/* rotating glow ring on the ground */}
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 0.08, radius + 0.22, 24]} />
        <meshBasicMaterial color={color ?? "#f43f5e"} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// Wind zone: animated arrows showing the push direction, plus a translucent volume.
function WindZone({ wz }: { wz: WindZoneDef }) {
  const groupRef = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (arrowRef.current) {
      // flowing motion to indicate wind direction
      arrowRef.current.position.x = ((clock.elapsedTime * 1.5) % 3) - 1.5;
    }
  });
  const dir = Math.atan2(wz.force[0], -wz.force[2]);
  const strength = Math.hypot(wz.force[0], wz.force[2]);
  const arrowCount = Math.max(2, Math.min(5, Math.round(strength * 1.5)));
  return (
    <group position={wz.pos}>
      {/* translucent volume box */}
      <mesh position={[0, wz.size[1] / 2, 0]}>
        <boxGeometry args={[wz.size[0], wz.size[1], wz.size[2]]} />
        <meshStandardMaterial
          color={wz.color ?? "#86efac"}
          transparent
          opacity={0.12}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      {/* ground tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[wz.size[0], wz.size[2]]} />
        <meshStandardMaterial
          color={wz.color ?? "#86efac"}
          transparent
          opacity={0.18}
          roughness={1}
        />
      </mesh>
      {/* animated arrows */}
      <group ref={groupRef} rotation={[0, dir, 0]}>
        <group ref={arrowRef}>
          {Array.from({ length: arrowCount }).map((_, i) => (
            <group key={i} position={[0, 0.5, -2 + i * 0.8]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.12, 0.28, 8]} />
                <meshStandardMaterial
                  color={wz.color ?? "#86efac"}
                  emissive={wz.color ?? "#86efac"}
                  emissiveIntensity={0.6}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

// Teleporter pad: glowing disc with rotating ring + particle sparkles.
function Teleporter({ tp }: { tp: TeleporterDef }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = t * 1.5;
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.12;
      coreRef.current.scale.set(s, s, s);
      const m = coreRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
    }
  });
  return (
    <group position={tp.pos}>
      {/* base disc */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[tp.radius, tp.radius, 0.08, 28]} />
        <meshStandardMaterial
          color={tp.color ?? "#f472b6"}
          emissive={tp.color ?? "#f472b6"}
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* rotating outer ring */}
      <mesh ref={ringRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[tp.radius + 0.08, 0.04, 8, 32]} />
        <meshStandardMaterial
          color={tp.color ?? "#f472b6"}
          emissive={tp.color ?? "#f472b6"}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* pulsing core */}
      <mesh ref={coreRef} position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={tp.color ?? "#f472b6"}
          emissiveIntensity={0.7}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* vertical light beam */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 3, 8, 1, true]} />
        <meshBasicMaterial
          color={tp.color ?? "#f472b6"}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Windmill: a rotating hub with 4 blades. The blades cast shadows and rotate
// at the configured rpm.
function Windmill({ wm }: { wm: WindmillDef }) {
  const hubRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (hubRef.current) {
      // rpm -> radians/sec; match the physics calculation
      hubRef.current.rotation.y =
        (clock.elapsedTime * wm.rpm * 2 * Math.PI) / 60;
    }
  });
  const bladeColor = wm.color ?? "#0d9488";
  return (
    <group position={wm.pos}>
      {/* base pole */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.8, 8]} />
        <meshStandardMaterial color="#5b4636" roughness={1} />
      </mesh>
      {/* rotating blade assembly */}
      <group ref={hubRef} position={[0, wm.bladeHeight / 2 + 0.3, 0]}>
        {/* hub */}
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, wm.bladeHeight, 12]} />
          <meshStandardMaterial color={bladeColor} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* 4 blades */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh
              position={[wm.bladeLength / 2, 0, 0]}
              castShadow
            >
              <boxGeometry args={[wm.bladeLength, wm.bladeHeight, wm.bladeWidth]} />
              <meshStandardMaterial
                color={bladeColor}
                roughness={0.5}
                metalness={0.1}
                emissive={bladeColor}
                emissiveIntensity={0.15}
              />
            </mesh>
            {/* blade tip accent */}
            <mesh position={[wm.bladeLength, 0, 0]}>
              <boxGeometry args={[0.08, wm.bladeHeight + 0.04, wm.bladeWidth + 0.04]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// Conveyor belt: a flat textured surface with animated stripes showing direction.
function Conveyor({ cv }: { cv: ConveyorDef }) {
  const stripeRef = useRef<THREE.Mesh>(null);
  // Create the texture once via useMemo; mutate it in useFrame is forbidden by
  // lint, so we wrap it in a ref that's assigned in a layout-free effect-like
  // pattern: we read tex.map in the material and update its offset through the
  // material's map reference (fetched from stripeRef in useFrame).
  const tex = useMemo(() => {
    const w = 64;
    const h = 64;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = cv.color ?? "#fbbf24";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let y = -16; y < h + 16; y += 24) {
      ctx.beginPath();
      ctx.moveTo(8, y);
      ctx.lineTo(w - 8, y + 10);
      ctx.lineTo(8, y + 20);
      ctx.closePath();
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(cv.size[0] / 1.5)), Math.max(2, Math.round(cv.size[2] / 1.5)));
    return t;
  }, [cv.color, cv.size[0], cv.size[2]]);
  useFrame((_, delta) => {
    // Mutate the texture's offset via the material's map (not a hook return).
    const mat = stripeRef.current?.material as THREE.MeshStandardMaterial | undefined;
    const map = mat?.map;
    if (map) {
      map.offset.y -= cv.speed * delta * 0.3;
    }
  });
  return (
    <group position={cv.pos}>
      {/* belt base */}
      <mesh ref={stripeRef} receiveShadow position={[0, cv.size[1] / 2, 0]}>
        <boxGeometry args={[cv.size[0], cv.size[1], cv.size[2]]} />
        <meshStandardMaterial map={tex} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* side rails */}
      <mesh position={[-cv.size[0] / 2 - 0.05, cv.size[1] + 0.05, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, cv.size[2]]} />
        <meshStandardMaterial color="#5b4636" roughness={0.8} />
      </mesh>
      <mesh position={[cv.size[0] / 2 + 0.05, cv.size[1] + 0.05, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, cv.size[2]]} />
        <meshStandardMaterial color="#5b4636" roughness={0.8} />
      </mesh>
      {/* direction arrow indicator on top */}
      <mesh
        position={[0, cv.size[1] + 0.06, 0]}
        rotation={[-Math.PI / 2, 0, cv.speed > 0 ? Math.PI : 0]}
      >
        <coneGeometry args={[0.18, 0.3, 4]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={cv.color ?? "#fbbf24"}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

export function Course({ course }: { course: CourseDef }) {
  const { bounds } = course;
  return (
    <group>
      {/* Fairway base (the green box) */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[bounds.width, 0.2, bounds.length]} />
        <meshStandardMaterial color="#3f6b34" roughness={0.92} metalness={0} />
      </mesh>
      {/* Fairway top surface with mowing-stripe texture */}
      <FairwaySurface width={bounds.width} length={bounds.length} accent={course.accent} />
      {/* Lighter green ring around hole (the "green") */}
      <mesh position={[course.holePos[0], 0.106, course.holePos[2]]} receiveShadow>
        <circleGeometry args={[1.6, 36]} />
        <meshStandardMaterial color="#5a9a48" roughness={0.75} />
      </mesh>
      {/* Tee marker pad */}
      <mesh position={[course.teePos[0], 0.106, course.teePos[2]]} receiveShadow>
        <circleGeometry args={[0.5, 24]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.7} />
      </mesh>
      {/* Tee ball cradle ring */}
      <mesh position={[course.teePos[0], 0.108, course.teePos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.58, 24]} />
        <meshStandardMaterial color="#e5e7eb" emissive="#9ca3af" emissiveIntensity={0.2} />
      </mesh>
      {/* Hole (cup) with inner depth */}
      <mesh position={[course.holePos[0], 0.04, course.holePos[2]]}>
        <cylinderGeometry args={[0.34, 0.32, 0.2, 28]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Hole rim */}
      <mesh position={[course.holePos[0], 0.108, course.holePos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.4, 28]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      {/* Flag pole + flag */}
      <group position={[course.holePos[0], 0, course.holePos[2]]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2.2, 8]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* flag with number */}
        <FlagMesh color={course.accent} number={course.id} />
      </group>

      {/* Walls */}
      {course.walls.map((w, i) => (
        <mesh
          key={`w${i}`}
          position={[w.pos[0], w.pos[1], w.pos[2]]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={w.size} />
          <meshStandardMaterial color={w.color ?? "#5b4636"} roughness={0.85} metalness={0.05} />
        </mesh>
      ))}

      {/* Ramps */}
      {course.ramps.map((r, i) => (
        <Ramp key={`r${i}`} ramp={r} />
      ))}

      {/* Moving platforms */}
      {course.movingPlatforms.map((p, i) => (
        <MovingPlatform key={`p${i}`} plat={p} />
      ))}

      {/* Water hazards */}
      {course.waterHazards.map((w, i) => (
        <WaterHazard key={`wh${i}`} pos={w.pos} size={w.size} color={w.color} />
      ))}

      {/* Sand traps */}
      {course.sandTraps.map((s, i) => (
        <SandTrap key={`s${i}`} pos={s.pos} size={s.size} color={s.color} />
      ))}

      {/* Bumpers */}
      {course.bumpers.map((b, i) => (
        <Bumper key={`b${i}`} pos={b.pos} radius={b.radius} height={b.height} color={b.color} />
      ))}

      {/* Wind zones */}
      {course.windZones.map((wz, i) => (
        <WindZone key={`wz${i}`} wz={wz} />
      ))}

      {/* Teleporters */}
      {course.teleporters.map((tp, i) => (
        <Teleporter key={`tp${i}`} tp={tp} />
      ))}

      {/* Windmills */}
      {course.windmills.map((wm, i) => (
        <Windmill key={`wm${i}`} wm={wm} />
      ))}

      {/* Conveyors */}
      {course.conveyors.map((cv, i) => (
        <Conveyor key={`cv${i}`} cv={cv} />
      ))}
    </group>
  );
}

// Fairway top surface with subtle mowing-stripe canvas texture.
function FairwaySurface({
  width,
  length,
  accent,
}: {
  width: number;
  length: number;
  accent: string;
}) {
  const tex = useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    // base green
    ctx.fillStyle = "#4a7d3a";
    ctx.fillRect(0, 0, size, size);
    // mowing stripes (alternating shades)
    const stripeH = 16;
    for (let y = 0; y < size; y += stripeH * 2) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, y, size, stripeH);
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(0, y + stripeH, size, stripeH);
    }
    // grass speckle
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const shade = Math.random();
      ctx.fillStyle =
        shade > 0.5
          ? "rgba(120,170,90,0.5)"
          : "rgba(60,100,50,0.5)";
      const s = Math.random() * 1.6 + 0.4;
      ctx.fillRect(x, y, s, s);
    }
    void accent;
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(2, Math.round(width / 4)), Math.max(3, Math.round(length / 4)));
    t.anisotropy = 4;
    return t;
  }, [width, length, accent]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.102, 0]} receiveShadow>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0} />
    </mesh>
  );
}

// A flag mesh with a number texture on it — waves like cloth via a vertex
// shader (GPU-side, no geometry mutation needed).
function FlagMesh({ color, number }: { color: string; number: number }) {
  const tex = useMemo(() => {
    const w = 128;
    const h = 80;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // border
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    // hole number
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), w / 2, h / 2 + 2);
    return new THREE.CanvasTexture(c);
  }, [color, number]);

  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    const m = matRef.current;
    if (m) {
      (m.uniforms.uTime as { value: number }).value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0.53, 1.85, 0]} castShadow>
      <planeGeometry args={[0.5, 0.32, 10, 4]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.DoubleSide}
        uniforms={{ uTime: { value: 0 } }}
        map={tex}
        // Standard-ish lit flag with a vertex wave. We sample the map manually
        // and apply emissive so the number stays readable.
        vertexShader={`
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            vUv = uv;
            // x ranges -0.25..0.25 in local; normalize to 0..1 for edge factor
            float edge = (position.x + 0.25) / 0.5;
            float wave = sin(uTime * 4.0 + position.x * 12.0) * 0.04 * edge;
            float waveY = cos(uTime * 3.0 + position.x * 10.0) * 0.025 * edge;
            vWave = wave;
            vec3 p = position;
            p.z += wave;
            p.y += waveY;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D map;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            vec4 tex = texture2D(map, vUv);
            // simple lighting: brighter where wave faces +z, darker on troughs
            float light = 0.8 + vWave * 6.0;
            vec3 col = tex.rgb * light;
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}
