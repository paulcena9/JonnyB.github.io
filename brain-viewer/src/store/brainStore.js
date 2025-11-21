import { create } from 'zustand'

/**
 * Brain Viewer State Management
 *
 * Manages the state for the interactive brain visualization including:
 * - Current layer and visualization mode
 * - Selected region and hemisphere visibility
 * - FreeSurfer data (parcellation, morphometry, statistics)
 * - Camera animation targets
 * - UI panel visibility
 */
const useBrainStore = create((set, get) => ({
  // ========== VIEW STATE ==========
  currentLayer: 'face', // 'face' | 'pial' | 'white' | 'all'
  visualizationMode: 'parcellation', // 'parcellation' | 'thickness' | 'curvature' | 'sulcus' | 'statistics'
  currentAtlas: 'aparc', // 'aparc' | 'aparc.a2009s'

  hemisphereVisibility: {
    left: true,
    right: true
  },

  // ========== SELECTION STATE ==========
  selectedRegion: null, // { id, name, hemisphere, color, statistics }
  hoveredRegion: null,
  highlightedRegions: [], // Array of region IDs to highlight

  // ========== DATA STATE ==========
  parcellationData: {
    lh: null,
    rh: null
  },
  morphometryData: {
    lh: {
      thickness: null,
      curvature: null,
      sulcus: null
    },
    rh: {
      thickness: null,
      curvature: null,
      sulcus: null
    }
  },
  statisticsData: null,
  regionDescriptions: null,

  // ========== LOADING STATE ==========
  isLoading: {
    model: true,
    parcellation: false,
    morphometry: false,
    statistics: false
  },
  loadingProgress: 0,
  error: null,

  // ========== ANIMATION STATE ==========
  cameraTarget: null, // { position, lookAt, duration }
  animationProgress: 0,
  isAnimating: false,

  // ========== UI STATE ==========
  panels: {
    navigation: true,
    regionInfo: true,
    education: false,
    settings: false
  },
  searchQuery: '',

  // ========== COLOR MAP SETTINGS ==========
  colorMapSettings: {
    scheme: 'viridis', // 'viridis' | 'plasma' | 'coolwarm' | 'jet'
    range: [0, 1], // [min, max] for normalization
    opacity: 1.0
  },

  // ========== ACTIONS ==========

  // Layer and visualization
  setLayer: (layer) => set({ currentLayer: layer }),

  setVisualizationMode: (mode) => set({
    visualizationMode: mode,
    // Reset color map range when switching modes
    colorMapSettings: {
      ...get().colorMapSettings,
      range: [0, 1]
    }
  }),

  setAtlas: (atlas) => set({ currentAtlas: atlas }),

  // Hemisphere visibility
  toggleHemisphere: (hemisphere) => set((state) => ({
    hemisphereVisibility: {
      ...state.hemisphereVisibility,
      [hemisphere]: !state.hemisphereVisibility[hemisphere]
    }
  })),

  setHemisphereVisibility: (left, right) => set({
    hemisphereVisibility: { left, right }
  }),

  // Region selection
  setSelectedRegion: (region) => set({
    selectedRegion: region,
    panels: {
      ...get().panels,
      regionInfo: true // Auto-open region info panel
    }
  }),

  setHoveredRegion: (region) => set({ hoveredRegion: region }),

  highlightRegions: (regionIds) => set({ highlightedRegions: regionIds }),

  clearSelection: () => set({
    selectedRegion: null,
    hoveredRegion: null,
    highlightedRegions: []
  }),

  // Data loading
  setParcellationData: (hemisphere, data) => set((state) => ({
    parcellationData: {
      ...state.parcellationData,
      [hemisphere]: data
    }
  })),

  setMorphometryData: (hemisphere, type, data) => set((state) => ({
    morphometryData: {
      ...state.morphometryData,
      [hemisphere]: {
        ...state.morphometryData[hemisphere],
        [type]: data
      }
    }
  })),

  setStatisticsData: (data) => set({ statisticsData: data }),

  setRegionDescriptions: (data) => set({ regionDescriptions: data }),

  setLoading: (category, isLoading) => set((state) => ({
    isLoading: {
      ...state.isLoading,
      [category]: isLoading
    }
  })),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  setError: (error) => set({ error }),

  // Animation
  setCameraTarget: (target) => set({
    cameraTarget: target,
    isAnimating: true
  }),

  setAnimationProgress: (progress) => set({ animationProgress: progress }),

  setIsAnimating: (isAnimating) => set({ isAnimating }),

  // UI panels
  togglePanel: (panel) => set((state) => ({
    panels: {
      ...state.panels,
      [panel]: !state.panels[panel]
    }
  })),

  setPanel: (panel, visible) => set((state) => ({
    panels: {
      ...state.panels,
      [panel]: visible
    }
  })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Color map settings
  setColorMapScheme: (scheme) => set((state) => ({
    colorMapSettings: {
      ...state.colorMapSettings,
      scheme
    }
  })),

  setColorMapRange: (range) => set((state) => ({
    colorMapSettings: {
      ...state.colorMapSettings,
      range
    }
  })),

  setColorMapOpacity: (opacity) => set((state) => ({
    colorMapSettings: {
      ...state.colorMapSettings,
      opacity
    }
  })),

  // Utility actions
  reset: () => set({
    selectedRegion: null,
    hoveredRegion: null,
    highlightedRegions: [],
    cameraTarget: null,
    isAnimating: false,
    searchQuery: ''
  }),

  // Async data loading
  loadAllData: async () => {
    const store = get()

    try {
      store.setLoading('parcellation', true)
      store.setLoading('morphometry', true)
      store.setLoading('statistics', true)

      // Load parcellation data for both hemispheres
      const baseUrl = '/brain-data'

      // Load left hemisphere parcellation
      const lhParcResponse = await fetch(`${baseUrl}/parcellation/lh.${store.currentAtlas}.json`)
      if (lhParcResponse.ok) {
        const lhParc = await lhParcResponse.json()
        store.setParcellationData('lh', lhParc)
      }

      // Load right hemisphere parcellation
      const rhParcResponse = await fetch(`${baseUrl}/parcellation/rh.${store.currentAtlas}.json`)
      if (rhParcResponse.ok) {
        const rhParc = await rhParcResponse.json()
        store.setParcellationData('rh', rhParc)
      }

      store.setLoading('parcellation', false)

      // Load morphometry data
      const morphTypes = ['thickness', 'curv', 'sulc']
      for (const hemisphere of ['lh', 'rh']) {
        for (const type of morphTypes) {
          const response = await fetch(`${baseUrl}/morphometry/${hemisphere}.${type}.json`)
          if (response.ok) {
            const data = await response.json()
            store.setMorphometryData(hemisphere, type, data)
          }
        }
      }

      store.setLoading('morphometry', false)

      // Load statistics
      const statsResponse = await fetch(`${baseUrl}/statistics/all_stats.json`)
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        store.setStatisticsData(stats)
      }

      store.setLoading('statistics', false)

      // Load region descriptions
      const metadataResponse = await fetch(`${baseUrl}/metadata/conversion_info.json`)
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json()
        store.setRegionDescriptions(metadata.region_descriptions)
      }

    } catch (error) {
      console.error('Error loading FreeSurfer data:', error)
      store.setError(error.message)
      store.setLoading('parcellation', false)
      store.setLoading('morphometry', false)
      store.setLoading('statistics', false)
    }
  }
}))

export default useBrainStore
