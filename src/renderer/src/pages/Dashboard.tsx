import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Plane, Sparkles, Download, ArrowUpCircle, Trash2, Cloud, Wind, Droplets, Eye, Activity, MapPin, Navigation, DollarSign, Award, Clock, Calendar, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DataService, PilotProfile } from '../services/dataService'
import {
  pageVariants,
  staggerContainer,
  fadeInUp,
  scaleIn,
  slideInLeft,
  slideDown,
  tableRowVariants
} from '../utils/animations'
import { WeatherService } from '../services/weatherService'
import { NotificationCenter } from '../components/NotificationCenter'
import { InteractiveGlobe } from '../components/ui/InteractiveGlobe'
import { toastConfirm } from '../utils/toastConfirm'

export const Dashboard = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [weather, setWeather] = useState<any>(null)
  const [lastLanding, setLastLanding] = useState<{ rate: number; location: string } | null>(null)
  const [logbook, setLogbook] = useState<any[]>([])
  const [nextFlight, setNextFlight] = useState<any>(null)

  // Update state
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const handleFetchError = (err: any, context: string) => {
      console.error(`Failed to load ${context}`, err)
    }

    // Load Weather for pilot's home base
    DataService.getProfile()
      .then((p) => {
        setProfile(p)
        // Default to LGAV (Athens) coords if no homeBase
        const coords: Record<string, [number, number]> = {
          LGAV: [37.9363, 23.9444],
          LGTS: [40.5197, 22.9709],
          LGIR: [35.3397, 25.1803],
          LGHER: [35.3397, 25.1803], // Bug H: Match Register.tsx homeBase option
          LGSA: [35.4872, 24.1497],
          LGKR: [39.6019, 19.9117],
          LGRP: [36.4054, 28.0862]
        }
        const base = p?.homeBase || 'LGAV'
        const [lat, lon] = coords[base] || coords['LGAV']
        const baseNames: Record<string, string> = {
          LGAV: 'Athens Intl. (LGAV)',
          LGTS: 'Thessaloniki (LGTS)',
          LGIR: 'Heraklion (LGIR)',
          LGHER: 'Heraklion (LGHER)',
          LGSA: 'Chania (LGSA)',
          LGKR: 'Corfu (LGKR)',
          LGRP: 'Rhodes (LGRP)'
        }
        WeatherService.getCurrentWeather(lat, lon, baseNames[base] || base)
          .then(setWeather)
          .catch((e) => console.error('Weather load error:', e))
      })
      .catch((e) => handleFetchError(e, 'profile'))

    // Load Next Booked Flight
    DataService.getBookedFlights()
      .then((flights) => {
        const booked = flights.filter((f) => f.status === 'booked')
        if (booked.length > 0) {
          setNextFlight(booked[0])
        }
      })
      .catch((e) => handleFetchError(e, 'flight data'))

    // Load Logbook + seed last landing from most recent PIREP
    DataService.getFlightLog()
      .then((log) => {
        setLogbook(log)
        // Seed the last landing report from the most recent completed flight
        if (log.length > 0 && log[0].landingRate != null) {
          setLastLanding({
            rate: Math.round(log[0].landingRate),
            location: log[0].arrival || 'Unknown'
          })
        }
      })
      .catch((e) => handleFetchError(e, 'logbook'))

    // Listen for Landing Reports
    let cleanup: (() => void) | undefined
    // @ts-ignore
    if (window.api && window.api.msfs) {
      // @ts-ignore
      cleanup = window.api.msfs.onLanding((report) => {
        setLastLanding(report)
      })
    }

    // Listen for app updates
    let cleanupUpdateAvailable: (() => void) | undefined
    let cleanupUpdateDownloaded: (() => void) | undefined
    let cleanupDownloadProgress: (() => void) | undefined
    // @ts-ignore - window.api may not exist in dev
    if (window.api && window.api.updater) {
      // @ts-ignore
      cleanupUpdateAvailable = window.api.updater.onUpdateAvailable(() => {
        setUpdateAvailable(true)
      })
      // @ts-ignore
      cleanupDownloadProgress = window.api.updater.onDownloadProgress((progress: any) => {
        setDownloadProgress(progress.percent || 0)
      })
      // @ts-ignore
      cleanupUpdateDownloaded = window.api.updater.onUpdateDownloaded(() => {
        setUpdateDownloaded(true)
        setIsDownloading(false)
      })
      // Auto-check for updates on mount
      // @ts-ignore
      window.api.updater.checkForUpdates()
    }

    return () => {
      if (cleanup) cleanup()
      if (cleanupUpdateAvailable) cleanupUpdateAvailable()
      if (cleanupUpdateDownloaded) cleanupUpdateDownloaded()
      if (cleanupDownloadProgress) cleanupDownloadProgress()
    }
  }, [])

  // Helper for landing grade
  const getLandingGrade = (rate: number) => {
    if (rate > -100)
      return { text: 'BUTTER', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' }
    if (rate > -250)
      return { text: 'GOOD', color: 'text-green-500', bg: 'bg-green-50 border-green-200' }
    if (rate > -500)
      return { text: 'FIRM', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' }
    return { text: 'HARD', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  }

  const hasCustomBg = !!profile?.equipped_background

  return (
    <motion.div
      className="p-6 h-full flex flex-col gap-6 font-sans bg-slate-50 overflow-y-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Area */}
      <motion.div
        variants={slideDown}
        className="relative rounded-2xl bg-white shadow-md border border-slate-100 z-20 flex-shrink-0"
      >
        {/* Background Layer (Equipped or Default Light) */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl -z-10 ${profile?.equipped_background || 'bg-slate-50'}`}
        >
          {hasCustomBg && <div className="absolute top-0 w-full h-full bg-black/10 mix-blend-overlay"></div>}
          <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12 pointer-events-none">
            <Sparkles className={`w-40 h-40 ${hasCustomBg ? 'text-white' : 'text-slate-200'}`} />
          </div>
        </div>

        {/* Content Container */}
        <div className="flex justify-between items-end p-6 pt-10">
          <div className="flex items-center gap-5">
            <div
              className={`w-20 h-20 rounded-full shadow-lg overflow-hidden relative group transition-all duration-300 bg-white ${profile?.equipped_frame || 'border-4 border-white'}`}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                  <Plane className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className={`text-3xl font-extrabold tracking-tight leading-none mb-2 drop-shadow-md ${hasCustomBg ? 'text-white' : 'text-slate-800'}`}>
                Welcome back, <span className={profile?.equipped_color || (hasCustomBg ? "text-pink-200" : "text-blue-600")}>{profile?.callsign || 'Pilot'}</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full shadow-sm ${hasCustomBg ? 'text-[#0a1f5c] bg-white/90 backdrop-blur' : 'bg-slate-200 text-slate-700'}`}>
                  {profile?.rank || 'Cadet'}
                </span>
                <span className={`text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-full ${hasCustomBg ? 'text-white/90 bg-black/20 backdrop-blur' : 'bg-slate-200 text-slate-600'}`}>
                  <MapPin className={`w-4 h-4 ${hasCustomBg ? 'text-pink-300' : 'text-slate-500'}`} /> Base: {profile?.homeBase || 'LGAV'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center pb-1">
            {/* Update Available Button */}
            {updateAvailable && (
              <button
                onClick={() => {
                  if (updateDownloaded) {
                    // @ts-ignore
                    window.api?.updater?.quitAndInstall()
                  } else if (!isDownloading) {
                    setIsDownloading(true)
                    // @ts-ignore
                    window.api?.updater?.downloadUpdate()
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full shadow-md transition-all ${
                  updateDownloaded
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : isDownloading
                      ? 'bg-blue-500 text-white cursor-wait'
                      : 'bg-white text-[#c83296] hover:bg-pink-50 animate-pulse'
                }`}
              >
                {updateDownloaded ? (
                  <>
                    <ArrowUpCircle className="w-4 h-4" /> INSTALL NOW
                  </>
                ) : isDownloading ? (
                  <>
                    <Download className="w-4 h-4 animate-bounce" /> {Math.round(downloadProgress)}%
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> UPDATE AVAILABLE
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => navigate('/flights')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all ${hasCustomBg ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md' : 'bg-blue-600 hover:bg-blue-700 text-white border border-transparent'}`}
            >
              <Navigation className="w-4 h-4" /> Dispatch Center
            </button>

            <NotificationCenter />
          </div>
        </div>
      </motion.div>

      {/* Next Flight Card (Only if booked) */}
      <AnimatePresence>
        {nextFlight && (
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -30 }}
            className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm flex justify-between items-center relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[#0a1f5c] to-blue-400"></div>
            <div className="pl-4">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Next Booked Flight
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-[#0a1f5c] tracking-tight">{nextFlight.flightNumber}</span>
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    {nextFlight.departure} <Plane className="w-3 h-3 text-slate-400" /> {nextFlight.arrival}
                  </span>
                  <span className="text-slate-500 text-xs font-medium">
                    {nextFlight.aircraft} • Dep: {nextFlight.scheduledDeparture}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                onClick={async () => {
                  if (await toastConfirm('Are you sure you want to cancel this booking?')) {
                    try {
                      await DataService.deleteBookedFlight(nextFlight.id)
                      const flights = await DataService.getBookedFlights()
                      const booked = flights.filter((f) => f.status === 'booked')
                      setNextFlight(booked.length > 0 ? booked[0] : null)
                    } catch (err: any) {
                       console.error('Failed to cancel flight:', err)
                    }
                  }
                }}
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-full text-xs font-bold transition-colors" onClick={() => navigate('/booked-flights')}>
                VIEW BOOKINGS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Stats Row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-4 gap-4"
      >
        {[
          { label: 'FLIGHT HOURS', value: profile?.flightHours.toFixed(1) || '0.0', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
          { label: 'BANK BALANCE', value: '€' + profile?.balance?.toLocaleString(), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: DollarSign },
          { label: 'REPUTATION', value: profile?.reputation + '%', color: 'text-amber-500', bg: 'bg-amber-50', icon: Activity },
          { label: 'VIRTUAL RANK', value: profile?.rank || 'Cadet', color: 'text-[#c83296]', bg: 'bg-pink-50', icon: Award }
        ].map((stat, i) => (
          <motion.div
            variants={scaleIn}
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              <div className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeInUp} className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Left Col: Operations / Weather */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Weather Panel */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0a1f5c] to-blue-700 text-white px-5 py-3 text-sm font-bold flex justify-between items-center">
              <span className="flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-300"/> METAR / WEATHER ({weather?.location || 'LGAV'})</span>
              <span className="bg-blue-500/50 backdrop-blur px-2 py-0.5 rounded text-[10px]">LIVE</span>
            </div>

            <div className="flex-1 p-6 flex gap-8 items-center bg-gradient-to-br from-blue-50 to-white">
              <div className="text-center min-w-[120px]">
                <div className="text-6xl font-light text-[#0a1f5c] tracking-tighter">
                  {weather ? Math.round(weather.temperature) : '--'}°
                </div>
                <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">
                  {weather?.condition || 'N/A'}
                </div>
              </div>

              <div className="h-20 w-px bg-blue-100"></div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
                <div className="flex justify-between items-center border-b border-blue-50/50 pb-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5"/> WIND</span>
                  <span className="font-semibold text-slate-700">
                    {weather ? Math.round(weather.windSpeed) + ' kts' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-50/50 pb-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> PRESSURE</span>
                  <span className="font-semibold text-slate-700">
                    {weather ? Math.round(weather.pressure) + ' hPa' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-50/50 pb-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5"/> HUMIDITY</span>
                  <span className="font-semibold text-slate-700">{weather ? weather.humidity + '%' : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-50/50 pb-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> VISIBILITY</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 rounded-full">
                    {weather?.visibility
                      ? weather.visibility >= 10000
                        ? '10km+'
                        : (weather.visibility / 1000).toFixed(1) + 'km'
                      : '10km+'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Landing Rate Panel */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[160px] flex flex-col overflow-hidden">
            <div className="bg-slate-50 text-slate-600 px-5 py-3 text-xs font-bold border-b border-slate-100 flex items-center gap-2">
              <Plane className="w-4 h-4 text-slate-400" style={{ transform: 'rotate(45deg)' }} /> LAST LANDING REPORT
            </div>
            {lastLanding ? (
              <div className="flex items-center justify-between px-6 h-full bg-gradient-to-r from-transparent to-slate-50/50">
                <div>
                  <div className="text-xs text-slate-400 font-bold mb-1 tracking-wider uppercase">TOUCHDOWN V/S</div>
                  <div
                    className={`text-4xl font-black tracking-tight ${getLandingGrade(lastLanding.rate).color}`}
                  >
                    {lastLanding.rate} <span className="text-xl font-bold opacity-50">fpm</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${getLandingGrade(lastLanding.rate).bg} ${getLandingGrade(lastLanding.rate).color} text-sm font-bold mb-2 shadow-sm`}>
                    <CheckCircle className="w-4 h-4" /> {getLandingGrade(lastLanding.rate).text}
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-end gap-1">
                    <MapPin className="w-3 h-3 text-slate-400"/> {lastLanding.location}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-400 bg-slate-50/50 m-4 rounded-xl border border-dashed border-slate-200">
                <Plane className="w-6 h-6 text-slate-300 mb-2 opacity-50" />
                No landing data received from ACARS yet
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Col: Recent Flights & Globe */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden relative"
        >
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden scale-150 transform transition-transform duration-1000 hover:scale-[1.6]">
            <InteractiveGlobe className="-mt-10" />
          </div>
          <div className="bg-slate-50 text-slate-700 px-5 py-4 text-xs font-bold border-b border-slate-100 z-10 relative shadow-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-[#c83296]" /> RECENT LOGBOOK ENTRIES
          </div>
          <div className="flex-1 overflow-y-auto z-10 relative">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-white/90 backdrop-blur sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-400 border-b border-slate-100">FLIGHT</th>
                  <th className="px-4 py-3 font-bold text-slate-400 border-b border-slate-100">ROUTE</th>
                  <th className="px-4 py-3 font-bold text-slate-400 border-b border-slate-100 text-right">EARNINGS</th>
                </tr>
              </thead>
              <tbody>
                {logbook.length > 0 ? (
                  logbook.slice(0, 7).map((entry, idx) => (
                    <motion.tr
                      key={entry.id}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-blue-50/50 transition-colors border-b border-slate-50 group cursor-pointer"
                      onClick={() => navigate('/career')}
                    >
                      <td className="px-4 py-3 font-bold text-slate-700">{entry.flightNumber}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium font-mono text-[11px]">
                        {entry.departure} <span className="text-slate-300">✈</span> {entry.arrival}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        €{entry.earnings.toFixed(2)}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-sm text-slate-400">
                      <Plane className="w-8 h-8 text-slate-200 mx-auto mb-2 opacity-50" />
                      No recent flights recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-white border-t border-slate-100 z-10">
            <button
              onClick={() => navigate('/career')}
              className="w-full text-sm font-bold text-[#0a1f5c] bg-blue-50 hover:bg-blue-100 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Award className="w-4 h-4" /> VIEW FULL LOGBOOK
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
