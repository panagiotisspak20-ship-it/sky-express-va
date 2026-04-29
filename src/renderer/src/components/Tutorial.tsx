import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, Plane, Lightbulb } from 'lucide-react'
import { DataService } from '../services/dataService'
import { useLocation } from 'react-router-dom'

interface TutorialStep {
  title: string
  content: string
  targetSelector: string
  targetPage: string
  position: 'top' | 'bottom' | 'left' | 'right'
  tip?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '🛫 Welcome Aboard, Captain!',
    content:
      'Hey there, First Officer here! 🧑‍✈️ This is your Dashboard — think of it as your cockpit command center. Let me show you around!',
    targetSelector: '.dashboard-stats',
    targetPage: '/',
    position: 'bottom',
    tip: 'Your career stats, balance, and recent flights are right here. No preflight checklist needed! ✅'
  },
  {
    title: '🔔 Incoming Transmission!',
    content:
      "This little bell is your radio 📻 — friend requests, DMs, and support tickets all come through here. Don't leave your crew hanging!",
    targetSelector: '[data-tutorial="notification-bell"]',
    targetPage: '/',
    position: 'bottom'
  },
  {
    title: '🎖️ Your Pilot Career',
    content:
      "Check out your rank, flight hours, and earnings here. Fly more routes and you'll climb the ranks faster than a 737 on takeoff roll! 🚀",
    targetSelector: '[data-tutorial="career-profile"]',
    targetPage: '/career',
    position: 'bottom'
  },
  {
    title: '🗺️ Free Roam Mode',
    content:
      'Feeling adventurous? Free Roam lets you create custom routes — no schedule, no rules. Just pick two airports and go explore! 🌍',
    targetSelector: '[data-tutorial="sidebar-link-free-roam"]',
    targetPage: '/career',
    position: 'right'
  },
  {
    title: '✈️ Plan Your Route',
    content:
      "Type in your Departure and Arrival ICAO codes right here. LGAV to EGLL? KJFK to KLAX? The sky's the limit! ✨",
    targetSelector: '[data-tutorial="freeroam-dep"]',
    targetPage: '/free-roam',
    position: 'bottom'
  },
  {
    title: '📋 Real Dispatch Magic',
    content:
      'Hit this button and BAM 💥 — a real SimBrief OFP appears like magic. Fuel, weather, route... everything a real dispatcher would give you!',
    targetSelector: '[data-tutorial="freeroam-generate"]',
    targetPage: '/free-roam',
    position: 'top'
  },
  {
    title: '🔍 Filter Your Flights',
    content:
      'Use these filters to find the perfect flight for your rank. AT76 island hopper? A320 mainland route? Your call, Captain! 🎯',
    targetSelector: '[data-tutorial="flight-filters"]',
    targetPage: '/flights',
    position: 'bottom',
    tip: 'Pro tip: Filter by date to snag future schedules before other pilots! 😉'
  },
  {
    title: '📖 Book a Flight',
    content:
      "Browse real-world Sky Express schedules and hit BOOK on any flight. It's like being a real airline pilot, minus the 4 AM wake-up calls! 😄",
    targetSelector: '.flight-table',
    targetPage: '/flights',
    position: 'top',
    tip: 'Booking opens SimBrief to create your flight plan automatically. Easy peasy! 🍋'
  },
  {
    title: '📋 My Booked Flights',
    content:
      "Your flight roster lives here! Hit START FLIGHT before you fly in MSFS — that's how we track your epic landings. 🛬",
    targetSelector: '[data-tutorial="booked-list"]',
    targetPage: '/booked-flights',
    position: 'right',
    tip: 'The app connects to MSFS automatically. Just start your sim and we handle the rest! 🤝'
  },
  {
    title: '🔀 ATC Diversion',
    content:
      'Got vectored to a different airport? No sweat! Toggle this on to avoid penalties. Even real pilots get diverted sometimes! 🌧️',
    targetSelector: '[data-tutorial="atc-diversion-toggle"]',
    targetPage: '/booked-flights',
    position: 'left',
    tip: 'This toggle only shows up during active flights — no cheating! 😏'
  },
  {
    title: '📊 Flight Details Panel',
    content:
      "This panel starts as your dispatch briefing, then transforms into a LIVE tracking dashboard when you're flying. It's basically your FMC! 🖥️",
    targetSelector: '[data-tutorial="flight-details"]',
    targetPage: '/booked-flights',
    position: 'left'
  },
  {
    title: '📑 Flight Dispatch',
    content:
      'Your SimBrief OFP lives here — weather, fuel, route, alternates... everything you need for a professional departure! 🌤️',
    targetSelector: '[data-tutorial="dispatch-info"]',
    targetPage: '/dispatch',
    position: 'bottom',
    tip: "Set your SimBrief ID in Settings and we'll fetch your OFP like a co-pilot handing you the paperwork! 📄"
  },
  {
    title: '🔌 Simulator Connection',
    content:
      'See that status bar? It tells you if MSFS is connected. Green = go! We track altitude, speed, and your butter landings automatically! 🧈',
    targetSelector: '.status-bar',
    targetPage: '/dispatch',
    position: 'top',
    tip: 'Land smoothly, park at the gate, and shut down engines to complete your flight. Just like the real thing! 🎯'
  },
  {
    title: '🗺️ Live Network Map',
    content:
      'See yourself flying in real-time alongside other Sky Express pilots! Our entire route network lights up like a Christmas tree 🎄',
    targetSelector: '[data-tutorial="live-map"]',
    targetPage: '/map',
    position: 'left'
  },
  {
    title: '🏆 Tours & Challenges',
    content:
      'Ready for adventure? Tours are curated multi-leg challenges across amazing destinations. Complete them to earn badges and bragging rights! 🎖️',
    targetSelector: '[data-tutorial="tours-header"]',
    targetPage: '/tours',
    position: 'bottom',
    tip: 'Each tour tracks your progress so you can pick up where you left off. No rush, Captain! ⏳'
  },
  {
    title: '✈️ Fleet Management',
    content:
      'Meet your fleet! Every aircraft in the Sky Express hangar is here — registrations, types, locations, and condition. Treat them well! 🔧',
    targetSelector: '[data-tutorial="fleet-header"]',
    targetPage: '/fleet',
    position: 'bottom',
    tip: 'Switch between List and Map view to see where our birds are parked around the world! 🌐'
  },
  {
    title: '🛍️ Sky Store',
    content:
      'Time to accessorize! Buy custom backgrounds, avatar frames, and name colors with your hard-earned flight pay. Looking good, Captain! 💎',
    targetSelector: '[data-tutorial="shop-header"]',
    targetPage: '/shop',
    position: 'bottom',
    tip: 'Use the Workshop tab to preview items on your profile before buying. Try before you fly! 👀'
  },
  {
    title: '📜 Flight History',
    content:
      "Every flight you've ever completed is logged here with scores, earnings, and stats. Your personal flight logbook! 📚",
    targetSelector: '[data-tutorial="history-list"]',
    targetPage: '/flight-history',
    position: 'right'
  },
  {
    title: '📝 PIREP Manifests',
    content:
      'Detailed post-flight reports live here — landing rates, event logs, and performance scores. Were you butter or bounce? 🧈⚡',
    targetSelector: '[data-tutorial="pirep-list"]',
    targetPage: '/pireps',
    position: 'left'
  },
  {
    title: '🆘 Support Center',
    content:
      "Need help? Create support tickets, chat with our crew, or browse FAQs. We've got your six, pilot! 💪",
    targetSelector: '[data-tutorial="support-ticket"]',
    targetPage: '/support',
    position: 'left'
  },
  {
    title: '👥 Community & Social',
    content:
      "This is where the party's at! 🎉 Find wingmen, see who's online, and connect with fellow pilots from around the world!",
    targetSelector: '[data-tutorial="sidebar-link-community"]',
    targetPage: '/social',
    position: 'right'
  },
  {
    title: '💬 Direct Messaging',
    content:
      "Slide into a pilot's DMs! Send messages, share flight stories, or coordinate group flights. Social butterflies welcome! 🦋",
    targetSelector: '[data-tutorial="chat-button"]',
    targetPage: '/social',
    position: 'left'
  },
  {
    title: '👨‍✈️ Pilot Directory',
    content:
      'Browse the entire pilot roster — ranks, flight hours, home bases. Find your next co-pilot or aviation bestie! 🤝',
    targetSelector: '[data-tutorial="pilot-directory"]',
    targetPage: '/social',
    position: 'right'
  },
  {
    title: '🔗 Connections',
    content:
      'Hit CONNECT on any pilot to follow them! Use this filter to see your crew. Build your network, Captain! 🌐',
    targetSelector: '[data-tutorial="connections-filter"]',
    targetPage: '/social',
    position: 'bottom'
  },
  {
    title: '⚙️ Settings & SimBrief',
    content:
      'Last stop! Pop your SimBrief ID in here to auto-fetch flight plans. And psst... you can replay this tutorial anytime from here! 🔄',
    targetSelector: '[data-tutorial="simbrief-input"]',
    targetPage: '/settings',
    position: 'bottom',
    tip: 'Find your SimBrief ID at simbrief.com → Account Settings. Takes 10 seconds! ⏱️'
  }
]

