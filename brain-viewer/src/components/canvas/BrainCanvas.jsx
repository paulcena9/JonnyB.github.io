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
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      }}
      onCreated={({ scene, gl, camera }) => {
        // Dark background for better contrast with white brain model
        scene.background = new THREE.Color(0x0a0a0a)
        // Very subtle fog - won't hide the model
        scene.fog = new THREE.Fog(0x0a0a0a, 15, 30)

        // Debug: Canvas initialization
        console.log('═══════════════════════════════════════')
        console.log('[CANVAS] Canvas initialized successfully')
        console.log('[CANVAS] WebGL Renderer:', {
          capabilities: gl.capabilities,
          info: gl.info,
          powerPreference: gl.getContextAttributes().powerPreference
        })
        console.log('[CANVAS] Camera:', {
          type: camera.type,
          fov: camera.fov,
          position: camera.position.toArray(),
          near: camera.near,
          far: camera.far
        })
        console.log('[CANVAS] Scene:', {
          background: scene.background,
          fog: scene.fog ? 'enabled' : 'disabled',
          children: scene.children.length
        })
        console.log('═══════════════════════════════════════')
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    >
      {/* Camera - position will be set by BrainModel.frameModel() */}
      <PerspectiveCamera
        makeDefault
        fov={50}
        near={0.01}
        far={100}
      />

      {/* Studio lighting setup for dark background */}
      {/* Strong ambient base */}
      <ambientLight intensity={1.5} color="#ffffff" />

      {/* Hemisphere light for natural look */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#444444"
        intensity={1.0}
      />

      {/* Main key light */}
      <directionalLight
        position={[3, 3, 3]}
        intensity={2.0}
        color="#ffffff"
      />

      {/* Fill lights */}
      <directionalLight
        position={[-3, 2, 2]}
        intensity={1.5}
        color="#ffffff"
      />

      <directionalLight
        position={[0, 3, -2]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* Point light at camera for extra illumination */}
      <pointLight
        position={[0, 0, 2]}
        intensity={1.0}
        distance={10}
        decay={2}
      />

      {/* Orbit controls - target will be set by BrainModel.frameModel() */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
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
