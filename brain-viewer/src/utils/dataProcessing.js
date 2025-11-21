/**
 * Data processing utilities for brain visualization
 * Handles vertex-to-region mapping, data interpolation, and statistical calculations
 */

/**
 * Map vertex index to region information
 * @param {number} vertexIndex - Index of the vertex
 * @param {Object} parcellationData - Parcellation data object
 * @returns {Object|null} Region information or null if not found
 */
export function getRegionForVertex(vertexIndex, parcellationData) {
  if (!parcellationData || !parcellationData.vertex_labels) {
    return null
  }

  const regionId = parcellationData.vertex_labels[vertexIndex]

  if (regionId === -1 || regionId === undefined) {
    return null
  }

  const region = parcellationData.regions.find(r => r.id === regionId)
  return region || null
}

/**
 * Get all vertices for a specific region
 * @param {number} regionId - Region ID
 * @param {Object} parcellationData - Parcellation data object
 * @returns {Array} Array of vertex indices
 */
export function getVerticesForRegion(regionId, parcellationData) {
  if (!parcellationData || !parcellationData.vertex_labels) {
    return []
  }

  return parcellationData.vertex_labels
    .map((label, index) => label === regionId ? index : -1)
    .filter(index => index !== -1)
}

/**
 * Find region by name (case-insensitive, partial match)
 * @param {string} query - Search query
 * @param {Object} parcellationData - Parcellation data object
 * @returns {Array} Array of matching regions
 */
export function searchRegions(query, parcellationData) {
  if (!query || !parcellationData || !parcellationData.regions) {
    return []
  }

  const lowerQuery = query.toLowerCase()

  return parcellationData.regions.filter(region =>
    region.name.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get statistics for a region from morphometry data
 * @param {number} regionId - Region ID
 * @param {Object} parcellationData - Parcellation data
 * @param {Object} morphometryData - Morphometry data (thickness, curvature, etc.)
 * @returns {Object} Statistical summary
 */
export function getRegionMorphometryStats(regionId, parcellationData, morphometryData) {
  const vertexIndices = getVerticesForRegion(regionId, parcellationData)

  if (vertexIndices.length === 0 || !morphometryData || !morphometryData.values) {
    return null
  }

  const values = vertexIndices
    .map(idx => morphometryData.values[idx])
    .filter(val => val !== 0 && !isNaN(val))

  if (values.length === 0) {
    return null
  }

  // Calculate statistics
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  const std = Math.sqrt(variance)

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median: sorted[Math.floor(sorted.length / 2)],
    std,
    count: values.length,
    percentile_5: sorted[Math.floor(sorted.length * 0.05)],
    percentile_95: sorted[Math.floor(sorted.length * 0.95)]
  }
}

/**
 * Calculate centroid of a region in 3D space
 * @param {number} regionId - Region ID
 * @param {Object} parcellationData - Parcellation data
 * @param {Object} geometry - THREE.BufferGeometry of the mesh
 * @returns {THREE.Vector3|null} Centroid position
 */
export function getRegionCentroid(regionId, parcellationData, geometry) {
  if (!geometry || !geometry.attributes.position) {
    return null
  }

  const vertexIndices = getVerticesForRegion(regionId, parcellationData)

  if (vertexIndices.length === 0) {
    return null
  }

  const positions = geometry.attributes.position.array
  let x = 0, y = 0, z = 0

  vertexIndices.forEach(idx => {
    x += positions[idx * 3]
    y += positions[idx * 3 + 1]
    z += positions[idx * 3 + 2]
  })

  const count = vertexIndices.length
  return {
    x: x / count,
    y: y / count,
    z: z / count
  }
}

/**
 * Find closest vertex to a 3D point
 * @param {THREE.Vector3} point - Target point
 * @param {Object} geometry - THREE.BufferGeometry
 * @param {Array} candidateIndices - Optional array of vertex indices to search within
 * @returns {number} Index of closest vertex
 */
export function findClosestVertex(point, geometry, candidateIndices = null) {
  if (!geometry || !geometry.attributes.position) {
    return -1
  }

  const positions = geometry.attributes.position.array
  const indices = candidateIndices || Array.from({ length: positions.length / 3 }, (_, i) => i)

  let closestIndex = -1
  let closestDistance = Infinity

  indices.forEach(idx => {
    const vx = positions[idx * 3]
    const vy = positions[idx * 3 + 1]
    const vz = positions[idx * 3 + 2]

    const dx = vx - point.x
    const dy = vy - point.y
    const dz = vz - point.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = idx
    }
  })

  return closestIndex
}

/**
 * Calculate bounding box for a region
 * @param {number} regionId - Region ID
 * @param {Object} parcellationData - Parcellation data
 * @param {Object} geometry - THREE.BufferGeometry
 * @returns {Object} Bounding box { min: {x,y,z}, max: {x,y,z} }
 */
export function getRegionBoundingBox(regionId, parcellationData, geometry) {
  if (!geometry || !geometry.attributes.position) {
    return null
  }

  const vertexIndices = getVerticesForRegion(regionId, parcellationData)

  if (vertexIndices.length === 0) {
    return null
  }

  const positions = geometry.attributes.position.array

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  vertexIndices.forEach(idx => {
    const x = positions[idx * 3]
    const y = positions[idx * 3 + 1]
    const z = positions[idx * 3 + 2]

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    minZ = Math.min(minZ, z)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
    maxZ = Math.max(maxZ, z)
  })

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    }
  }
}

/**
 * Smooth morphometry values using neighbor averaging
 * @param {Array} values - Per-vertex values
 * @param {Object} geometry - THREE.BufferGeometry with vertex data
 * @param {number} iterations - Number of smoothing iterations
 * @returns {Array} Smoothed values
 */
