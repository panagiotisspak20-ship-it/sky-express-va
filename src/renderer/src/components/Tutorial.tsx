import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DataService } from '../services/dataService'
import { useLocation } from 'react-router-dom'

interface TutorialStep {
  title: string
  content: string
  targetSelector: string // CSS selector for the element to highlight
  targetPage: string // Route to navigate to
  position: 'top' | 'bottom' | 'left' | 'right' // Tooltip position
  tip?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Sky Express VA!',
    content:
      "This is your Dashboard - your home base for all virtual airline operations. Let's take a quick tour!",
    targetSelector: '.dashboard-stats',
    targetPage: '/',
    position: 'bottom',
    tip: 'Your career stats, balance, and recent activity are displayed here.'
  },
  {
    title: 'Notification Center',
    content: 'Stay updated with friend requests, direct messages, and support tickets here.',
    targetSelector: '[data-tutorial="notification-bell"]',
    targetPage: '/',
    position: 'bottom'
  },
  {
    title: 'Pilot Career',
    content:
      "Track your rank, flight hours, and earnings here. As you fly more, you'll unlock higher ranks and aircraft.",
    targetSelector: '[data-tutorial="career-profile"]',
    targetPage: '/career',
    position: 'bottom'
  },
  {
    title: 'Free Roam Mode',
    content: 'Fly anywhere! Create custom routes here without scheduling restrictions.',
    targetSelector: '[data-tutorial="sidebar-link-free-roam"]',
    targetPage: '/career',
    position: 'right'
  },
  {
    title: 'Plan Your Route',
    content: 'Enter your Departure and Arrival ICAO codes to start a free flight.',
    targetSelector: '[data-tutorial="freeroam-dep"]',
    targetPage: '/free-roam',
    position: 'bottom'
  },
  {
    title: 'Real Dispatch',
    content: 'Generate a real SimBrief OFP for your custom flight instantly.',
    targetSelector: '[data-tutorial="freeroam-generate"]',
    targetPage: '/free-roam',
    position: 'top'
  },
  {
    title: 'Filter Schedules',
    content:
      'Use the aircraft filters to quickly find the perfect flight for your current rank or preference.',
    targetSelector: '[data-tutorial="flight-filters"]',
    targetPage: '/flights',
    position: 'bottom',
    tip: 'You can also filter by date to see future schedules.'
  },
  {
    title: 'Book a Flight',
    content:
      'Browse the real-world schedule and click BOOK on any flight to add it to your roster.',
    targetSelector: '.flight-table',
    targetPage: '/flights',
    position: 'top',
    tip: 'Booking a flight will open SimBrief to create your flight plan.'
  },
  {
    title: 'My Booked Flights',
    content:
      'Your booked flights appear here. Click START FLIGHT before flying in MSFS to begin tracking.',
    targetSelector: '[data-tutorial="booked-list"]',
    targetPage: '/booked-flights',
    position: 'right',
    tip: 'The app connects to MSFS automatically when you start a flight.'
  },
  {
    title: 'ATC Diversion',
    content:
      'Directed to divert? Toggle this to avoid penalties when landing at a non-scheduled airport.',
    targetSelector: '[data-tutorial="atc-diversion-toggle"]',
    targetPage: '/booked-flights',
    position: 'left',
    tip: 'Visible only when a flight is in progress.'
  },
  {
    title: 'Flight Details',
    content:
      'This panel shows your automated dispatch data. When flying, it transforms into a LIVE tracking dashboard!',
    targetSelector: '[data-tutorial="flight-details"]',
    targetPage: '/booked-flights',
    position: 'left'
  },
  {
    title: 'Flight Dispatch',
    content:
      'View your SimBrief flight plan details here including weather, fuel, and route information.',
    targetSelector: '[data-tutorial="dispatch-info"]',
    targetPage: '/dispatch',
    position: 'bottom',
    tip: 'Enter your SimBrief ID in Settings to fetch your OFP automatically.'
  },
  {
    title: 'Simulator Connection',
    content:
      'Check the status bar at the bottom - it shows if MSFS is connected. The app tracks your flight automatically!',
    targetSelector: '.status-bar',
    targetPage: '/dispatch',
    position: 'top',
    tip: 'Land and park with engines off to complete your flight.'
  },
  {
    title: 'Live Network Map',
    content:
      'See your live position, other Sky Express pilots, and our complete route network in real-time.',
    targetSelector: '[data-tutorial="live-map"]',
    targetPage: '/map',
    position: 'left'
  },
  {
    title: 'Flight History',
    content: 'All your completed flights are logged here with scores, earnings, and statistics.',
    targetSelector: '[data-tutorial="history-list"]',
    targetPage: '/flight-history',
    position: 'right'
  },
  {
    title: 'PIREP Manifests',
    content: 'View detailed flight reports, landing rates, and event logs for every flight.',
    targetSelector: '[data-tutorial="pirep-list"]',
    targetPage: '/pireps',
    position: 'left'
  },
  {
    title: 'Support & Community',
    content: 'Need help? Create support tickets, chat with staff, or browse FAQs here.',
    targetSelector: '[data-tutorial="support-ticket"]',
    targetPage: '/support',
    position: 'left'
  },
  {
    title: 'Community & Social',
    content:
      "Connect with fellow pilots in our new Social Hub! Find wingmen, see who's online, and chat.",
    targetSelector: '[data-tutorial="sidebar-link-community"]',
    targetPage: '/social',
    position: 'right'
  },
  {
    title: 'Direct Messaging',
    content: 'Send direct messages to other pilots instantly.',
    targetSelector: '[data-tutorial="chat-button"]',
    targetPage: '/social',
    position: 'left'
  },
  {
    title: 'Pilot Directory',
    content: 'Browse the entire pilot roster here. See ranks, flight hours, and home bases.',
    targetSelector: '[data-tutorial="pilot-directory"]',
    targetPage: '/social',
    position: 'right'
  },
  {
    title: 'Connections',
    content:
      "Use this filter to see only your connected friends. Click 'CONNECT' on any pilot card to follow them.",
    targetSelector: '[data-tutorial="connections-filter"]',
    targetPage: '/social',
    position: 'bottom'
  },
  {
    title: 'Settings',
    content:
      'Configure your SimBrief ID here to fetch flight plans. You can also replay this tutorial anytime!',
    targetSelector: '[data-tutorial="simbrief-input"]',
    targetPage: '/settings',
    position: 'bottom',
    tip: 'Find your SimBrief ID at simbrief.com under Account Settings.'
  }
]

