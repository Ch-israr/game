"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { PhysicsBall } from "@/game/ball-state";
import { useGameStore } from "@/game/store";

interface CameraRigProps {
  ballRef: React.MutableRefObject<PhysicsBall | null>;
}

// Follow-view offset (angled, behind the ball) — steep enough that the
// near boundary wall no longer hides the ball at the tee: with the old
// (0, 9, 14) offset the sight line to the ball passed below the wall top
// (y≈1.0) and only the ball's cap showed.
const FOLLOW_OFFSET = new THREE.Vector3(0, 11, 12);
const FOLLOW_LOOK = new THREE.Vector3(0, 0, -6);
// Top-down "aim view" offset (high, looking straight down)
const TOPDOWN_OFFSET = new THREE.Vector3(0, 20, 0.5);
const TOPDOWN_LOOK = new THREE.Vector3(0, 0, -1);

export function CameraRig({ ballRef }: CameraRigProps) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const lookAt = useRef(new THREE.Vector3(0, 0, -1.5));

  useFrame((_, delta) => {
    const ball = ballRef.current;
    const view = useGameStore.getState().cameraView;
    if (ball) {
      // Follow the ball loosely on x, less on z
      const followStrength = Math.min(1, delta * 3);
      target.current.x += (ball.x * 0.5 - target.current.x) * followStrength;
      target.current.y += (ball.y - target.current.y) * Math.min(1, delta * 4);
      target.current.z += (ball.z * 0.6 - target.current.z) * followStrength;
    }
    const offset = view === "topdown" ? TOPDOWN_OFFSET : FOLLOW_OFFSET;
    const lookOff = view === "topdown" ? TOPDOWN_LOOK : FOLLOW_LOOK;
    const desiredPos = target.current.clone().add(offset);
    // Top-down switches faster; follow is smooth
    const lerpFactor = view === "topdown" ? Math.min(1, delta * 5) : Math.min(1, delta * 3);
    camera.position.lerp(desiredPos, lerpFactor);

    const desiredLook = target.current.clone().add(lookOff);
    lookAt.current.lerp(desiredLook, Math.min(1, delta * 4));
    camera.lookAt(lookAt.current);
  });

  return null;
}
