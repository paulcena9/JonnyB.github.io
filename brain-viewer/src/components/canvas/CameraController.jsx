import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import useBrainStore from '../../store/brainStore'

/**
 * Camera Controller Component
 * Handles programmatic camera animations when regions are selected
 */
function CameraController() {
  const { camera, controls } = useThree()
  const { cameraTarget, setIsAnimating } = useBrainStore()

  const animationRef = useRef(null)

  useEffect(() => {
    if (!cameraTarget || !controls) return

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill()
    }

    setIsAnimating(true)

    const { position, lookAt, duration = 1.5 } = cameraTarget

    // Animate camera position
    const cameraAnimation = gsap.to(camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration,
      ease: 'power2.inOut'
    })

    // Animate controls target (lookAt point)
    const targetAnimation = gsap.to(controls.target, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        controls.update()
      },
      onComplete: () => {
        setIsAnimating(false)
      }
    })

    animationRef.current = cameraAnimation

    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [cameraTarget, camera, controls, setIsAnimating])

  return null
}

export default CameraController
