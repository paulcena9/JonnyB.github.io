import { useEffect } from 'react'
import { motion } from 'framer-motion'
import BrainCanvas from './components/canvas/BrainCanvas'
import LoadingScreen from './components/shared/LoadingScreen'
import NavigationPanel from './components/ui/NavigationPanel'
import RegionInfoPanel from './components/ui/RegionInfoPanel'
import SettingsPanel from './components/ui/SettingsPanel'
import useFreeSurferData from './hooks/useFreeSurferData'
import useBrainStore from './store/brainStore'

/**
 * Main App Component
 * Interactive 3D Brain Visualization Application
 */
function App() {
  // Disable FreeSurfer data loading for baseline testing
  const { dataReady, error } = useFreeSurferData(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      const { currentLayer, setLayer, togglePanel } = useBrainStore.getState()

      switch (e.key) {
        case 'ArrowLeft':
          // Cycle backward through layers
          const layersBackward = ['face', 'all', 'white', 'pial']
          const currentIndexBackward = layersBackward.indexOf(currentLayer)
          const nextIndexBackward = (currentIndexBackward + 1) % layersBackward.length
          setLayer(layersBackward[nextIndexBackward])
          break

        case 'ArrowRight':
          // Cycle forward through layers
          const layersForward = ['face', 'pial', 'white', 'all']
          const currentIndexForward = layersForward.indexOf(currentLayer)
          const nextIndexForward = (currentIndexForward + 1) % layersForward.length
          setLayer(layersForward[nextIndexForward])
          break

        case 'Escape':
          // Clear selection
          useBrainStore.getState().clearSelection()
          break

        case 'n':
        case 'N':
          // Toggle navigation panel
          if (!e.ctrlKey && !e.metaKey) {
            togglePanel('navigation')
          }
          break

        case 'i':
        case 'I':
          // Toggle info panel
          if (!e.ctrlKey && !e.metaKey) {
            togglePanel('regionInfo')
          }
          break

        case 's':
        case 'S':
          // Toggle settings panel
          if (!e.ctrlKey && !e.metaKey) {
            togglePanel('settings')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Loading Screen */}
      <LoadingScreen />

      {/* 3D Canvas */}
      <BrainCanvas />

      {/* UI Panels */}
      <NavigationPanel />
      <RegionInfoPanel />
      <SettingsPanel />

      {/* Header - Glass Morphism Style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass"
        style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 5,
          padding: '16px 32px',
          borderRadius: '16px',
          pointerEvents: 'none'
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            margin: 0,
            color: 'white',
            letterSpacing: '0.5px'
          }}
        >
          Interactive Brain Viewer
        </h1>
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '6px',
            fontWeight: 400
          }}
        >
          Use arrow keys or navigation panel to switch layers
        </div>
      </motion.div>

      {/* Back to Portfolio Link */}
      <motion.a
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05, x: -4 }}
        whileTap={{ scale: 0.95 }}
        href="../index.html"
        className="btn"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 10,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8l4-4"/>
        </svg>
        <span>Back to Portfolio</span>
      </motion.a>

      {/* Help Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        className="btn btn-icon"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 10,
          fontSize: '20px',
          fontWeight: 600
        }}
        onClick={() => alert(
          'Keyboard Shortcuts:\n\n' +
          '← → : Switch layers\n' +
          'N: Toggle navigation panel\n' +
          'I: Toggle info panel\n' +
          'S: Toggle settings panel\n' +
          'ESC: Clear selection\n\n' +
          'Mouse:\n' +
          'Click: Select region\n' +
          'Drag: Rotate view\n' +
          'Scroll: Zoom in/out'
        )}
      >
        ?
      </motion.button>
    </div>
  )
}

export default App
