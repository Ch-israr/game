"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number; // initial x offset (0 = center)
  y: number; // initial y offset
  vx: number; // velocity x (px/s)
  vy: number; // velocity y (px/s)
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = ["#fbbf24", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#ec4899", "#f97316"];
const PARTICLE_COUNT = 60;

function spawnParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.3;
    const speed = 200 + Math.random() * 300;
    particles.push({
      id: i,
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 150, // bias upward
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
    });
  }
  return particles;
}

export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [bursts, setBursts] = useState<{ id: number; particles: Particle[] }[]>([]);
  const idRef = useRef(0);

  // Spawn a burst whenever `trigger` increments (sinkAnim counter)
  useEffect(() => {
    if (trigger <= 0) return;
    const id = idRef.current++;
    const particles = spawnParticles();
    setBursts((prev) => [...prev, { id, particles }]);
    // Remove after animation completes
    const t = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 2000);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center overflow-hidden">
      <AnimatePresence>
        {bursts.map((burst) => (
          <div key={burst.id} className="relative top-1/3">
            {burst.particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  rotate: p.rotation,
                  scale: 1,
                }}
                animate={{
                  x: p.vx * 1.2,
                  y: p.vy * 1.2 + 600, // gravity pulls down
                  opacity: 0,
                  rotate: p.rotation + p.rotationSpeed * 2,
                  scale: 0.5,
                }}
                transition={{
                  duration: 1.8,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size * 0.6,
                  background: p.color,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
