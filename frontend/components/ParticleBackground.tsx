"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

export default function ParticleBackground() {
  const pointsRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(500 * 3);

    for (let i = 0; i < 500; i++) {
      const radius = Math.random() * 15 + 5;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 8;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      pointsRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.01) * 0.05;
    }
  });

  return (
    <Points
      ref={pointsRef}
      positions={particlePositions}
      stride={3}
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        color="#64748b"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.2}
      />
    </Points>
  );
}
