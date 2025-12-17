import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function Pencil() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <group ref={groupRef} rotation={[0, 0, Math.PI / 6]}>
        {/* Pencil body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 3, 6]} />
          <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* Pencil tip cone */}
        <mesh position={[0, -1.7, 0]}>
          <coneGeometry args={[0.15, 0.4, 6]} />
          <meshStandardMaterial color="#1a4480" roughness={0.4} metalness={0.3} />
        </mesh>
        
        {/* Pencil tip point */}
        <mesh position={[0, -1.95, 0]}>
          <coneGeometry args={[0.05, 0.15, 6]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} metalness={0.1} />
        </mesh>
        
        {/* Eraser base */}
        <mesh position={[0, 1.55, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
          <meshStandardMaterial color="#8B7355" roughness={0.4} metalness={0.7} />
        </mesh>
        
        {/* Eraser */}
        <mesh position={[0, 1.75, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
          <meshStandardMaterial color="#e57373" roughness={0.8} metalness={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

function NotebookLines() {
  const linesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      linesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={linesRef} position={[-1.5, -0.5, -1]} rotation={[0.2, 0.3, 0]}>
        {/* Paper background */}
        <RoundedBox args={[2.5, 3, 0.05]} radius={0.05} position={[0, 0, -0.05]}>
          <meshStandardMaterial color="#f5f0e6" roughness={0.9} metalness={0} />
        </RoundedBox>
        
        {/* Lines on paper */}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((y, i) => (
          <mesh key={i} position={[0, y, 0.01]}>
            <boxGeometry args={[2, 0.02, 0.01]} />
            <meshStandardMaterial color="#1a4480" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 25;
  
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#c9a227" transparent opacity={0.5} />
    </points>
  );
}

export default function FloatingPencil() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 2, 3]} intensity={0.3} color="#c9a227" />
        <Pencil />
        <NotebookLines />
        <Particles />
      </Canvas>
    </div>
  );
}