interface TutorialGuideProps {
  onNavigate: (path: string) => void
}

export const TutorialGuide = ({ onNavigate }: TutorialGuideProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const location = useLocation()

  useEffect(() => {
    const checkTutorial = async () => {
      console.log('Checking tutorial trigger...', location.pathname)
      // Only auto-start tutorial if we are on the dashboard (root path)
      // This prevents it from trying to erroneously start on Login/Register or other pages
      if (location.pathname !== '/') {
        console.log('Not on dashboard, skipping tutorial.')
        return
      }

      // CRITICAL: Check authentication first.
      // If we are not authenticated, we shouldn't show the tutorial,
      // even if the profile (likely Guest) says tutorial not complete.
      const isAuth = await DataService.isAuthenticated()
      console.log('Is Authenticated:', isAuth)
      if (!isAuth) return

      // Re-check path in case we navigated away during await
      if (location.pathname !== '/') return

      const profile = await DataService.getProfile()
      console.log('Profile tutorial complete?', profile?.tutorialComplete)

      if (!profile?.tutorialComplete) {
        console.log('Starting tutorial!')
        setCurrentStep(0)
        setIsOpen(true)
      }
    }

    if (!isOpen) {
      checkTutorial()
    }
  }, [location.pathname, isOpen])

  const findAndHighlightTarget = useCallback(() => {
    const step = tutorialSteps[currentStep]
    if (!step) return

    // Small delay to let the page render
    setTimeout(() => {
      const target = document.querySelector(step.targetSelector)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)
        // Scroll into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setTargetRect(null)
      }
    }, 300)
  }, [currentStep])

  useEffect(() => {
    if (isOpen) {
      findAndHighlightTarget()
    }
  }, [isOpen, currentStep, location.pathname, findAndHighlightTarget])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = tutorialSteps[currentStep + 1]
      // Navigate to the next page if different
      if (nextStep.targetPage !== location.pathname) {
        onNavigate(nextStep.targetPage)
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = tutorialSteps[currentStep - 1]
      if (prevStep.targetPage !== location.pathname) {
        onNavigate(prevStep.targetPage)
      }
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = async () => {
    await DataService.updateProfile({ tutorialComplete: true })
    setIsOpen(false)
    // Reset to first step for next time
    setCurrentStep(0)
  }

  if (!isOpen) return null

  const step = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1
  const isFirstStep = currentStep === 0

  // Calculate tooltip position with bounds checking
  const getTooltipStyle = (): React.CSSProperties => {
    const padding = 20
    const tooltipWidth = 320
    const tooltipHeight = 220 // Approximate max height
    const viewWidth = window.innerWidth
    const viewHeight = window.innerHeight

    // Center position - always safe
    const centerStyle: React.CSSProperties = {
      position: 'fixed',
      top: Math.max(padding, (viewHeight - tooltipHeight) / 2),
      left: Math.max(padding, (viewWidth - tooltipWidth) / 2)
    }

    if (!targetRect) {
      return centerStyle
    }

    // Try to position near the target, but ensure fully visible
    let top: number
    let left: number

    // Calculate left position (centered on target, clamped to viewport)
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    left = Math.max(padding, Math.min(left, viewWidth - tooltipWidth - padding))

    // Calculate top position based on preferred direction
    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding
        if (top < padding) {
          top = targetRect.bottom + padding
        }
        break
      case 'bottom':
        top = targetRect.bottom + padding
        if (top + tooltipHeight > viewHeight - padding) {
          top = targetRect.top - tooltipHeight - padding
        }
        break
      case 'left':
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        // For left/right, adjust left position
        if (step.position === 'right') {
          left = targetRect.right + padding
          if (left + tooltipWidth > viewWidth - padding) {
            left = targetRect.left - tooltipWidth - padding
          }
        } else {
          left = targetRect.left - tooltipWidth - padding
          if (left < padding) {
            left = targetRect.right + padding
          }
        }
        break
      default:
        top = targetRect.bottom + padding
    }

    // Final bounds check - clamp to viewport
    top = Math.max(padding, Math.min(top, viewHeight - tooltipHeight - padding))
    left = Math.max(padding, Math.min(left, viewWidth - tooltipWidth - padding))

    // If it still doesn't fit (very small window), center it
    if (viewHeight < tooltipHeight + padding * 2 || viewWidth < tooltipWidth + padding * 2) {
      return centerStyle
    }

    return {
      position: 'fixed',
      top,
      left
    }
  }

  return (
    <>
      {/* Overlay with cutout for highlighted element */}
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Dark overlay */}
        <svg className="w-full h-full pointer-events-none">
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
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
            fill="rgba(0,0,0,0.7)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {/* Highlight border around target */}
        {targetRect && (
          <div
            className="absolute border-2 border-blue-500 rounded-lg animate-pulse pointer-events-none"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
            }}
          />
        )}
      </div>

      {/* Tooltip popup */}
      <div
        className="z-[201] bg-white rounded-lg shadow-2xl w-80 pointer-events-auto"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a365d] to-[#2a4a7d] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
          <span className="font-bold text-sm">{step.title}</span>
          <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 text-sm mb-3">{step.content}</p>

          {step.tip && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800 mb-3">
              💡 <strong>Tip:</strong> {step.tip}
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {tutorialSteps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep
                    ? 'bg-blue-600'
                    : idx < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
                isFirstStep ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <span className="text-xs text-gray-500">
              {currentStep + 1} / {tutorialSteps.length}
            </span>

            {isLastStep ? (
              <button
                onClick={handleClose}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 font-bold"
              >
                Done!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
