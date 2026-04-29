import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function PromoAdFast() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timeline = async () => {
      // Hyper fast pacing
      await new Promise((r) => setTimeout(r, 500))
      setStage(1) // Glitch Intro

      await new Promise((r) => setTimeout(r, 2000))
      setStage(2) // Rapid Words

      await new Promise((r) => setTimeout(r, 2500))
      setStage(3) // High Speed Flight

      await new Promise((r) => setTimeout(r, 3000))
      setStage(4) // Action Shots

      await new Promise((r) => setTimeout(r, 3500))
      setStage(5) // Boom Outro
    }
    timeline()
  }, [])

  return (
    <div className="fixed inset-0 bg-[#020202] overflow-hidden font-sans text-white z-50 selection:bg-transparent cursor-none">
      {/* Kinetic Noise Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] animate-[pulse_0.1s_linear_infinite]" />

      <AnimatePresence mode="wait">
        {/* Stage 1: Glitch Intro */}
        {stage === 1 && (
          <motion.div
            key="stage1"
            exit={{ opacity: 0, scale: 3, filter: 'blur(20px)' }}
            transition={{ duration: 0.3, ease: 'easeIn' }}
            className="absolute inset-0 flex items-center justify-center bg-black"
          >
            <motion.h1
              initial={{ scale: 0.8, opacity: 0, skewX: -20 }}
              animate={{ scale: [1.2, 0.9, 1.1, 1], opacity: 1, skewX: [20, -10, 5, 0] }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.6 }}
              className="text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#D40058] to-[#102A47] uppercase tracking-tighter mix-blend-screen drop-shadow-[0_0_30px_rgba(212,0,88,0.8)]"
            >
              WARNING
            </motion.h1>
          </motion.div>
        )}

        {/* Stage 2: Rapid Words */}
        {stage === 2 && (
          <motion.div
            key="stage2"
            className="absolute inset-0 flex items-center justify-center bg-[#050505]"
          >
            {['FLY', 'FASTER', 'FLY', 'BETTER', 'SKY', 'EXPRESS'].map((word, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.1 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1.5, 3] }}
                transition={{
                  delay: i * 0.4,
                  duration: 0.4,
                  times: [0, 0.2, 0.8, 1],
                  ease: 'easeInOut'
                }}
                className="absolute text-[12rem] font-black italic tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(212,0,88,0.8)]"
              >
                {word}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Stage 3: High Speed Flight */}
        {stage === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ x: '-100%', opacity: 0, filter: 'blur(30px)' }}
            transition={{ duration: 0.4, ease: 'circIn' }}
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#102A47] to-[#000]" />

            {/* Speed lines */}
            <div className="absolute inset-0 flex justify-center items-center opacity-40">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: '100vw', opacity: 0 }}
                  animate={{ x: '-100vw', opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.2 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: Math.random() * 1,
                    ease: 'linear'
                  }}
                  className="absolute h-[2px] bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    width: `${50 + Math.random() * 200}px`,
                    boxShadow: '0 0 10px #fff'
                  }}
                />
              ))}
            </div>

            <motion.h2
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.7, duration: 0.8 }}
              className="text-8xl font-black italic text-white tracking-widest drop-shadow-[0_0_40px_rgba(212,0,88,1)] z-10 uppercase"
            >
              No Limits
            </motion.h2>
          </motion.div>
        )}

        {/* Stage 4: Action Shots */}
        {stage === 4 && (
          <motion.div
            key="stage4"
            className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-black"
          >
            {[
              { title: 'ADVANCED TECH', delay: 0 },
              { title: 'GLOBAL ROUTES', delay: 0.4 },
              { title: 'ELITE FLEET', delay: 0.8 },
              { title: 'PRO COMMUNITY', delay: 1.2 }
            ].map((panel, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, borderRadius: '100%' }}
                animate={{ scale: 1, opacity: 1, borderRadius: '1rem' }}
                transition={{ delay: panel.delay, duration: 0.4, type: 'spring' }}
                className="bg-gradient-to-br from-[#111] to-[#222] border-[2px] border-[#D40058] relative overflow-hidden flex items-center justify-center group"
                style={{ boxShadow: 'inset 0 0 50px rgba(212,0,88,0.2)' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544641323-8b7762283a00?q=80&w=600')] bg-cover bg-center opacity-20 mix-blend-screen filter grayscale contrast-150"
                />
                <h3 className="relative z-10 text-5xl font-black italic text-white tracking-widest uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
                  {panel.title}
                </h3>
                {/* Scanning line */}
                <motion.div
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-full h-2 bg-[#D40058] opacity-50 blur-[4px]"
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Stage 5: Boom Outro */}
        {stage === 5 && (
          <motion.div
            key="stage5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.5 }}
            className="absolute inset-0 bg-white flex items-center justify-center overflow-hidden"
          >
            {/* Rapid flash sequence */}
            <motion.div
              animate={{ opacity: [1, 0, 1, 0, 1] }}
              transition={{ duration: 0.4, ease: 'linear' }}
              className="absolute inset-0 bg-[#0A192F] mix-blend-overlay"
            />

            <div className="relative z-10 text-center flex flex-col items-center">
              <motion.h1
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="text-[10rem] font-black italic tracking-tighter uppercase leading-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]"
              >
                <span className="text-[#102A47]">SKY</span>{' '}
                <span className="text-[#D40058]">EXPRESS</span>
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5, ease: 'circOut' }}
                className="h-4 w-[110%] bg-[#102A47] my-4 transform -skew-x-12"
              />

              <motion.h2
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: 'spring', bounce: 0.6 }}
                className="text-6xl font-extrabold tracking-[0.5em] text-[#102A47] uppercase bg-white px-8 py-2 transform -skew-x-12 mt-4"
                style={{ boxShadow: '20px 20px 0 #D40058' }}
              >
                DOMINATE
              </motion.h2>

              <motion.button
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, type: 'spring' }}
                className="mt-20 px-16 py-6 bg-[#102A47] text-white text-3xl font-black italic tracking-widest uppercase transform hover:scale-110 hover:bg-[#D40058] transition-all hover:-skew-x-12"
                style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
              >
                START NOW
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
