import { motion } from 'framer-motion'
import useBrainStore from '../../store/brainStore'
import { COLOR_SCHEMES, createColorLegend } from '../../utils/colorMaps'

/**
 * Settings Panel Component
 * Controls for color maps, opacity, and other visualization settings
 */
function SettingsPanel() {
  const {
    colorMapSettings,
    visualizationMode,
    panels,
    togglePanel,
    setColorMapScheme,
    setColorMapOpacity
  } = useBrainStore()

  if (!panels.settings) {
    return (
      <button
        className="btn"
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 10
        }}
        onClick={() => togglePanel('settings')}
      >
        ⚙️ Settings
      </button>
    )
  }

  // Only show color map settings for morphometry modes
  const showColorMapSettings = ['thickness', 'curvature', 'sulcus'].includes(visualizationMode)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="panel"
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '280px',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 10
      }}
    >
      <div className="panel-header flex justify-between items-center">
        <span>Settings</span>
        <button
          onClick={() => togglePanel('settings')}
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

      <div className="panel-content">
        {showColorMapSettings ? (
          <>
            {/* Color Scheme */}
            <div className="mb-3">
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Color Scheme
              </label>
              <select
                value={colorMapSettings.scheme}
                onChange={(e) => setColorMapScheme(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="viridis">Viridis</option>
                <option value="plasma">Plasma</option>
                <option value="coolwarm">Cool-Warm</option>
                <option value="jet">Jet</option>
                <option value="hot">Hot</option>
                <option value="grayscale">Grayscale</option>
              </select>
            </div>

            {/* Color Legend */}
            <div className="mb-3">
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Color Legend
              </label>
              <div style={{
                height: '30px',
                background: `linear-gradient(to right, ${
                  createColorLegend(colorMapSettings.scheme, 10)
                    .map(({ color }) => `#${color}`)
                    .join(', ')
                })`,
                border: '2px solid #111'
              }}></div>
              <div className="flex justify-between" style={{ fontSize: '10px', marginTop: '4px' }}>
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>

            {/* Opacity */}
            <div className="mb-3">
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Opacity: {Math.round(colorMapSettings.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={colorMapSettings.opacity * 100}
                onChange={(e) => setColorMapOpacity(e.target.value / 100)}
                style={{ width: '100%' }}
              />
            </div>
          </>
        ) : (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#666'
          }}>
            Color map settings are available for thickness, curvature, and sulcus visualization modes.
          </div>
        )}

        {/* General Settings */}
        <div className="mb-2">
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
            General
          </label>
          <div style={{
            background: '#f5f5f5',
            border: '1px solid #ddd',
            padding: '8px',
            fontSize: '12px'
          }}>
            <div className="mb-1">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>Enable animations</span>
              </label>
            </div>
            <div className="mb-1">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>Show region labels</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" />
                <span>High quality rendering</span>
              </label>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="mt-3">
          <button
            className="btn"
            style={{ width: '100%', fontSize: '12px' }}
            onClick={() => alert('Export functionality coming soon!')}
          >
            💾 Export Current View
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default SettingsPanel
