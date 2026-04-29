import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

// Pre-generated random routes for the neon map to ensure pure rendering
const NEON_MAP_ROUTES = [...Array(15)].map(() => {
  const x1 = 10 + Math.random() * 80
  const y1 = 10 + Math.random() * 80
  const x2 = 10 + Math.random() * 80
  const y2 = 10 + Math.random() * 80
  const cx = (x1 + x2) / 2 + (Math.random() * 20 - 10)
  const cy = (y1 + y2) / 2 - 20
  const duration = 2 + Math.random() * 2
  return { x1, y1, x2, y2, cx, cy, duration }
})

export default function PromoAd() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timeline = async () => {
      await new Promise((r) => setTimeout(r, 1000))
      setStage(1) // Epic Hook

      await new Promise((r) => setTimeout(r, 4000))
      setStage(2) // 3D Dashboard Command Center

      await new Promise((r) => setTimeout(r, 5500))
      setStage(3) // Premium Fleet Showcase

      await new Promise((r) => setTimeout(r, 5500))
      setStage(4) // Neon World Map

      await new Promise((r) => setTimeout(r, 5500))
      setStage(5) // Epic Logo & Outro
    }
    timeline()
  }, [])

  const letterAnimation = {
    hidden: { opacity: 0, y: 50, filter: 'blur(10px)' },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { delay: i * 0.05, duration: 0.8 }
    })
  }

  return (
    <div className="fixed inset-0 bg-[#030303] overflow-hidden font-tahoma text-white z-50 selection:bg-transparent cursor-none">
      {/* Global Ambient Lighting */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 20% 30%, rgba(0,51,102,0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 70%, rgba(204,0,0,0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(0,51,102,0.15) 0%, transparent 60%)'
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <AnimatePresence mode="wait">
        {/* Stage 1: The Hook */}
        {stage === 1 && (
          <motion.div
            key="stage1"
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]" />

            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="flex space-x-2 overflow-hidden pb-4">
                {'YOUR JOURNEY'.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={letterAnimation}
                    initial="hidden"
                    animate="visible"
                    className="text-7xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 1.5, ease: 'circOut' }}
                className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#cc0000] to-transparent my-6 shadow-[0_0_15px_rgba(204,0,0,0.8)]"
              />
              <div className="flex space-x-2 overflow-hidden">
                {'ELEVATES HERE'.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    custom={i + 15}
                    variants={letterAnimation}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl font-bold tracking-[0.3em] text-[#00aaff] drop-shadow-[0_0_15px_rgba(0,170,255,0.6)]"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 2: Dashboard Command Center */}
        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -500, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center perspective-[2000px] z-20"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544641323-8b7762283a00?q=80&w=2000')] bg-cover bg-center opacity-20 blur-md pointer-events-none" />

            <motion.div
              initial={{ rotateX: 20, rotateY: -20, z: -500 }}
              animate={{ rotateX: 5, rotateY: 5, z: 0 }}
              transition={{ duration: 6, ease: 'easeOut' }}
              className="relative w-[800px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-10 overflow-hidden"
              style={{
                transformStyle: 'preserve-3d',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              {/* Glass Reflection */}
              <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] animate-[shimmer_8s_infinite]" />

              <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-xl text-white/50 tracking-widest uppercase mb-1">
                    Live Telemetry
                  </h3>
                  <h2 className="text-4xl font-bold text-white">COMMAND CENTER</h2>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  <span className="text-red-500 font-mono text-sm tracking-widest">RECORDING</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { label: 'ACTIVE FLIGHTS', val: '1,248' },
                  { label: 'HOURS FLOWN', val: '84,921' },
                  { label: 'TOP RATING', val: '99.8%' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.2, duration: 0.8, type: 'spring' }}
                    className="bg-gradient-to-b from-white/5 to-transparent p-6 rounded-xl border border-white/5 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00aaff] to-transparent opacity-50" />
                    <div className="text-[#00aaff] text-xs font-bold tracking-[0.2em] mb-3">
                      {stat.label}
                    </div>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1 + i * 0.2, type: 'spring' }}
                      className="text-4xl font-light tracking-tight text-white"
                    >
                      {stat.val}
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <div className="h-40 relative flex items-end gap-3 pb-4 border-b border-white/10">
                {[30, 45, 25, 60, 40, 75, 55, 90, 65, 100].map((h, i) => (
                  <motion.div
                    key={`bar-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${h}%`, opacity: 1 }}
                    transition={{
                      delay: 1.5 + i * 0.05,
                      duration: 1.5,
                      type: 'spring',
                      bounce: 0.4
                    }}
                    className="flex-1 bg-gradient-to-t from-[#003366] via-[#0055aa] to-[#00aaff] rounded-t-sm relative group"
                  >
                    <div className="absolute top-0 w-full h-1 bg-white/50 blur-[2px]" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 1.2, ease: 'easeOut' }}
              className="absolute bottom-16 w-full text-center"
            >
              <h2 className="text-6xl font-black italic tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_10px_20px_rgba(0,0,0,1)] uppercase">
                Analyze Every Detail
              </h2>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 3: The Fleet */}
        {stage === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 200 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full bg-[#050510] flex flex-col items-center justify-center overflow-hidden z-30"
          >
            <motion.div
              initial={{ scale: 1.5, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 7, ease: 'circOut' }}
              className="absolute inset-0 opacity-20"
            >
              {/* Abstract fluid background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#003366] to-[#cc0000] mix-blend-color blur-[100px]" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMGw4IDhaTTAgOGw4IC04WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPg==')"
                }}
              />
            </motion.div>

            <div className="relative z-10 w-full max-w-7xl px-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { id: 'A20N', name: 'Airbus A320neo', type: 'Narrowbody', range: '3,500nm' },
                  { id: 'A320', name: 'Airbus A320-200', type: 'Narrowbody', range: '3,300nm' },
                  { id: 'AT46', name: 'ATR 42-600', type: 'Turboprop', range: '720nm' },
                  { id: 'AT76', name: 'ATR 72-600', type: 'Turboprop', range: '825nm' }
                ].map((ac, i) => (
                  <motion.div
                    key={ac.id}
                    initial={{ opacity: 0, y: 100, rotateX: 45 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.15,
                      duration: 1.2,
                      type: 'spring',
                      bounce: 0.3
                    }}
                    className="relative bg-gradient-to-b from-white/10 to-transparent rounded-2xl p-1 border border-white/20 backdrop-blur-xl group hover:border-[#00aaff]/50 transition-colors"
                  >
                    <div className="bg-[#050505]/80 rounded-xl h-72 p-6 flex flex-col justify-end relative overflow-hidden">
                      {/* Premium SVG Icon Replacement */}
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1 + i * 0.2, duration: 1 }}
                        className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity"
                      >
                        <svg
                          width="120"
                          height="120"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-2.5-.5L1 17l4 2 2 4 .5-1.5-.5-2.5 4-4 4 6l1.2-.7c.4-.2.7-.6.6-1.1z" />
                        </svg>
                      </motion.div>

                      <div className="relative z-10 w-full">
                        <div className="w-12 h-1 bg-gradient-to-r from-[#cc0000] to-transparent mb-4 rounded-full" />
                        <h3 className="text-3xl font-black text-white mb-1 tracking-tight">
                          {ac.id}
                        </h3>
                        <p className="text-white/60 font-medium text-sm mb-4">{ac.name}</p>

                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/5">
                          <div className="text-xs uppercase tracking-widest text-[#00aaff]">
                            {ac.type}
                          </div>
                          <div className="text-xs font-mono text-white/80">{ac.range}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.h2
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.2, duration: 1.5, ease: 'easeOut' }}
              className="absolute top-24 text-center w-full"
            >
              <div className="text-7xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-200 drop-shadow-[0_5px_15px_rgba(255,255,255,0.2)] uppercase">
                A World-Class Fleet
              </div>
              <div className="text-[#00aaff] font-mono tracking-[0.5em] text-lg mt-4 uppercase">
                Engineered for Excellence
              </div>
            </motion.h2>
          </motion.div>
        )}

        {/* Stage 4: Neon Network & Routes */}
        {stage === 4 && (
          <motion.div
            key="stage4"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full bg-[#020205] flex flex-col items-center justify-center z-40 overflow-hidden"
          >
            {/* Glowing Map Grid */}
            <div
              className="absolute inset-0 opacity-50 shadow-[inset_0_0_200px_#020205] animate-[grid_20s_linear_infinite]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,170,255,0.05) 1px,transparent 1px), linear-gradient(90deg, rgba(0,170,255,0.05) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
                transform:
                  'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)'
              }}
            />

            {/* Neon Routes SVG */}
            <svg
              className="absolute inset-0 w-full h-full z-0 pointer-events-none drop-shadow-[0_0_8px_rgba(0,170,255,0.8)]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {NEON_MAP_ROUTES.map((route, i) => {
                const { x1, y1, x2, y2, cx, cy, duration } = route

                return (
                  <g key={i}>
                    {/* Base line */}
                    <motion.path
                      d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                      fill="none"
                      stroke="url(#neonGradient)"
                      strokeWidth="0.15"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration, ease: 'easeInOut' }}
                    />
                    {/* Highlighting nodes */}
                    <motion.circle
                      cx={x1}
                      cy={y1}
                      r="0.4"
                      fill="#fff"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 2 }}
                      className="drop-shadow-[0_0_5px_rgba(255,255,255,1)]"
                    />
                    <motion.circle
                      cx={x2}
                      cy={y2}
                      r="0.4"
                      fill="#fff"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 4 }}
                      className="drop-shadow-[0_0_5px_rgba(0,170,255,1)]"
                    />
                  </g>
                )
              })}
              <defs>
                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00aaff" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#00aaff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#cc0000" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>

            <div className="z-10 w-full max-w-5xl flex gap-6 px-12 perspective-[1000px]">
              {/* Left Column Flight Cards */}
              <div className="flex-1 space-y-4 pt-10">
                {[
                  { flt: 'SKY102', from: 'EGLL', to: 'KJFK', status: 'BOARDING' },
                  { flt: 'SKY405', from: 'OMDB', to: 'YSSY', status: 'SCHEDULED' }
                ].map((flt, i) => (
                  <motion.div
                    key={`l-${i}`}
                    initial={{ opacity: 0, x: -100, rotateY: -30 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 1 + i * 0.3, duration: 0.8, type: 'spring' }}
                    className="bg-black/60 backdrop-blur-md border-[0.5px] border-[#00aaff]/30 p-5 rounded-lg flex justify-between items-center shadow-[0_10px_30px_rgba(0,170,255,0.1)] hover:bg-[#00aaff]/10 transition-colors"
                  >
                    <div>
                      <div className="text-2xl font-black text-white">{flt.flt}</div>
                      <div className="text-[#00aaff] font-mono text-sm tracking-widest">
                        {flt.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold font-mono text-white/80">{flt.from}</div>
                      <div className="w-8 h-[2px] bg-gradient-to-r from-transparent via-[#cc0000] to-transparent"></div>
                      <div className="text-xl font-bold font-mono text-white/80">{flt.to}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Central Hero Text */}
              <div className="flex-1 flex flex-col justify-center items-center text-center -mt-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 1 }}
                >
                  <h2 className="text-7xl font-black italic tracking-widest text-white drop-shadow-[0_0_30px_rgba(0,170,255,0.5)]">
                    CONNECT
                  </h2>
                  <h2 className="text-7xl font-black italic tracking-widest text-[#00aaff] drop-shadow-[0_0_30px_rgba(0,170,255,0.5)]">
                    THE GLOBE
                  </h2>
                </motion.div>
              </div>

              {/* Right Column Flight Cards */}
              <div className="flex-1 space-y-4 pt-24 pb-10">
                {[
                  { flt: 'SKY822', from: 'RJTT', to: 'WSSS', status: 'EN ROUTE' },
                  { flt: 'SKY910', from: 'LFPG', to: 'FAOR', status: 'BOARDING' }
                ].map((flt, i) => (
                  <motion.div
                    key={`r-${i}`}
                    initial={{ opacity: 0, x: 100, rotateY: 30 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 1.5 + i * 0.3, duration: 0.8, type: 'spring' }}
                    className="bg-black/60 backdrop-blur-md border-[0.5px] border-[#cc0000]/30 p-5 rounded-lg flex justify-between items-center shadow-[0_10px_30px_rgba(204,0,0,0.1)] hover:bg-[#cc0000]/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold font-mono text-white/80">{flt.from}</div>
                      <div className="w-8 h-[2px] bg-gradient-to-r from-transparent via-[#00aaff] to-transparent"></div>
                      <div className="text-xl font-bold font-mono text-white/80">{flt.to}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{flt.flt}</div>
                      <div className="text-[#cc0000] font-mono text-sm tracking-widest">
                        {flt.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 5: Outro & Call to Action */}
        {stage === 5 && (
          <motion.div
            key="stage5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full bg-[#00050a] flex flex-col items-center justify-center z-50 overflow-hidden"
          >
            {/* Dramatic Lens Flare / Light Burst */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0.4] }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00aaff] to-[#cc0000] rounded-full blur-[120px] mix-blend-screen pointer-events-none"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 2, type: 'spring', bounce: 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <h1 className="text-8xl md:text-[9rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-[0_10px_20px_rgba(0,0,0,1)] flex items-center pr-6">
                SKY <span className="text-[#003366] ml-6">EX</span>
                <span className="text-[#cc0000]">PRESS</span>
              </h1>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 2, duration: 1.5, ease: 'easeInOut' }}
                className="h-[2px] bg-gradient-to-r from-transparent via-white to-transparent mt-8 max-w-3xl"
              />

              <motion.h2
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 2.5, duration: 1.5 }}
                className="mt-10 text-3xl font-light tracking-[0.5em] text-[#00aaff] uppercase"
              >
                Aviation <span className="text-white font-bold">Perfected</span>
              </motion.h2>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(204,0,0,0.6)' }}
                transition={{ delay: 4, duration: 1 }}
                className="mt-16 px-12 py-5 bg-gradient-to-r from-[#cc0000] to-[#990000] text-white font-black tracking-widest uppercase rounded-sm border border-red-400/30 shadow-[0_10px_20px_rgba(204,0,0,0.3)]"
              >
                Join The Elite
              </motion.button>
            </motion.div>

            {/* Cinematic cinematic border bars */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: '8vh' }}
              transition={{ duration: 1.5 }}
              className="absolute top-0 w-full bg-black z-20"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: '8vh' }}
              transition={{ duration: 1.5 }}
              className="absolute bottom-0 w-full bg-black z-20"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
