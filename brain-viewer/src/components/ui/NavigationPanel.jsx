import { motion } from 'framer-motion'
import useBrainStore from '../../store/brainStore'

/**
 * Navigation Panel Component - Apple Vision Pro Style
 * Glass morphism design with intuitive controls
 */
function NavigationPanel() {
  const {
    currentLayer,
    hemisphereVisibility,
    panels,
    setLayer,
    toggleHemisphere,
    togglePanel
  } = useBrainStore()

  if (!panels.navigation) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn btn-icon"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 10
        }}
        onClick={() => togglePanel('navigation')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </motion.button>
    )
  }

  const layers = [
    { id: 'face', label: 'Face', desc: 'External head surface' },
    { id: 'pial', label: 'Pial', desc: 'Outer brain surface' },
    { id: 'white', label: 'White', desc: 'White matter layer' },
    { id: 'all', label: 'All', desc: 'Combined view' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="panel"
      style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        width: '320px',
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        zIndex: 10
      }}
    >
      <div className="panel-header flex justify-between items-center">
        <span>Controls</span>
        <button
          onClick={() => togglePanel('navigation')}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '4px',
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.8'}
        >
          ×
        </button>
      </div>

      <div className="panel-content">
        {/* Layer Selection - Card Style */}
        <div className="mb-3">
          <label style={{ display: 'block', marginBottom: '12px' }}>
            Brain Layer
          </label>
          <div className="flex flex-col gap-2">
            {layers.map(layer => (
              <motion.button
                key={layer.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`btn ${currentLayer === layer.id ? 'btn-primary' : ''}`}
                onClick={() => setLayer(layer.id)}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{layer.label}</div>
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7,
                    marginTop: '2px',
                    fontWeight: 400
                  }}>
                    {layer.desc}
                  </div>
                </div>
                {currentLayer === layer.id && (
                  <motion.div
                    layoutId="activeLayer"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="divider"></div>

        {/* Hemisphere Toggles - Modern Toggle Style */}
        <div className="mb-2">
          <label style={{ display: 'block', marginBottom: '12px' }}>
            Hemisphere Visibility
          </label>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`btn ${hemisphereVisibility.left ? 'btn-primary' : ''}`}
              onClick={() => toggleHemisphere('left')}
              style={{
                flex: 1,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 12L6 8l4-4"/>
              </svg>
              <span>Left</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`btn ${hemisphereVisibility.right ? 'btn-primary' : ''}`}
              onClick={() => toggleHemisphere('right')}
              style={{
                flex: 1,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Right</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 12l4-4-4-4"/>
              </svg>
            </motion.button>
          </div>
        </div>

        <div className="divider"></div>

        {/* Keyboard Shortcuts - Info Card */}
        <div className="info-box">
          <div style={{
            fontWeight: 600,
            marginBottom: '8px',
            fontSize: '11px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            opacity: 0.9
          }}>
            Keyboard Shortcuts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Switch layers</span>
              <span className="badge">← →</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Rotate view</span>
              <span className="badge">Drag</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
              <span>Zoom in/out</span>
              <span className="badge">Scroll</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default NavigationPanel