export function smoothValues(values, geometry, iterations = 1) {
  if (!geometry || iterations === 0) {
    return values
  }

  let smoothed = [...values]

  // Build vertex neighbor map from faces
  const neighbors = buildNeighborMap(geometry)

  for (let iter = 0; iter < iterations; iter++) {
    const newValues = [...smoothed]

    for (let i = 0; i < smoothed.length; i++) {
      const neighborIndices = neighbors[i] || []

      if (neighborIndices.length === 0) {
        continue
      }

      let sum = smoothed[i]
      let count = 1

      neighborIndices.forEach(neighborIdx => {
        if (smoothed[neighborIdx] !== 0) {
          sum += smoothed[neighborIdx]
          count++
        }
      })

      newValues[i] = sum / count
    }

    smoothed = newValues
  }

  return smoothed
}

/**
 * Build vertex neighbor map from geometry
 * @param {Object} geometry - THREE.BufferGeometry
 * @returns {Object} Map of vertex index to array of neighbor indices
 */
function buildNeighborMap(geometry) {
  const neighbors = {}

  if (!geometry.index) {
    return neighbors
  }

  const indices = geometry.index.array

  // Initialize neighbor arrays
  const vertexCount = geometry.attributes.position.count
  for (let i = 0; i < vertexCount; i++) {
    neighbors[i] = new Set()
  }

  // Build neighbor relationships from faces
  for (let i = 0; i < indices.length; i += 3) {
    const v0 = indices[i]
    const v1 = indices[i + 1]
    const v2 = indices[i + 2]

    neighbors[v0].add(v1)
    neighbors[v0].add(v2)
    neighbors[v1].add(v0)
    neighbors[v1].add(v2)
    neighbors[v2].add(v0)
    neighbors[v2].add(v1)
  }

  // Convert sets to arrays
  Object.keys(neighbors).forEach(key => {
    neighbors[key] = Array.from(neighbors[key])
  })

  return neighbors
}

/**
 * Get neighboring regions for a given region
 * @param {number} regionId - Region ID
 * @param {Object} parcellationData - Parcellation data
 * @param {Object} geometry - THREE.BufferGeometry
 * @returns {Array} Array of neighboring region IDs
 */
export function getNeighboringRegions(regionId, parcellationData, geometry) {
  if (!geometry || !parcellationData) {
    return []
  }

  const vertexIndices = getVerticesForRegion(regionId, parcellationData)
  const neighbors = buildNeighborMap(geometry)
  const neighboringRegions = new Set()

  vertexIndices.forEach(vertexIdx => {
    const vertexNeighbors = neighbors[vertexIdx] || []

    vertexNeighbors.forEach(neighborIdx => {
      const neighborRegionId = parcellationData.vertex_labels[neighborIdx]

      if (neighborRegionId !== regionId && neighborRegionId !== -1) {
        neighboringRegions.add(neighborRegionId)
      }
    })
  })

  return Array.from(neighboringRegions)
}

/**
 * Calculate surface area of a region
 * @param {number} regionId - Region ID
 * @param {Object} parcellationData - Parcellation data
 * @param {Object} geometry - THREE.BufferGeometry
 * @returns {number} Surface area in mesh units^2
 */
export function calculateRegionSurfaceArea(regionId, parcellationData, geometry) {
  if (!geometry || !geometry.index) {
    return 0
  }

  const vertexSet = new Set(getVerticesForRegion(regionId, parcellationData))
  const indices = geometry.index.array
  const positions = geometry.attributes.position.array

  let totalArea = 0

  // Iterate through faces and sum area of faces belonging to this region
  for (let i = 0; i < indices.length; i += 3) {
    const v0 = indices[i]
    const v1 = indices[i + 1]
    const v2 = indices[i + 2]

    // Check if all vertices of this face belong to the region
    if (vertexSet.has(v0) && vertexSet.has(v1) && vertexSet.has(v2)) {
      // Calculate triangle area using cross product
      const ax = positions[v0 * 3]
      const ay = positions[v0 * 3 + 1]
      const az = positions[v0 * 3 + 2]

      const bx = positions[v1 * 3]
      const by = positions[v1 * 3 + 1]
      const bz = positions[v1 * 3 + 2]

      const cx = positions[v2 * 3]
      const cy = positions[v2 * 3 + 1]
      const cz = positions[v2 * 3 + 2]

      // Vectors AB and AC
      const abx = bx - ax
      const aby = by - ay
      const abz = bz - az

      const acx = cx - ax
      const acy = cy - ay
      const acz = cz - az

      // Cross product AB × AC
      const crossX = aby * acz - abz * acy
      const crossY = abz * acx - abx * acz
      const crossZ = abx * acy - aby * acx

      // Magnitude of cross product / 2 = triangle area
      const area = 0.5 * Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ)
      totalArea += area
    }
  }

  return totalArea
}

/**
 * Export region data to CSV format
 * @param {Object} parcellationData - Parcellation data
 * @param {Object} statisticsData - Statistics data
 * @returns {string} CSV formatted string
 */
export function exportRegionDataToCSV(parcellationData, statisticsData) {
  if (!parcellationData || !parcellationData.regions) {
    return ''
  }

  const headers = ['Region ID', 'Region Name', 'Hemisphere', 'Vertex Count', 'Color (RGB)']
  const rows = [headers.join(',')]

  parcellationData.regions.forEach(region => {
    const row = [
      region.id,
      region.name,
      parcellationData.hemisphere,
      region.vertex_count,
      `"(${region.color.r}, ${region.color.g}, ${region.color.b})"`
    ]
    rows.push(row.join(','))
  })

  return rows.join('\n')
}
