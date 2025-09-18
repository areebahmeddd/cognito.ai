"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";
import ParticleBackground from "./ParticleBackground";
import SearchBar3D from "./SearchBar3D";

interface Scene3DProps {
  isExpanded: boolean;
}

export default function Scene3D({ isExpanded }: Scene3DProps) {
  return (
    <div className="absolute inset-0 -z-10">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 15], fov: 60 }}
          style={{ background: "transparent" }}
          gl={{ antialias: false, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} />
          <pointLight
            position={[-10, -10, -5]}
            intensity={0.3}
            color="#64748b"
          />

          {/* Environment - simplified */}
          <fog attach="fog" args={["#f8fafc", 10, 50]} />

          {/* Particle background */}
          <ParticleBackground />

          {/* 3D Search bar */}
          <SearchBar3D isExpanded={isExpanded} />

          {/* Subtle controls for debugging (can be removed in production) */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={false}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
