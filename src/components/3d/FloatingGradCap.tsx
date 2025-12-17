import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function GraduationCap() {
  const groupRef = useRef<THREE.Group>(null);
  const tasselRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.4;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
    if (tasselRef.current) {
      tasselRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
      <group ref={groupRef}>
        {/* Cap base (mortarboard) */}
        <mesh position={[0, 0, 0]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[2.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#1a4480" roughness={0.4} metalness={0.3} />
        </mesh>
        
        {/* Cap top (skull cap) */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a4480" roughness={0.4} metalness={0.3} />
        </mesh>
        
        {/* Button on top */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#c9a227" roughness={0.2} metalness={0.9} />
        </mesh>
        
        {/* Tassel group */}
        <group ref={tasselRef} position={[0, 0.1, 0]}>
          {/* Tassel cord */}
          <mesh position={[0.6, -0.3, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.7} />
          </mesh>
          
          {/* Tassel end */}
          <mesh position={[0.9, -0.7, 0]}>
            <cylinderGeometry args={[0.08, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
        
        {/* Gold trim */}
        <mesh position={[0, -0.02, 0]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[2.25, 0.04, 2.25]} />
          <meshStandardMaterial color="#c9a227" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

function Diploma() {
  const diplomaRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (diplomaRef.current) {
      diplomaRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={diplomaRef} position={[2, -1, -1]} rotation={[0.3, -0.5, 0.2]}>
        {/* Rolled diploma */}
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 1.8, 16]} />
          <meshStandardMaterial color="#f5f0e6" roughness={0.8} metalness={0} />
        </mesh>
        
        {/* Ribbon */}
        <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.03, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#c9a227" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </Float>
  );
}

function Stars() {
  const starsRef = useRef<THREE.Points>(null);
  const starCount = 35;
  
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
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
      <pointsMaterial size={0.06} color="#c9a227" transparent opacity={0.6} />
    </points>
  );
}

export default function FloatingGradCap() {
  return (
    <div className="w-full h-full min-h-[350px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -2, 3]} intensity={0.3} color="#c9a227" />
        <pointLight position={[0, 2, 3]} intensity={0.4} color="#1a4480" />
        <GraduationCap />
        <Diploma />
        <Stars />
      </Canvas>
    </div>
  );
}
