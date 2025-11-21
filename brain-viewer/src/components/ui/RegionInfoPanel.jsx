import { motion } from 'framer-motion'
import useBrainStore from '../../store/brainStore'

/**
 * Region Info Panel Component
 * Displays information about the selected brain region
 */
function RegionInfoPanel() {
  const {
    selectedRegion,
    hoveredRegion,
    regionDescriptions,
    statisticsData,
    panels,
    togglePanel,
    clearSelection
  } = useBrainStore()

  const region = selectedRegion || hoveredRegion

  if (!panels.regionInfo && !region) {
    return null
  }

  if (!region) {
    return (
      <button
        className="btn"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10
        }}
        onClick={() => togglePanel('regionInfo')}
      >
        ℹ️ Region Info
      </button>
    )
  }

  // Get educational description if available
  const description = regionDescriptions?.[region.name.toLowerCase()]

  // Get statistics if available
  const stats = statisticsData?.[`${region.hemisphere}.aparc`]?.regions?.[region.name]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="panel"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '320px',
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        zIndex: 10
      }}
    >
      <div className="panel-header flex justify-between items-center">
        <span>Region Info</span>
        <div className="flex gap-2">
          {selectedRegion && (
            <button
              onClick={clearSelection}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Clear selection"
            >
              ⊗
            </button>
          )}
          <button
            onClick={() => togglePanel('regionInfo')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* Region Name */}
        <div className="mb-3">
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
            textTransform: 'capitalize'
          }}>
            {region.name.replace(/([a-z])([A-Z])/g, '$1 $2')}
          </h3>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {region.hemisphere === 'lh' ? 'Left Hemisphere' : 'Right Hemisphere'}
          </div>
        </div>

        {/* Color */}
        {region.color && (
          <div className="mb-3">
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              Region Color
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '2px solid #111',
                background: `rgb(${region.color.r}, ${region.color.g}, ${region.color.b})`
              }}></div>
              <div style={{ fontSize: '12px' }}>
                RGB({region.color.r}, {region.color.g}, {region.color.b})
              </div>
            </div>
          </div>
        )}

        {/* Educational Description */}
        {description && (
          <>
            <div className="mb-2">
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                Full Name
              </label>
              <div style={{ fontSize: '14px' }}>
                {description.name}
              </div>
            </div>

            <div className="mb-2">
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                Function
              </label>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {description.function}
              </div>
            </div>

            <div className="mb-3">
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                Clinical Significance
              </label>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {description.clinical}
              </div>
            </div>
          </>
        )}

        {/* Statistics */}
        {stats && (
          <div className="mb-3">
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Measurements
            </label>
            <div style={{
              background: '#f5f5f5',
              border: '1px solid #ddd',
              padding: '8px',
              fontSize: '12px'
            }}>
              {stats.num_vertices && (
                <div className="flex justify-between mb-1">
                  <span>Vertices:</span>
                  <strong>{stats.num_vertices.toLocaleString()}</strong>
                </div>
              )}
              {stats.surface_area && (
                <div className="flex justify-between mb-1">
                  <span>Surface Area:</span>
                  <strong>{stats.surface_area.toFixed(0)} mm²</strong>
                </div>
              )}
              {stats.gray_volume && (
                <div className="flex justify-between mb-1">
                  <span>Gray Matter Volume:</span>
                  <strong>{stats.gray_volume.toFixed(0)} mm³</strong>
                </div>
              )}
              {stats.avg_thickness && (
                <div className="flex justify-between mb-1">
                  <span>Avg Thickness:</span>
                  <strong>{stats.avg_thickness.toFixed(2)} mm</strong>
                </div>
              )}
              {stats.std_thickness && (
                <div className="flex justify-between">
                  <span>Std Thickness:</span>
                  <strong>{stats.std_thickness.toFixed(2)} mm</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vertex Count */}
        {region.vertex_count && (
          <div className="mb-2">
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              Vertex Count
            </label>
            <div style={{ fontSize: '14px' }}>
              {region.vertex_count.toLocaleString()} vertices
            </div>
          </div>
        )}

        {/* Hover vs Selected */}
        {!selectedRegion && hoveredRegion && (
          <div style={{
            marginTop: '16px',
            padding: '8px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            Click to select this region
          </div>
        )}

        {/* Learn More */}
        {description && (
          <div className="mt-3">
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                const query = encodeURIComponent(description.name + ' brain function')
                window.open(`https://www.google.com/search?q=${query}`, '_blank')
              }}
            >
              📚 Learn More
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default RegionInfoPanel