// ─── Confetti Effect ──────────────────────────────────────────────────
const ConfettiEffect = (): React.ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      rotSpeed: number
    }[] = []

    const colors = [
      '#FFD700',
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#FF8C00'
    ]

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      })
    }

    let animFrame: number
    const animate = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let allDone = true
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.rotation += p.rotSpeed

        if (p.y < canvas.height + 20) allDone = false

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      if (!allDone) {
        animFrame = requestAnimationFrame(animate)
      }
    }

    animate()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-[300] pointer-events-none" />
}

// ─── CSS Keyframes (injected once) ────────────────────────────────────
const injectStyles = (): void => {
  if (document.getElementById('tutorial-styles')) return
  const style = document.createElement('style')
  style.id = 'tutorial-styles'
  style.textContent = `
    @keyframes tutorialSlideIn {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes tutorialGlow {
      0%, 100% { box-shadow: 0 0 15px rgba(0, 176, 240, 0.4), 0 0 30px rgba(0, 176, 240, 0.15); }
      50%      { box-shadow: 0 0 25px rgba(0, 176, 240, 0.6), 0 0 50px rgba(0, 176, 240, 0.25); }
    }
    @keyframes tutorialDotOrbit {
      0%   { offset-distance: 0%; }
      100% { offset-distance: 100%; }
    }
    @keyframes tutorialTypewriter {
      from { max-height: 0; opacity: 0; }
      to   { max-height: 200px; opacity: 1; }
    }
    .tutorial-tooltip-enter {
      animation: tutorialSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
    }
    .tutorial-glow {
      animation: tutorialGlow 2s ease-in-out infinite;
    }
    .tutorial-content-enter {
      animation: tutorialTypewriter 0.4s ease forwards;
      overflow: hidden;
    }
  `
  document.head.appendChild(style)
}

