import { useEffect } from 'react'
import { motion } from 'framer-motion'
import BrainCanvas from './components/canvas/BrainCanvas'
import LoadingScreen from './components/shared/LoadingScreen'
import NavigationPanel from './components/ui/NavigationPanel'
import SettingsPanel from './components/ui/SettingsPanel'
import RegionInfoCard from './components/ui/RegionInfoCard'
import useFreeSurferData from './hooks/useFreeSurferData'
import useBrainStore from './store/brainStore'

/**
 * Main App Component
 * Interactive 3D Brain Visualization Application
 */
function App() {
  // Enable FreeSurfer data loading for Interactive Region Explorer
  const { dataReady, error } = useFreeSurferData(true)

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
      <SettingsPanel />
      <RegionInfoCard />

      {/* Back to Portfolio Link */}
      <motion.a
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05, x: -4 }}
        whileTap={{ scale: 0.95 }}
        href="../index.html"
        className="back-link"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 10,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontFamily: "'Courier Prime', monospace",
          fontSize: '14px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        &larr; Back
      </motion.a>
    </div>
  )
}

export default App
