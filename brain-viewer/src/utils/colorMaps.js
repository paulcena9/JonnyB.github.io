import * as THREE from 'three'

/**
 * Color mapping utilities for brain data visualization
 * Provides various color schemes for morphometry data (thickness, curvature, etc.)
 */

/**
 * Color schemes for continuous data visualization
 */
export const COLOR_SCHEMES = {
  viridis: [
    [0.267004, 0.004874, 0.329415],
    [0.282623, 0.140926, 0.457517],
    [0.253935, 0.265254, 0.529983],
    [0.206756, 0.371758, 0.553117],
    [0.163625, 0.471133, 0.558148],
    [0.127568, 0.566949, 0.550556],
    [0.134692, 0.658636, 0.517649],
    [0.266941, 0.748751, 0.440573],
    [0.477504, 0.821444, 0.318195],
    [0.741388, 0.873449, 0.149561],
    [0.993248, 0.906157, 0.143936]
  ],

  plasma: [
    [0.050383, 0.029803, 0.527975],
    [0.285596, 0.010650, 0.628654],
    [0.480663, 0.013882, 0.658390],
    [0.647745, 0.126326, 0.607464],
    [0.788077, 0.283072, 0.469538],
    [0.881104, 0.449368, 0.321422],
    [0.939699, 0.616535, 0.187852],
    [0.974417, 0.789567, 0.094389],
    [0.987053, 0.958908, 0.096206],
    [0.940015, 0.975158, 0.131326]
  ],

  coolwarm: [
    [0.230, 0.299, 0.754],
    [0.436, 0.548, 0.900],
    [0.663, 0.754, 0.974],
    [0.865, 0.865, 0.865],
    [0.974, 0.754, 0.663],
    [0.900, 0.548, 0.436],
    [0.754, 0.299, 0.230]
  ],

  jet: [
    [0.0, 0.0, 0.5],
    [0.0, 0.0, 1.0],
    [0.0, 0.5, 1.0],
    [0.0, 1.0, 1.0],
    [0.5, 1.0, 0.5],
    [1.0, 1.0, 0.0],
    [1.0, 0.5, 0.0],
    [1.0, 0.0, 0.0],
    [0.5, 0.0, 0.0]
  ],

  hot: [
    [0.0, 0.0, 0.0],
    [0.5, 0.0, 0.0],
    [1.0, 0.0, 0.0],
    [1.0, 0.5, 0.0],
    [1.0, 1.0, 0.0],
    [1.0, 1.0, 0.5],
    [1.0, 1.0, 1.0]
  ],

  grayscale: [
    [0.0, 0.0, 0.0],
    [0.25, 0.25, 0.25],
    [0.5, 0.5, 0.5],
    [0.75, 0.75, 0.75],
    [1.0, 1.0, 1.0]
  ]
}

/**
 * Interpolate between colors in a color scheme
 * @param {number} value - Normalized value between 0 and 1
 * @param {Array} scheme - Color scheme array
 * @returns {THREE.Color}
 */
export function interpolateColor(value, scheme = COLOR_SCHEMES.viridis) {
  // Clamp value between 0 and 1
  value = Math.max(0, Math.min(1, value))

  // Handle edge cases
  if (value === 0) return new THREE.Color(...scheme[0])
  if (value === 1) return new THREE.Color(...scheme[scheme.length - 1])

  // Find the two colors to interpolate between
  const position = value * (scheme.length - 1)
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const t = position - lowerIndex

  const lowerColor = scheme[lowerIndex]
  const upperColor = scheme[upperIndex]

  // Linear interpolation
  const r = lowerColor[0] + (upperColor[0] - lowerColor[0]) * t
  const g = lowerColor[1] + (upperColor[1] - lowerColor[1]) * t
  const b = lowerColor[2] + (upperColor[2] - lowerColor[2]) * t

  return new THREE.Color(r, g, b)
}

/**
 * Normalize a value to 0-1 range
 * @param {number} value - Input value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Normalized value between 0 and 1
 */
