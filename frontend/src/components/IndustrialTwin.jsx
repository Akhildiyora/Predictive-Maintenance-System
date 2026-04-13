import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export function IndustrialTwin({ telemetry }) {
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  
  // Extract values with defaults for offline state
  const temp = telemetry?.temperature || 50;
  const vibration = telemetry?.vibration || 0.02;
  const rpm = telemetry?.rpm || 0;
  
  // Calculate visual properties
  // Temperature maps from Cyan (cold) to Red (hot)
  // range: 45 (0%) to 100 (100%)
  const tempFactor = Math.min(1, Math.max(0, (temp - 45) / 55));
  const glowColor = new THREE.Color().setHSL(0.55 - (tempFactor * 0.55), 1, 0.5);
  
  // Vibration shakes the whole assembly
  const shakeFactor = Math.min(0.5, vibration * 5); // amplify small values

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Rotation based on RPM
    if (ring1Ref.current) ring1Ref.current.rotation.z += (rpm / 1000) * 0.05 + 0.01;
    if (ring2Ref.current) ring2Ref.current.rotation.x += (rpm / 800) * 0.03 + 0.005;
    
    // Core pulsing based on "heartbeat"
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
      // Displacement/shake proportional to vibration
      coreRef.current.position.y = Math.sin(t * 50) * shakeFactor * 0.1;
      coreRef.current.position.x = Math.cos(t * 45) * shakeFactor * 0.1;
    }
  });

  return (
    <group>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color={glowColor} />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group scale={1.5}>
          {/* Main Internal Core */}
          <mesh ref={coreRef}>
            <sphereGeometry args={[0.6, 64, 64]} />
            <meshStandardMaterial 
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={2}
              roughness={0}
              metalness={1}
            />
          </mesh>

          {/* Holographic Shell / Distortion Layer */}
          <mesh>
            <sphereGeometry args={[0.65, 64, 64]} />
            <MeshDistortMaterial
              color={glowColor}
              speed={5}
              distort={shakeFactor}
              radius={1}
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Outer Geometric Rings (Schematic Shell) */}
          <mesh ref={ring1Ref}>
            <torusGeometry args={[1.2, 0.02, 16, 100]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.2} metalness={1} />
          </mesh>
          <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.25, 0.01, 16, 100]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.5} />
          </mesh>

          <mesh ref={ring2Ref} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1.5, 0.01, 16, 100]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.1} />
          </mesh>

          {/* Schematic Connection Lines / Axes */}
          <gridHelper args={[4, 10, 0xffffff, 0x333333]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1]} />
        </group>
      </Float>

      <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
    </group>
  );
}
