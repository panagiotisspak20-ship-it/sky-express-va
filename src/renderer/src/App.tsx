import React, { useState, useEffect, Suspense } from 'react'
import { IntroSplash } from './components/IntroSplash'
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MainLayout } from './layouts/MainLayout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Flights } from './pages/Flights'
import { BookedFlights } from './pages/BookedFlights'
import { FlightHistory } from './pages/FlightHistory'
import { FlightSummary } from './pages/FlightSummary'
import { OFPViewer } from './pages/OFPViewer'
import { Career } from './pages/Career'
import { PilotShop } from './pages/PilotShop'
import { Settings } from './pages/Settings'
import { SocialHub } from './pages/SocialHub'
import { Support } from './pages/Support'
import { Dispatch } from './pages/Dispatch'
import { FreeRoam } from './pages/FreeRoam'
import { PirepLog } from './pages/PirepLog'
import { PirepDetail } from './pages/PirepDetail'
import { Tours } from './pages/Tours'
import { Legal } from './pages/Legal'
import PromoAd from './pages/PromoAd'
import PromoAdFast from './pages/PromoAdFast'
import { TutorialGuide } from './components/Tutorial'
import { DataService } from './services/dataService'
import { AnnouncementBanner } from './components/AnnouncementBanner'
import { Toaster, ToastBar } from 'react-hot-toast'

// Lazy-load heavy pages (Leaflet maps, admin data tables)
const LiveMap = React.lazy(() => import('./pages/LiveMap').then((m) => ({ default: m.LiveMap })))
const Fleet = React.lazy(() => import('./pages/Fleet').then((m) => ({ default: m.Fleet })))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))

// Suspense fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="h-full flex items-center justify-center text-gray-400 font-tahoma text-xs">
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Loading...
    </div>
  </div>
)

// Connection Error View Helper
const ConnectionErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <div className="h-screen w-screen bg-[#3a6ea5] flex flex-col items-center justify-center text-white font-tahoma p-4 text-center">
    <div className="mb-4">
      <svg
        className="w-16 h-16 text-red-400 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <h1 className="text-xl font-bold uppercase mb-2">Connection Error</h1>
    <p className="text-sm opacity-80 mb-6 max-w-md">
      The application failed to connect to the central authorization servers. Please check your
      internet connection and try again.
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-2 bg-white text-[#3a6ea5] font-bold rounded shadow hover:bg-gray-100 transition"
    >
      RETRY CONNECTION
    </button>
  </div>
)

// Auth Guard Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<'loading' | 'error' | boolean>('loading')

  useEffect(() => {
    let resolved = false
    const checkAuth = async () => {
      try {
        const isAuth = await DataService.isAuthenticated()
        resolved = true
        setAuth(isAuth)
      } catch (e) {
        console.error(e)
        resolved = true
        setAuth('error')
      }
    }

    checkAuth()

    const timeout = setTimeout(() => {
      if (!resolved) setAuth('error')
    }, 10000)

    return () => clearTimeout(timeout)
  }, [])

  if (auth === 'error') return <ConnectionErrorView onRetry={() => window.location.reload()} />

  // Show nothing while checking (or a loading spinner)
  if (auth === 'loading')
    return (
      <div className="h-screen w-screen bg-[#3a6ea5] flex items-center justify-center text-white font-tahoma text-xs">
        INITIALIZING ACARS...
      </div>
    )

  return auth ? children : <Navigate to="/login" replace />
}

// Admin Guard Component — checks both auth AND admin status
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied' | 'error'>('loading')

  useEffect(() => {
    let resolved = false
    const check = async () => {
      try {
        const isAuth = await DataService.isAuthenticated()
        if (!isAuth) {
          resolved = true
          setStatus('denied')
          return
        }
        const profile = await DataService.getProfile()
        resolved = true
        setStatus(profile?.isAdmin ? 'admin' : 'denied')
      } catch {
        resolved = true
        setStatus('error')
      }
    }

    check()

    const timeout = setTimeout(() => {
      if (!resolved) setStatus('error')
    }, 10000)

    return () => clearTimeout(timeout)
  }, [])

  if (status === 'error') return <ConnectionErrorView onRetry={() => window.location.reload()} />

  if (status === 'loading')
    return (
      <div className="h-screen w-screen bg-[#3a6ea5] flex items-center justify-center text-white font-tahoma text-xs">
        VERIFYING CREDENTIALS...
      </div>
    )

  if (status === 'denied') return <Navigate to="/" replace />

  return children
}

// Tutorial Wrapper to access navigation
const TutorialWrapper = () => {
  const navigate = useNavigate()
  return <TutorialGuide onNavigate={(path) => navigate(path)} />
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true)

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-sans text-sm font-bold shadow-2xl tracking-wide',
          style: {
            borderRadius: '8px',
            padding: '16px 24px',
            minWidth: '300px',
            boxShadow: '0 10px 25px -5px rgba(26, 41, 66, 0.3)',
            overflow: 'hidden',
            position: 'relative'
          },
          error: {
            style: {
              background: '#1a2942',
              color: '#ffffff',
              border: '2px solid #1a2942'
            },
            icon: '⚠️'
          },
          success: {
            style: {
              background: '#ffffff',
              color: '#1a2942',
              border: '2px solid #1a2942'
            },
            icon: '✅'
          }
        }}
      >
        {(t) => (
          <ToastBar toast={t} style={{ ...t.style, padding: 0 }}>
            {({ icon, message }) => (
              <div className="flex items-center gap-3 w-full h-full px-6 py-4">
                {icon}
                <span className="flex-1">{message}</span>
                {t.duration !== Infinity && t.type !== 'loading' && (
                  <div
                    className="toast-progress"
                    style={{
                      animationDuration: `${t.duration || 4000}ms`,
                      backgroundColor: t.type === 'success' ? '#10b981' : '#e91e63'
                    }}
                  />
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      {showIntro && <IntroSplash onComplete={() => setShowIntro(false)} />}
      <Router>
        <div className="flex flex-col h-screen overflow-hidden">
          <TutorialWrapper />
          <AnnouncementBanner />
          <div className="flex-1 overflow-hidden relative">
            <ErrorBoundary>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/promo" element={<PromoAd />} />
                <Route path="/promo-fast" element={<PromoAdFast />} />
                <Route path="/legal" element={<Legal />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="flights" element={<Flights />} />
                  <Route path="booked-flights" element={<BookedFlights />} />
                  <Route path="flight-history" element={<FlightHistory />} />
                  <Route path="flight-summary" element={<FlightSummary />} />
                  <Route path="flight-summary/:id" element={<FlightSummary />} />
                  <Route path="ofp-viewer" element={<OFPViewer />} />
                  <Route path="dispatch" element={<Dispatch />} />
                  <Route path="free-roam" element={<FreeRoam />} />
                  <Route path="pireps" element={<PirepLog />} />
                  <Route path="pirep/:id" element={<PirepDetail />} />
                  <Route path="/career" element={<Career />} />
                  <Route path="/tours" element={<Tours />} />
                  <Route path="/social" element={<SocialHub />} />
                  <Route path="shop" element={<PilotShop />} />
                  <Route
                    path="map"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <LiveMap />
                      </Suspense>
                    }
                  />
                  <Route
                    path="fleet"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Fleet />
                      </Suspense>
                    }
                  />
                  <Route path="support" element={<Support />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                      </Suspense>
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </Router>
    </>
  )
}
