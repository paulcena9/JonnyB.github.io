import { useEffect, useRef, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useBrainStore from '../../store/brainStore'

/**
 * Brain Model Component - Simplified for baseline functionality
 * Matches the original brain.js implementation
 */
function BrainModel() {
  const { scene } = useGLTF('/model.glb')
  const { camera, controls } = useThree()

  // Debug: GLB Loading
  console.log('[MODEL] useGLTF returned scene:', scene ? 'loaded' : 'null')
  if (scene) {
    console.log('[MODEL] Scene details:', {
      type: scene.type,
      children: scene.children.length,
      uuid: scene.uuid,
      hasGeometry: scene.children.some(child => child.geometry)
    })
  }

  // Store state
  const {
    currentLayer,
    hemisphereVisibility,
    setLoading
  } = useBrainStore()

  // Mesh references
  const meshRefs = useRef({
    face: null,
    lh_pial: null,
    rh_pial: null,
    lh_white: null,
    rh_white: null
  })

  const [meshesReady, setMeshesReady] = useState(false)

  // Calculate visibility state based on current layer and hemisphere settings
  const visibilityState = useMemo(() => {
    console.log('[VISIBILITY] Computing visibility state...')
    console.log('[VISIBILITY] Current layer:', currentLayer)
    console.log('[VISIBILITY] Hemisphere visibility:', hemisphereVisibility)
    console.log('[VISIBILITY] Meshes ready:', meshesReady)

    if (!meshesReady) {
      console.log('[VISIBILITY] Meshes not ready, returning empty state')
      return {}
    }

    const state = {
      face: false,
      lh_pial: false,
      rh_pial: false,
      lh_white: false,
      rh_white: false
    }

    switch (currentLayer) {
      case 'face':
        state.face = true
        break
      case 'pial':
        state.lh_pial = hemisphereVisibility.left
        state.rh_pial = hemisphereVisibility.right
        break
      case 'white':
        state.lh_white = hemisphereVisibility.left
        state.rh_white = hemisphereVisibility.right
        break
      case 'all':
        state.lh_pial = hemisphereVisibility.left
        state.rh_pial = hemisphereVisibility.right
        state.lh_white = hemisphereVisibility.left
        state.rh_white = hemisphereVisibility.right
        break
    }

    console.log('[VISIBILITY] Computed state:', state)
    const visibleCount = Object.values(state).filter(v => v).length
    console.log('[VISIBILITY] Meshes that should be visible:', visibleCount)

    return state
  }, [currentLayer, hemisphereVisibility, meshesReady])

  // Extract meshes from loaded GLTF scene
  useEffect(() => {
    if (!scene) return

    console.log('═══════════════════════════════════════')
    console.log('[MESH] Scanning GLB model for meshes...')

    scene.traverse((obj) => {
      if (!obj.isMesh) return

      const name = obj.name.toLowerCase()
      console.log(`[MESH] Found mesh: "${obj.name}"`)

      // Detailed mesh inspection
      console.log('[MESH]   Properties:', {
        visible: obj.visible,
        frustumCulled: obj.frustumCulled,
        renderOrder: obj.renderOrder,
        matrixAutoUpdate: obj.matrixAutoUpdate,
        castShadow: obj.castShadow,
        receiveShadow: obj.receiveShadow
      })

      if (obj.geometry) {
        obj.geometry.computeBoundingBox()
        obj.geometry.computeBoundingSphere()
        console.log('[MESH]   Geometry:', {
          type: obj.geometry.type,
          vertices: obj.geometry.attributes.position?.count || 0,
          hasBoundingBox: !!obj.geometry.boundingBox,
          boundingBox: obj.geometry.boundingBox ? {
            min: obj.geometry.boundingBox.min.toArray(),
            max: obj.geometry.boundingBox.max.toArray()
          } : null,
          boundingSphere: obj.geometry.boundingSphere ? {
            center: obj.geometry.boundingSphere.center.toArray(),
            radius: obj.geometry.boundingSphere.radius
          } : null
        })
      } else {
        console.warn('[MESH]   ⚠️  NO GEOMETRY!')
      }

      if (obj.material) {
        console.log('[MESH]   Material:', {
          type: obj.material.type,
          color: obj.material.color ? obj.material.color.getHexString() : 'N/A',
          opacity: obj.material.opacity,
          transparent: obj.material.transparent,
          visible: obj.material.visible,
          side: obj.material.side
        })
      } else {
        console.warn('[MESH]   ⚠️  NO MATERIAL!')
      }

      console.log('[MESH]   Transform:', {
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray().slice(0, 3),
        scale: obj.scale.toArray()
      })

      // Assign to refs
      if (name === 'head_hollow_scooped') {
        meshRefs.current.face = obj
        console.log('[MESH]   ✅ Assigned to: face')
      } else if (name === 'lh_white_corrected') {
        meshRefs.current.lh_white = obj
        console.log('[MESH]   ✅ Assigned to: lh_white')
      } else if (name === 'rh_white_corrected') {
        meshRefs.current.rh_white = obj
        console.log('[MESH]   ✅ Assigned to: rh_white')
      } else if (name.startsWith('lh_pial')) {
        meshRefs.current.lh_pial = obj
        console.log('[MESH]   ✅ Assigned to: lh_pial')
      } else if (name.startsWith('rh_pial')) {
        meshRefs.current.rh_pial = obj
        console.log('[MESH]   ✅ Assigned to: rh_pial')
      } else {
        console.log('[MESH]   ⚠️  Not assigned (unknown mesh)')
      }
      console.log('───────────────────────────────────────')
    })

    console.log('[MESH] Mesh assignment summary:', {
      face: !!meshRefs.current.face,
      lh_pial: !!meshRefs.current.lh_pial,
      rh_pial: !!meshRefs.current.rh_pial,
      lh_white: !!meshRefs.current.lh_white,
      rh_white: !!meshRefs.current.rh_white
    })
    console.log('═══════════════════════════════════════')

    setMeshesReady(true)
    setLoading('model', false)
  }, [scene, setLoading])

  // Frame camera when model is first loaded
  useEffect(() => {
    if (!scene || !meshesReady) return

    console.log('═══════════════════════════════════════')
    console.log('[CAMERA] Framing camera to model...')

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()

    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = maxDim * 1.7

    console.log('[CAMERA] Model bounding box:', {
      min: box.min.toArray(),
      max: box.max.toArray(),
      size: size.toArray(),
      center: center.toArray(),
      maxDimension: maxDim,
      calculatedDistance: dist
    })

    // Set camera position
    camera.position.set(center.x, center.y, center.z + dist)
    camera.near = dist / 100
    camera.far = dist * 100
    camera.updateProjectionMatrix()

    console.log('[CAMERA] Camera configured:', {
      position: camera.position.toArray(),
      near: camera.near,
      far: camera.far,
      fov: camera.fov,
      aspect: camera.aspect
    })

    // Set OrbitControls target to model center
    if (controls) {
      controls.target.copy(center)
      controls.update()
      console.log('[CAMERA] OrbitControls:', {
        target: controls.target.toArray(),
        enabled: controls.enabled,
        enableDamping: controls.enableDamping
      })
    } else {
      console.warn('[CAMERA] ⚠️  OrbitControls not available!')
    }

    console.log('[CAMERA] ✅ Camera framing complete')
    console.log('═══════════════════════════════════════')
  }, [scene, camera, controls, meshesReady])

  // Apply visibility state to meshes
  useEffect(() => {
    if (!meshesReady) return

    console.log('═══════════════════════════════════════')
    console.log(`[VISIBILITY] Applying layer: "${currentLayer}"`)

    let appliedCount = 0
    let errorCount = 0

    // Apply visibility state to each mesh
    Object.entries(meshRefs.current).forEach(([key, mesh]) => {
      if (!mesh) {
        console.log(`[VISIBILITY] ${key}: mesh is null/undefined`)
        return
      }

      const shouldBeVisible = visibilityState[key] || false
      const wasVisible = mesh.visible

      console.log(`[VISIBILITY] ${key}:`)
      console.log(`[VISIBILITY]   - Should be visible: ${shouldBeVisible}`)
      console.log(`[VISIBILITY]   - Was visible (before): ${wasVisible}`)

      // Set visibility
      mesh.visible = shouldBeVisible

      // Verify the change
      const isNowVisible = mesh.visible
      console.log(`[VISIBILITY]   - Is visible (after): ${isNowVisible}`)

      if (isNowVisible !== shouldBeVisible) {
        console.error(`[VISIBILITY]   ❌ ERROR: Failed to set visibility! Expected ${shouldBeVisible}, got ${isNowVisible}`)
        errorCount++
      } else if (shouldBeVisible) {
        console.log(`[VISIBILITY]   ✅ Successfully showing ${key}`)
        appliedCount++

        // Additional checks for visible meshes
        console.log(`[VISIBILITY]   - Mesh details:`, {
          hasGeometry: !!mesh.geometry,
          hasMaterial: !!mesh.material,
          frustumCulled: mesh.frustumCulled,
          renderOrder: mesh.renderOrder,
          inScene: mesh.parent !== null
        })
      }
    })

    console.log(`[VISIBILITY] Summary: ${appliedCount} visible, ${errorCount} errors`)
    console.log('═══════════════════════════════════════')
  }, [visibilityState, currentLayer, meshesReady])

  // Monitor rendering - log every 120 frames (every 2 seconds at 60fps)
  const frameCount = useRef(0)
  const lastLogTime = useRef(Date.now())

  useFrame(() => {
    frameCount.current++

    // Log every 120 frames
    if (frameCount.current % 120 === 0) {
      const now = Date.now()
      const fps = Math.round(120 / ((now - lastLogTime.current) / 1000))
      lastLogTime.current = now

      // Count visible meshes
      let visibleMeshCount = 0
      Object.values(meshRefs.current).forEach(mesh => {
        if (mesh && mesh.visible) visibleMeshCount++
      })

      console.log('[RENDER] Frame stats:', {
        frameNumber: frameCount.current,
        fps: fps,
        visibleMeshes: visibleMeshCount,
        currentLayer: currentLayer,
        meshesReady: meshesReady
      })

      // Diagnostic check
      if (meshesReady && visibleMeshCount === 0) {
        console.warn('[RENDER] ⚠️  WARNING: Meshes are ready but NONE are visible!')
      }
    }
  })

  return <primitive object={scene} />
}

// Preload the GLB model
useGLTF.preload('/model.glb')

export default BrainModel
