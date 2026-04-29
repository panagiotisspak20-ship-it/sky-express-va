import { motion } from 'framer-motion'
import { Plane, Cloud } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SkyLoaderProps {
  text?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const SkyLoader = ({ text, size = 'medium', className = '' }: SkyLoaderProps) => {
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    // If text prop changes, reset
    setDisplayText(text)

    // Set a timeout to show a connection warning if loading takes more than 15s
    const timeout = setTimeout(() => {
      setDisplayText('Connection is slow or offline. Please check your internet.')
    }, 15000)

    return () => clearTimeout(timeout)
  }, [text])

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-12 h-12',
    large: 'w-24 h-24'
  }

  const iconSizes = {
    small: 10,
    medium: 24,
    large: 48
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Central Planet/Cloud */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-blue-200"
        >
          <Cloud size={iconSizes[size] * 0.8} fill="currentColor" className="opacity-50" />
        </motion.div>

        {/* Orbiting Plane */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Plane
              size={iconSizes[size] * 0.6}
              className="text-blue-600 fill-blue-600 transform -rotate-45"
            />
          </div>
        </motion.div>

        {/* Orbit Ring */}
        <div className="absolute inset-0 border-2 border-blue-100 rounded-full opacity-30 box-border" />
      </div>

      {displayText && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`font-bold text-xs tracking-wider uppercase max-w-xs text-center ${displayText.includes('slow or offline') ? 'text-red-500' : 'text-blue-900'}`}
        >
          {displayText}
        </motion.p>
      )}
    </div>
  )
}
