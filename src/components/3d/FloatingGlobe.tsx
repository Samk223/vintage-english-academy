import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z = state.clock.elapsedTime * 0.1;
      ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <group>
        {/* Main globe */}
        <mesh ref={globeRef}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <MeshDistortMaterial
            color="#1a4480"
            roughness={0.3}
            metalness={0.7}
            distort={0.2}
            speed={2}
          />
        </mesh>
        
        {/* Latitude lines */}
        {[-0.5, 0, 0.5].map((y, i) => (
          <mesh key={i} position={[0, y * 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.sqrt(1 - y * y) * 1.5, 0.02, 8, 64]} />
            <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        
        {/* Orbital rings */}
        <group ref={ringsRef}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[2.2, 0.03, 8, 64]} />
            <meshStandardMaterial color="#c9a227" roughness={0.2} metalness={0.9} transparent opacity={0.7} />
          </mesh>
          <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
            <torusGeometry args={[2.4, 0.02, 8, 64]} />
            <meshStandardMaterial color="#c9a227" roughness={0.2} metalness={0.9} transparent opacity={0.5} />
          </mesh>
        </group>
        
        {/* Small orbiting spheres */}
        <Float speed={3} rotationIntensity={0.5}>
          <mesh position={[2.2, 0.5, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#c9a227" roughness={0.2} metalness={0.9} />
          </mesh>
        </Float>
      </group>
    </Float>
  );
}

function StarField() {
  const starsRef = useRef<THREE.Points>(null);
  const starCount = 40;
  
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#c9a227" transparent opacity={0.6} />
    </points>
  );
}

export default function FloatingGlobe() {
  return (
    <div className="w-full h-full min-h-[350px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#c9a227" />
        <pointLight position={[0, 0, 4]} intensity={0.4} color="#1a4480" />
        <Globe />
        <StarField />
      </Canvas>
    </div>
  );
}
