"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// A small 3D scene showing a rotating glossy golf ball on a tee, with a
// subtle gradient sky background. Used as the hero on the start screen.
function GolfBallHero() {
  const ballRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ballRef.current) {
      // Slow rotation
      ballRef.current.rotation.y += delta * 0.8;
      ballRef.current.rotation.x += delta * 0.15;
    }
    if (groupRef.current) {
      // Gentle bobbing
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Golf ball — glossy white with dimples (approximated via segments) */}
      <mesh ref={ballRef} castShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.18}
          metalness={0.15}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Tee (the small peg under the ball) */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 0.25, 8]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Tee base */}
      <mesh position={[0, -0.23, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 12]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.6} />
      </mesh>
      {/* Shadow blob (cheap fake) */}
      <mesh position={[0, -0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

export function Hero3D() {
  return (
    <div className="relative h-32 w-32 sm:h-36 sm:w-36">
      <Canvas
        camera={{ position: [0, 0.5, 2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <hemisphereLight args={["#dcecff", "#4a6b3a", 0.5]} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.3}
          color="#fff6e6"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <directionalLight position={[-2, 2, -1]} intensity={0.4} color="#a3d4ff" />
        <GolfBallHero />
      </Canvas>
    </div>
  );
}
