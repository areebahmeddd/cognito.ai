"use client";

import { Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface SearchBar3DProps {
  isExpanded: boolean;
}

export default function SearchBar3D({ isExpanded }: SearchBar3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 2) * 0.02;

      groupRef.current.rotation.z = isExpanded ? 0.02 : 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Box args={[8, isExpanded ? 1.5 : 0.8, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0.1}
          metalness={0.8}
        />
      </Box>

      <Box args={[8.2, isExpanded ? 1.7 : 1, 0.05]} position={[0, 0, -0.03]}>
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.05}
          emissive="#000000"
          emissiveIntensity={0.1}
        />
      </Box>
    </group>
  );
}