export function normalize(value, min, max) {
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

/**
 * Create a color array for vertices based on morphometry data
 * @param {Array} values - Per-vertex values
 * @param {Object} options - Configuration options
 * @returns {Float32Array} RGB color array
 */
export function createVertexColors(values, options = {}) {
  const {
    scheme = 'viridis',
    min = Math.min(...values),
    max = Math.max(...values),
    defaultColor = [0.5, 0.5, 0.5]
  } = options

  const colorScheme = COLOR_SCHEMES[scheme] || COLOR_SCHEMES.viridis
  const colors = new Float32Array(values.length * 3)

  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    // Use default color for zero or invalid values
    if (value === 0 || isNaN(value)) {
      colors[i * 3] = defaultColor[0]
      colors[i * 3 + 1] = defaultColor[1]
      colors[i * 3 + 2] = defaultColor[2]
      continue
    }

    // Normalize and get color
    const normalized = normalize(value, min, max)
    const color = interpolateColor(normalized, colorScheme)

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  return colors
}

/**
 * Create color array for parcellation data
 * @param {Array} vertexLabels - Array of region IDs for each vertex
 * @param {Array} regions - Array of region objects with color info
 * @param {Object} options - Configuration options
 * @returns {Float32Array} RGB color array
 */
export function createParcellationColors(vertexLabels, regions, options = {}) {
  const {
    highlightedRegions = [],
    highlightColor = [1.0, 1.0, 0.0], // Yellow
    dimFactor = 0.3
  } = options

  const colors = new Float32Array(vertexLabels.length * 3)

  // Create lookup map for region colors
  const regionColorMap = {}
  regions.forEach(region => {
    if (region.color) {
      regionColorMap[region.id] = {
        r: region.color.r / 255,
        g: region.color.g / 255,
        b: region.color.b / 255
      }
    }
  })

  for (let i = 0; i < vertexLabels.length; i++) {
    const regionId = vertexLabels[i]

    // Default gray for unknown regions
    if (regionId === -1 || !regionColorMap[regionId]) {
      colors[i * 3] = 0.5
      colors[i * 3 + 1] = 0.5
      colors[i * 3 + 2] = 0.5
      continue
    }

    const color = regionColorMap[regionId]

    // Check if this region should be highlighted
    const isHighlighted = highlightedRegions.includes(regionId)

    if (isHighlighted) {
      // Use highlight color
      colors[i * 3] = highlightColor[0]
      colors[i * 3 + 1] = highlightColor[1]
      colors[i * 3 + 2] = highlightColor[2]
    } else if (highlightedRegions.length > 0) {
      // Dim non-highlighted regions
      colors[i * 3] = color.r * dimFactor
      colors[i * 3 + 1] = color.g * dimFactor
      colors[i * 3 + 2] = color.b * dimFactor
    } else {
      // Normal color
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
  }

  return colors
}

/**
 * Create a color legend for a given color scheme
 * @param {string} schemeName - Name of the color scheme
 * @param {number} steps - Number of steps in the legend
 * @returns {Array} Array of { value, color } objects
 */
export function createColorLegend(schemeName, steps = 10) {
  const scheme = COLOR_SCHEMES[schemeName] || COLOR_SCHEMES.viridis
  const legend = []

  for (let i = 0; i < steps; i++) {
    const value = i / (steps - 1)
    const color = interpolateColor(value, scheme)
    legend.push({
      value,
      color: color.getHexString()
    })
  }

  return legend
}

/**
 * Get color for a specific region by ID
 * @param {number} regionId - Region ID
 * @param {Array} regions - Array of region objects
 * @returns {THREE.Color}
 */
export function getRegionColor(regionId, regions) {
  const region = regions.find(r => r.id === regionId)
  if (region && region.color) {
    return new THREE.Color(
      region.color.r / 255,
      region.color.g / 255,
      region.color.b / 255
    )
  }
  return new THREE.Color(0.5, 0.5, 0.5) // Default gray
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string
 * @returns {Object} { r, g, b } with values 0-1
 */
export function hexToRgb(hex) {
  const color = new THREE.Color(hex)
  return {
    r: color.r,
    g: color.g,
    b: color.b
  }
}

/**
 * Calculate contrasting text color for background
 * @param {THREE.Color} backgroundColor
 * @returns {string} 'black' or 'white'
 */
export function getContrastingTextColor(backgroundColor) {
  const luminance = 0.299 * backgroundColor.r + 0.587 * backgroundColor.g + 0.114 * backgroundColor.b
  return luminance > 0.5 ? 'black' : 'white'
}
