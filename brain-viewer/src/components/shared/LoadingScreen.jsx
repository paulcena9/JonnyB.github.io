import { useEffect, useState } from 'react'
import useBrainStore from '../../store/brainStore'

/**
 * Loading Screen Component
 * Displays while the brain model and data are loading
 */
function LoadingScreen() {
  const { isLoading, loadingProgress, error } = useBrainStore()
  const [show, setShow] = useState(true)

  const anyLoading = Object.values(isLoading).some(loading => loading)

  useEffect(() => {
    if (!anyLoading && !error) {
      // Fade out after a brief delay
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    } else {
      setShow(true)
    }
  }, [anyLoading, error])

  if (!show && !anyLoading) {
    return null
  }

  return (
    <div className="loading-screen">
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div className="loading-text" style={{ color: '#d32f2f' }}>
            Error: {error}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      ) : (
        <>
          <div className="loading-spinner"></div>
          <div className="loading-text">
            Loading Brain Viewer...
            {loadingProgress > 0 && ` ${Math.round(loadingProgress)}%`}
          </div>
          <div className="loading-text" style={{ fontSize: '12px', marginTop: '10px', opacity: 0.6 }}>
            {isLoading.model && 'Loading 3D model...'}
            {isLoading.parcellation && 'Loading parcellation data...'}
            {isLoading.morphometry && 'Loading morphometry data...'}
            {isLoading.statistics && 'Loading statistics...'}
          </div>
        </>
      )}
    </div>
  )
}

export default LoadingScreen
