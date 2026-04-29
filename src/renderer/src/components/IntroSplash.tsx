import { useState, useEffect, useCallback } from 'react'
import introPromo from '../assets/intro_promo.webp'

interface IntroSplashProps {
  onComplete: () => void
}

/**
 * Full-screen intro splash that plays the animated promo WebP on every app launch.
 * Auto-dismisses after the "No Limits" section ends, or the user can click anywhere to skip.
 */
export const IntroSplash = ({ onComplete }: IntroSplashProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const INTRO_DURATION_MS = 5500 // Fade begins here, so visible until ~6.1s total
  const FADE_DURATION_MS = 600

  const handleDismiss = useCallback(() => {
    if (fadeOut) return
    setFadeOut(true)
    setTimeout(() => {
      onComplete()
    }, FADE_DURATION_MS)
  }, [fadeOut, onComplete])

  // Auto-dismiss after the intro duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, INTRO_DURATION_MS)
    return () => clearTimeout(timer)
  }, [handleDismiss])

  // Show the "click anywhere" hint after a short delay
  useEffect(() => {
    const hintTimer = setTimeout(() => {
      setShowHint(true)
    }, 2000)
    return () => clearTimeout(hintTimer)
  }, [])

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[9999] bg-black cursor-pointer select-none"
      style={{
        transition: `opacity ${FADE_DURATION_MS}ms ease-out`,
        opacity: fadeOut ? 0 : 1
      }}
    >
      {/* Animated promo WebP — covers the entire window */}
      <img
        src={introPromo}
        alt="Sky Express Virtual Airlines"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* "Press anywhere to skip" hint — fades in after 2s, pulses gently */}
      <div
        className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none"
        style={{
          transition: 'opacity 1s ease-in-out',
          opacity: showHint && !fadeOut ? 0.6 : 0
        }}
      >
        <span
          className="text-white/80 text-sm font-mono tracking-[0.3em] uppercase"
          style={{
            animation: showHint ? 'hintPulse 2.5s ease-in-out infinite' : 'none',
            textShadow: '0 0 10px rgba(0,0,0,0.8)'
          }}
        >
          press anywhere to skip
        </span>
      </div>

      <style>{`
        @keyframes hintPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