// ─── Main Component ──────────────────────────────────────────────────
interface TutorialGuideProps {
  onNavigate: (path: string) => void
}

export const TutorialGuide = ({ onNavigate }: TutorialGuideProps): React.ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [measuredHeight, setMeasuredHeight] = useState(280)
  const [, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Inject styles on mount
  useEffect(() => {
    injectStyles()
  }, [])

  // Measure tooltip height after content changes
  useEffect(() => {
    if (tooltipRef.current) {
      setMeasuredHeight(tooltipRef.current.offsetHeight)
    }
  }, [contentKey, currentStep])

  // Re-render on window resize so tooltip repositions
  useEffect(() => {
    const onResize = (): void => setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const checkTutorial = async (): Promise<void> => {
      if (location.pathname !== '/') return
      const isAuth = await DataService.isAuthenticated()
      if (!isAuth) return
      if (location.pathname !== '/') return
      const profile = await DataService.getProfile()
      if (!profile?.tutorialComplete) {
        setCurrentStep(0)
        setIsOpen(true)
      }
    }

    // Only check once on mount / location change
    checkTutorial()
  }, [location.pathname])

  const searchIdRef = useRef<number>(0)

  const findAndHighlightTarget = useCallback(() => {
    const step = tutorialSteps[currentStep]
    if (!step) return

    setTargetRect(null)
    const searchId = ++searchIdRef.current
    let hasScrolled = false

    const trackTarget = () => {
      // Abort if a new step started
      if (searchId !== searchIdRef.current) return

      const target = document.querySelector(step.targetSelector)
      if (target) {
        if (!hasScrolled) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          hasScrolled = true
        }

        const rect = target.getBoundingClientRect()
        
        // Only trigger React state update if the rect actually moved by at least 1px
        // This prevents CPU melting while tracking 60fps during smooth scroll
        setTargetRect((prev) => {
          if (!prev) return rect
          if (
            Math.abs(prev.top - rect.top) > 1 ||
            Math.abs(prev.left - rect.left) > 1 ||
            Math.abs(prev.width - rect.width) > 1 ||
            Math.abs(prev.height - rect.height) > 1
          ) {
            return rect
          }
          return prev
        })

        requestAnimationFrame(trackTarget)
      } else {
        setTargetRect(null)
        hasScrolled = false
        // Poll every 300ms until it appears (handles slow network requests like Step 24)
        setTimeout(trackTarget, 300)
      }
    }

    trackTarget()
  }, [currentStep])

  useEffect(() => {
    if (isOpen) {
      findAndHighlightTarget()
    }
  }, [isOpen, currentStep, location.pathname, findAndHighlightTarget])

  const handleNext = (): void => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = tutorialSteps[currentStep + 1]
      if (nextStep.targetPage !== location.pathname) {
        onNavigate(nextStep.targetPage)
      }
      setCurrentStep(currentStep + 1)
      setContentKey((k) => k + 1)
    }
  }

  const handleBack = (): void => {
    if (currentStep > 0) {
      const prevStep = tutorialSteps[currentStep - 1]
      if (prevStep.targetPage !== location.pathname) {
        onNavigate(prevStep.targetPage)
      }
      setCurrentStep(currentStep - 1)
      setContentKey((k) => k + 1)
    }
  }

  const handleClose = async (): Promise<void> => {
    await DataService.updateProfile({ tutorialComplete: true })
    setIsOpen(false)
    setShowConfetti(false)
    setCurrentStep(0)
  }

  const handleFinish = async (): Promise<void> => {
    setShowConfetti(true)
    // Let confetti play for 3 seconds, then close
    setTimeout(() => {
      handleClose()
    }, 3000)
  }

  if (!isOpen) return null

  const step = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1
  const isFirstStep = currentStep === 0
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100

  // ─── Tooltip Position ───────────────────────────────────────────────
  const getTooltipStyle = (): React.CSSProperties => {
    const gap = 16
    const tooltipWidth = 360
    const vw = window.innerWidth
    const vh = window.innerHeight
    const effectiveWidth = Math.min(tooltipWidth, vw - 16)

    // Fallback: If target is massive (e.g. whole page) or height is unknown, center it!
    const isMassive = targetRect && (targetRect.height > vh - 250 || targetRect.width > vw - 100)
    
    if (!targetRect || isMassive || measuredHeight === 0) {
      const h = Math.max(measuredHeight, 150)
      return {
        position: 'fixed',
        top: Math.max(8, Math.round((vh - h) / 2)),
        left: (vw - effectiveWidth) / 2,
        width: effectiveWidth,
        maxHeight: vh - 16
      }
    }

    let top: number | string = 'auto'
    let bottom: number | string = 'auto'
    let left: number | string = 'auto'
    let right: number | string = 'auto'

    const prefPos = step.position || 'bottom'

    if (prefPos === 'left' || prefPos === 'right') {
      // Vertically center relative to target
      let t = targetRect.top + targetRect.height / 2 - measuredHeight / 2
      top = Math.max(8, Math.min(t, vh - measuredHeight - 8))

      if (prefPos === 'left') {
        // Place on the left
        if (targetRect.left - effectiveWidth - gap >= 8) {
          right = vw - targetRect.left + gap
        } else {
          // Fallback to right if not enough space
          left = targetRect.right + gap
        }
      } else {
        // Place on the right
        if (targetRect.right + effectiveWidth + gap <= vw - 8) {
          left = targetRect.right + gap
        } else {
          // Fallback to left if not enough space
          right = vw - targetRect.left + gap
        }
      }
    } else {
      // Horizontally center relative to target
      let l = targetRect.left + targetRect.width / 2 - effectiveWidth / 2
      left = Math.max(8, Math.min(l, vw - effectiveWidth - 8))

      if (prefPos === 'top') {
        // Place above
        if (targetRect.top - measuredHeight - gap >= 8) {
          bottom = vh - targetRect.top + gap
        } else {
          // Fallback to bottom if not enough space
          top = targetRect.bottom + gap
        }
      } else {
        // Place below
        if (targetRect.bottom + measuredHeight + gap <= vh - 8) {
          top = targetRect.bottom + gap
        } else {
          // Fallback to top if not enough space
          bottom = vh - targetRect.top + gap
        }
      }
    }

    return {
      position: 'fixed',
      top: typeof top === 'number' ? Math.max(8, Math.min(top, vh - measuredHeight - 8)) : top,
      bottom: typeof bottom === 'number' ? Math.max(8, Math.min(bottom, vh - measuredHeight - 8)) : bottom,
      left: typeof left === 'number' ? Math.max(8, Math.min(left, vw - effectiveWidth - 8)) : left,
      right: typeof right === 'number' ? Math.max(8, Math.min(right, vw - effectiveWidth - 8)) : right,
      width: effectiveWidth,
      maxHeight: vh - 16
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <>
      {showConfetti && <ConfettiEffect />}

      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[200] pointer-events-none">
        <svg className="w-full h-full pointer-events-none">
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 10}
                  y={targetRect.top - 10}
                  width={targetRect.width + 20}
                  height={targetRect.height + 20}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.72)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {targetRect && (
          <>
            {/* Orbiting dots around the highlight */}
            <svg
              className="absolute pointer-events-none"
              style={{
                left: targetRect.left - 14,
                top: targetRect.top - 14,
                width: targetRect.width + 28,
                height: targetRect.height + 28
              }}
            >
              <defs>
                <path
                  id="tutorial-orbit-path"
                  d={`M 14 4 L ${targetRect.width + 14} 4 Q ${targetRect.width + 24} 4 ${targetRect.width + 24} 14 L ${targetRect.width + 24} ${targetRect.height + 14} Q ${targetRect.width + 24} ${targetRect.height + 24} ${targetRect.width + 14} ${targetRect.height + 24} L 14 ${targetRect.height + 24} Q 4 ${targetRect.height + 24} 4 ${targetRect.height + 14} L 4 14 Q 4 4 14 4 Z`}
                  fill="none"
                />
              </defs>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} r="3" fill="rgba(0,176,240,0.85)">
                  <animateMotion dur="4s" repeatCount="indefinite" begin={`${(i * 4) / 6}s`}>
                    <mpath href="#tutorial-orbit-path" />
                  </animateMotion>
                </circle>
              ))}
            </svg>
            {/* Inner glow border */}
            <div
              className="absolute rounded-xl tutorial-glow pointer-events-none"
              style={{
                left: targetRect.left - 10,
                top: targetRect.top - 10,
                width: targetRect.width + 20,
                height: targetRect.height + 20,
                border: '2px solid rgba(0,176,240,0.6)'
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        key={contentKey}
        className="z-[201] pointer-events-auto tutorial-tooltip-enter"
        style={getTooltipStyle()}
      >
        {/* Gradient border wrapper */}
        <div className="rounded-3xl p-[1px] bg-gradient-to-br from-sky-cyan/40 via-white/20 to-sky-magenta/40 shadow-2xl shadow-sky-navy/10 relative">
          <div
            className="bg-white/95 backdrop-blur-xl rounded-[23px] overflow-hidden flex flex-col relative z-10"
            style={{ maxHeight: 'inherit', overflowY: 'auto' }}
          >
            {/* Header with copilot persona */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shadow-inner">
                  🧑‍✈️
                </div>
                <div>
                  <span className="font-black text-[13px] tracking-widest text-sky-navy uppercase block leading-tight">
                    {step.title}
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.2em] text-sky-magenta uppercase">Your Copilot</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="hover:bg-rose-50 hover:text-rose-500 p-2 rounded-xl transition-colors text-slate-400"
                title="Close tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Airplane Progress Bar */}
            <div className="relative h-6 bg-slate-50/50 border-b border-slate-100 overflow-hidden shrink-0">
              {/* Track line */}
              <div
                className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-sky-cyan to-sky-magenta transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, transform: 'translateY(-50%)' }}
              />
              {/* Airplane icon */}
              <div
                className="absolute top-1/2 transition-all duration-500 ease-out z-10"
                style={{
                  left: `calc(${progress}% - 10px)`,
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="w-5 h-5 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-sky-cyan">
                  <Plane className="w-3 h-3" />
                </div>
              </div>
              {/* Step counter */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black tracking-widest text-slate-400">
                {currentStep + 1}/{tutorialSteps.length}
              </span>
            </div>

            {/* Content */}
            <div className="p-5 tutorial-content-enter bg-white/30">
              <p className="text-slate-600 text-[13px] font-medium leading-relaxed mb-4">{step.content}</p>

              {step.tip && (
                <div className="bg-sky-cyan/5 border border-sky-cyan/20 rounded-2xl p-4 mb-2 flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-sky-cyan shrink-0 mt-0.5" />
                  <span className="text-xs text-sky-navy font-medium leading-relaxed">
                    <strong className="font-black uppercase tracking-widest text-[10px] text-sky-cyan block mb-0.5">Pro Tip</strong> 
                    {step.tip}
                  </span>
                </div>
              )}
            </div>

            {/* Footer with navigation */}
            <div className="px-5 pb-5 pt-2 flex items-center justify-between shrink-0 bg-white/50">
              <button
                onClick={handleBack}
                disabled={isFirstStep}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${
                  isFirstStep
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-400 hover:text-sky-navy hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {/* Skip tutorial link */}
              <button
                onClick={handleClose}
                className="text-[9px] font-bold tracking-widest uppercase text-slate-300 hover:text-rose-500 transition-colors"
              >
                Skip
              </button>

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-6 py-2.5 text-[10px] rounded-xl font-black tracking-widest uppercase transition-all bg-sky-magenta text-white hover:bg-[#c2005a] shadow-lg shadow-sky-magenta/30"
                >
                  Finish! 🎉
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 text-[10px] rounded-xl font-black tracking-widest uppercase transition-all bg-sky-navy text-white hover:bg-sky-cyan shadow-lg shadow-sky-navy/20"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
