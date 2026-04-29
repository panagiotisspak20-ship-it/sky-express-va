import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface InteractiveGlobeProps {
  className?: string
}

export const InteractiveGlobe = ({ className = '' }: InteractiveGlobeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let phi = 0

    if (!canvasRef.current) return

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 1,
      width: 400,
      height: 400,
      phi: 0,
      theta: 0,
      dark: 0,
      diffuse: 1,
      mapSamples: 8000,
      mapBrightness: 5,
      baseColor: [0.4, 0.6, 0.95],
      markerColor: [1, 0.8, 0.2],
      glowColor: [0.4, 0.6, 1],
      markers: [
        // Example locations (London, New York, Tokyo)
        { location: [51.5074, -0.1278], size: 0.05 },
        { location: [40.7128, -74.006], size: 0.05 },
        { location: [35.6762, 139.6503], size: 0.05 }
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi
        phi += 0.005
      }
    })

    return () => {
      globe.destroy()
    }
  }, [])

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="w-[600px] h-[600px]"
      >
        <canvas
          ref={canvasRef}
          style={{ width: 600, height: 600, maxWidth: '100%', aspectRatio: '1' }}
        />
      </motion.div>

      {/* Overlay Text/Gradient */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#f3f4f6] to-transparent pointer-events-none" />
    </div>
  )
}
