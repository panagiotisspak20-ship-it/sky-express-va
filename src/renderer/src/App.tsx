import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import { LiveMap } from './pages/LiveMap'
import { PilotShop } from './pages/PilotShop'
import { Settings } from './pages/Settings'
import { SocialHub } from './pages/SocialHub'
import { Support } from './pages/Support'
import { Dispatch } from './pages/Dispatch'
import { FreeRoam } from './pages/FreeRoam'
import { PirepLog } from './pages/PirepLog'
import { PirepDetail } from './pages/PirepDetail'
import { Tours } from './pages/Tours'
import AdminDashboard from './pages/AdminDashboard'
import { TutorialGuide } from './components/Tutorial'
import { DataService } from './services/dataService'
import { AnnouncementBanner } from './components/AnnouncementBanner'

// Auth Guard Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    DataService.isAuthenticated().then(setAuth)
  }, [])

  // Show nothing while checking (or a loading spinner)
  if (auth === null)
    return (
      <div className="h-screen w-screen bg-[#3a6ea5] flex items-center justify-center text-white font-tahoma text-xs">
        INITIALIZING ACARS...
      </div>
    )

  return auth ? children : <Navigate to="/login" replace />
}

// Tutorial Wrapper to access navigation
const TutorialWrapper = () => {
  const navigate = useNavigate()
  return <TutorialGuide onNavigate={(path) => navigate(path)} />
}

export default function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen overflow-hidden">
        <TutorialWrapper />
        <AnnouncementBanner />
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
              <Route path="map" element={<LiveMap />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}
