import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import BrainModel from './BrainModel'
import CameraController from './CameraController'

/**
 * Main 3D canvas component using React Three Fiber
 * Sets up the scene, camera, lighting, and controls
 */
function BrainCanvas() {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace
      }}
      onCreated={({ scene, gl, camera }) => {
        // Light grey background - MATCHING WORKING brain.js
        scene.background = new THREE.Color(0xf0f0f0)
        console.log('[CANVAS] ✅ Background set to 0xf0f0f0 (light grey - matching working version)')
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    >
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0.6, 1.8]}
        fov={50}
        near={0.01}
        far={100}
      />

      {/* Lighting - EXACT MATCH to working brain.js */}
      {/* 1. Ambient fill */}
      <ambientLight color={0x606060} intensity={0.6} />

      {/* 2. Key light (front-right) */}
      <directionalLight
        color={0xffffff}
        intensity={0.8}
        position={[1, 1, 0.5]}
      />

      {/* 3. Fill light (front-left, softer) */}
      <directionalLight
        color={0xffeedd}
        intensity={0.4}
        position={[-1, 0.5, 1]}
      />

      {/* 4. Rim light (behind, to highlight silhouette) */}
      <directionalLight
        color={0xffffff}
        intensity={0.3}
        position={[-0.5, 1, -1]}
      />

      {/* Orbit controls - matching original brain.js */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        target={[0, 0.2, 0]}
      />

      {/* Camera controller for programmatic animations */}
      <CameraController />

      {/* Brain model */}
      <Suspense fallback={null}>
        <BrainModel />
      </Suspense>
    </Canvas>
  )
}

export default BrainCanvas
