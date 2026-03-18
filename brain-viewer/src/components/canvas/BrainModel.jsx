import { useEffect, useRef, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useBrainStore from '../../store/brainStore'
import { getRegionForVertex, getRegionBoundingBox } from '../../utils/dataProcessing'
import { createParcellationColors } from '../../utils/colorMaps'

/**
 * Brain Model Component - Interactive Region Explorer
 * Features: Click detection, region highlighting, camera animation
 */
function BrainModel() {
  const { scene } = useGLTF('/model.glb')
  const { camera, controls } = useThree()

  // Debug: GLB Loading
  if (scene) {
    console.log('[MODEL] ✅ GLB model loaded successfully:', {
      children: scene.children.length,
      hasGeometry: scene.children.some(child => child.geometry)
    })
  }

  // Store state
  const {
    currentLayer,
    hemisphereVisibility,
    setLoading,
    parcellationData,
    setSelectedRegion,
    selectedRegion,
    setCameraTarget
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
    if (!meshesReady) return {}

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

    return state
  }, [currentLayer, hemisphereVisibility, meshesReady])

  // Extract meshes from loaded GLTF scene
  useEffect(() => {
    if (!scene) return

    console.log('[MESH] Scanning GLB model for meshes...')

    const foundMeshes = []

    scene.traverse((obj) => {
      if (!obj.isMesh) return

      const name = obj.name.toLowerCase()

      // Compute bounding box/sphere for geometry
      if (obj.geometry) {
        obj.geometry.computeBoundingBox()
        obj.geometry.computeBoundingSphere()
      }

      // Assign to refs
      if (name === 'head_hollow_scooped') {
        meshRefs.current.face = obj
        foundMeshes.push('face')
      } else if (name === 'lh_white_corrected') {
        meshRefs.current.lh_white = obj
        foundMeshes.push('lh_white')
      } else if (name === 'rh_white_corrected') {
        meshRefs.current.rh_white = obj
        foundMeshes.push('rh_white')
      } else if (name.startsWith('lh_pial')) {
        meshRefs.current.lh_pial = obj
        foundMeshes.push('lh_pial')
      } else if (name.startsWith('rh_pial')) {
        meshRefs.current.rh_pial = obj
        foundMeshes.push('rh_pial')
      }
    })

    console.log('[MESH] ✅ Found meshes:', foundMeshes.join(', '))

    setMeshesReady(true)
    setLoading('model', false)
  }, [scene, setLoading])

  // Frame camera when model is first loaded
  useEffect(() => {
    if (!scene || !meshesReady) return

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()

    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = maxDim * 1.7

    // Set camera position
    camera.position.set(center.x, center.y, center.z + dist)
    camera.near = dist / 100
    camera.far = dist * 100
    camera.updateProjectionMatrix()

    // Make camera look at the model center
    camera.lookAt(center)

    // Set OrbitControls target to model center
    if (controls) {
      controls.target.copy(center)
      controls.update()
    }

    console.log('[CAMERA] ✅ Camera framed to model')
  }, [scene, camera, controls, meshesReady])

  // Apply visibility state to meshes
  useEffect(() => {
    if (!meshesReady) return

    // Apply visibility state to each mesh
    Object.entries(meshRefs.current).forEach(([key, mesh]) => {
      if (mesh) {
        mesh.visible = visibilityState[key] || false
      }
    })

    const visibleMeshes = Object.entries(visibilityState)
      .filter(([_, visible]) => visible)
      .map(([key, _]) => key)

    console.log(`[VISIBILITY] Layer "${currentLayer}": ${visibleMeshes.join(', ') || 'none'}`)
  }, [visibilityState, currentLayer, meshesReady])

  // Apply vertex colors for parcellation visualization
  useEffect(() => {
    if (!meshesReady) return

    let coloredHemispheres = []

    // Apply colors to left hemisphere pial mesh
    if (meshRefs.current.lh_pial && parcellationData.lh) {
      const mesh = meshRefs.current.lh_pial
      const data = parcellationData.lh

      const highlightedRegions = selectedRegion && selectedRegion.hemisphere === 'lh'
        ? [selectedRegion.id]
        : []

      const colors = createParcellationColors(
        data.vertex_labels,
        data.regions,
        {
          highlightedRegions,
          highlightColor: [1.0, 0.8, 0.0], // Golden yellow
          dimFactor: 0.3
        }
      )

      // Apply colors to geometry
      if (!mesh.geometry.attributes.color) {
        mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      } else {
        mesh.geometry.attributes.color.array.set(colors)
        mesh.geometry.attributes.color.needsUpdate = true
      }

      // Ensure material supports vertex colors
      if (mesh.material) {
        mesh.material.vertexColors = true
        mesh.material.needsUpdate = true
      }

      coloredHemispheres.push('LH')
    }

    // Apply colors to right hemisphere pial mesh
    if (meshRefs.current.rh_pial && parcellationData.rh) {
      const mesh = meshRefs.current.rh_pial
      const data = parcellationData.rh

      const highlightedRegions = selectedRegion && selectedRegion.hemisphere === 'rh'
        ? [selectedRegion.id]
        : []

      const colors = createParcellationColors(
        data.vertex_labels,
        data.regions,
        {
          highlightedRegions,
          highlightColor: [1.0, 0.8, 0.0], // Golden yellow
          dimFactor: 0.3
        }
      )

      // Apply colors to geometry
      if (!mesh.geometry.attributes.color) {
        mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      } else {
        mesh.geometry.attributes.color.array.set(colors)
        mesh.geometry.attributes.color.needsUpdate = true
      }

      // Ensure material supports vertex colors
      if (mesh.material) {
        mesh.material.vertexColors = true
        mesh.material.needsUpdate = true
      }

      coloredHemispheres.push('RH')
    }

    if (coloredHemispheres.length > 0) {
      const highlightInfo = selectedRegion
        ? ` (highlighting: ${selectedRegion.name})`
        : ''
      console.log(`[COLORS] ✅ Colored ${coloredHemispheres.join(', ')}${highlightInfo}`)
    }
  }, [meshesReady, parcellationData, selectedRegion])

  // Frame update (for future animations if needed)
  useFrame(() => {
    // Currently no per-frame updates needed
  })

  // Click handling for region selection
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

  const handleClick = (event) => {
    if (!meshesReady) return

    // Calculate mouse position in normalized device coordinates
    const canvas = event.target
    const rect = canvas.getBoundingClientRect()
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera)

    // Get visible pial meshes (only these are clickable)
    const clickableMeshes = []
    if (meshRefs.current.lh_pial && meshRefs.current.lh_pial.visible) {
      clickableMeshes.push(meshRefs.current.lh_pial)
    }
    if (meshRefs.current.rh_pial && meshRefs.current.rh_pial.visible) {
      clickableMeshes.push(meshRefs.current.rh_pial)
    }

    if (clickableMeshes.length === 0) return

    // Check for intersections
    const intersects = raycaster.current.intersectObjects(clickableMeshes, false)
    if (intersects.length === 0) return

    const intersection = intersects[0]
    const clickedMesh = intersection.object
    const hemisphere = clickedMesh === meshRefs.current.lh_pial ? 'lh' : 'rh'

    // Get vertex index from face
    const geometry = clickedMesh.geometry
    const faceIndex = intersection.faceIndex

    if (!geometry.index) return

    const indices = geometry.index.array
    const vertexIndex = indices[faceIndex * 3]

    // Get parcellation data for this hemisphere
    const hemData = parcellationData[hemisphere]
    if (!hemData) return

    // Get region for this vertex
    const region = getRegionForVertex(vertexIndex, hemData)
    if (!region) return

    console.log(`[CLICK] Selected: ${region.name} (${hemisphere === 'lh' ? 'Left' : 'Right'})`)

    // Update store with selected region
    setSelectedRegion({
      ...region,
      hemisphere
    })

    // Calculate region bounding box for camera animation
    const bbox = getRegionBoundingBox(region.id, hemData, geometry)

    if (bbox) {
      const centroid = bbox.center
      const size = {
        x: bbox.max.x - bbox.min.x,
        y: bbox.max.y - bbox.min.y,
        z: bbox.max.z - bbox.min.z
      }

      const maxSize = Math.max(size.x, size.y, size.z)
      const distance = maxSize * 2.5

      // Position camera with side angle based on hemisphere
      const cameraOffset = new THREE.Vector3(
        hemisphere === 'lh' ? -distance * 0.5 : distance * 0.5,
        distance * 0.3,
        distance * 0.8
      )

      const cameraPosition = {
        x: centroid.x + cameraOffset.x,
        y: centroid.y + cameraOffset.y,
        z: centroid.z + cameraOffset.z
      }

      // Trigger camera animation
      setCameraTarget({
        position: cameraPosition,
        lookAt: centroid,
        duration: 1.2
      })
    }
  }

  return (
    <primitive
      object={scene}
      onClick={handleClick}
    />
  )
}

// Preload the GLB model
useGLTF.preload('/model.glb')

export default BrainModel
