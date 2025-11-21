import { useEffect, useState } from 'react'
import useBrainStore from '../store/brainStore'

/**
 * Custom hook for loading and managing FreeSurfer data
 * @param {boolean} autoLoad - Whether to automatically load data on mount
 * @returns {Object} Loading state and data
 */
export function useFreeSurferData(autoLoad = true) {
  const {
    parcellationData,
    morphometryData,
    statisticsData,
    regionDescriptions,
    isLoading,
    error,
    loadAllData,
    currentAtlas
  } = useBrainStore()

  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    if (autoLoad && !dataReady) {
      loadAllData()
    }
  }, [autoLoad, loadAllData])

  useEffect(() => {
    // Check if essential data is loaded
    const parcellationReady = parcellationData.lh !== null && parcellationData.rh !== null
    const morphometryReady = morphometryData.lh.thickness !== null && morphometryData.rh.thickness !== null

    setDataReady(parcellationReady && morphometryReady)
  }, [parcellationData, morphometryData])

  return {
    parcellationData,
    morphometryData,
    statisticsData,
    regionDescriptions,
    isLoading,
    error,
    dataReady,
    reload: loadAllData
  }
}

export default useFreeSurferData
