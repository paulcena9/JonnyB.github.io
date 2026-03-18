import { motion, AnimatePresence } from 'framer-motion'
import useBrainStore from '../../store/brainStore'
import { getRegionMorphometryStats } from '../../utils/dataProcessing'
import { useEffect, useState } from 'react'

/**
 * RegionInfoCard Component
 * Displays information about the selected brain region
 * Shows region name, function, and personal statistics
 */
function RegionInfoCard() {
  const {
    selectedRegion,
    regionDescriptions,
    morphometryData,
    parcellationData,
    statisticsData,
    clearSelection
  } = useBrainStore()

  const [stats, setStats] = useState(null)

  // Calculate statistics for selected region
  useEffect(() => {
    if (!selectedRegion) {
      setStats(null)
      return
    }

    const hemisphere = selectedRegion.hemisphere
    const regionId = selectedRegion.id

    // Get thickness stats
    const thicknessData = morphometryData[hemisphere]?.thickness
    const hemParc = parcellationData[hemisphere]

    if (thicknessData && hemParc) {
      const thicknessStats = getRegionMorphometryStats(
        regionId,
        hemParc,
        thicknessData
      )

      if (thicknessStats) {
        setStats({
          thickness: {
            mean: thicknessStats.mean.toFixed(2),
            range: `${thicknessStats.min.toFixed(2)} - ${thicknessStats.max.toFixed(2)}`
          }
        })
      }
    }

    // Get region stats from statistics file if available
    if (statisticsData) {
      // Find region stats in the statistics data
      const regionStats = statisticsData[hemisphere]?.regions?.find(
        r => r.id === regionId
      )

      if (regionStats) {
        setStats(prev => ({
          ...prev,
          area: regionStats.area ? `${regionStats.area.toFixed(0)} mm²` : null,
          volume: regionStats.volume ? `${regionStats.volume.toFixed(0)} mm³` : null
        }))
      }
    }
  }, [selectedRegion, morphometryData, parcellationData, statisticsData])

  if (!selectedRegion) return null

  // Get region description from metadata
  const description = regionDescriptions?.[selectedRegion.name] || {
    name: selectedRegion.name,
    function: 'Information not available',
    clinical: null
  }

  const hemisphereLabel = selectedRegion.hemisphere === 'lh' ? 'Left' : 'Right'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="glass"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          width: 'min(360px, calc(100vw - 48px))',
          maxHeight: '400px',
          borderRadius: '20px',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          className="panel-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {description.name}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
              {hemisphereLabel} Hemisphere
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="btn-icon"
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: 'white'
            }}
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="panel-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {/* Function */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: 0.7,
                marginBottom: '6px'
              }}
            >
              Function
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              {description.function}
            </div>
          </div>

          {/* Personal Statistics */}
          {stats && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.7,
                  marginBottom: '8px'
                }}
              >
                Your Brain Statistics
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}
              >
                {/* Thickness */}
                {stats.thickness && (
                  <div
                    className="info-box"
                    style={{ padding: '10px', borderRadius: '8px' }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        opacity: 0.6,
                        marginBottom: '4px'
                      }}
                    >
                      Cortical Thickness
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {stats.thickness.mean} mm
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>
                      Range: {stats.thickness.range} mm
                    </div>
                  </div>
                )}

                {/* Vertex Count */}
                <div
                  className="info-box"
                  style={{ padding: '10px', borderRadius: '8px' }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      opacity: 0.6,
                      marginBottom: '4px'
                    }}
                  >
                    Vertices
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {selectedRegion.vertex_count?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                {/* Area */}
                {stats.area && (
                  <div
                    className="info-box"
                    style={{ padding: '10px', borderRadius: '8px' }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        opacity: 0.6,
                        marginBottom: '4px'
                      }}
                    >
                      Surface Area
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {stats.area}
                    </div>
                  </div>
                )}

                {/* Volume */}
                {stats.volume && (
                  <div
                    className="info-box"
                    style={{ padding: '10px', borderRadius: '8px' }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        opacity: 0.6,
                        marginBottom: '4px'
                      }}
                    >
                      Volume
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {stats.volume}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinical Note */}
          {description.clinical && (
            <div
              className="info-box"
              style={{
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                lineHeight: '1.6',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.7,
                  marginBottom: '6px'
                }}
              >
                Clinical Note
              </div>
              {description.clinical}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default RegionInfoCard
