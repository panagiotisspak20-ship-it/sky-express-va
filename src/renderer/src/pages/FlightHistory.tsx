import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  History,
  Plane,
  Trophy,
  Clock,
  TrendingUp,
  DollarSign,
  Filter,
  Trash2,
  X,
  ChevronDown,
  Award,
  Star,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { DataService, FlightLogEntry } from '../services/dataService'
import { supabase } from '../services/supabase'
import { pageVariants, staggerContainer, scaleIn, slideDown, fadeInUp } from '../utils/animations'

// Helper: Get landing grade
const getLandingGrade = (rate: number) => {
  if (rate === undefined || rate === null) return { text: 'N/A', color: 'text-slate-500', bg: 'bg-slate-100' }
  const absRate = Math.abs(rate)
  if (absRate < 100) return { text: 'BUTTER', color: 'text-sky-magenta', bg: 'bg-sky-magenta/10' }
  if (absRate < 200) return { text: 'GOOD', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (absRate < 350) return { text: 'ACCEPTABLE', color: 'text-amber-600', bg: 'bg-amber-50' }
  if (absRate < 500) return { text: 'FIRM', color: 'text-orange-600', bg: 'bg-orange-50' }
  return { text: 'HARD', color: 'text-rose-600', bg: 'bg-rose-50' }
}

export const FlightHistory = () => {
  const navigate = useNavigate()
  const [flights, setFlights] = useState<FlightLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>('All')

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedFlightForDelete, setSelectedFlightForDelete] = useState<FlightLogEntry | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const loadFlights = useCallback(async () => {
    setLoading(true)
    try {
      const log = await DataService.getFlightLog()
      log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setFlights(log)
    } catch (error) {
      console.error('Failed to load flight history:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFlights()
  }, [loadFlights])

  // Realtime: auto-refresh when completed_flights changes (admin approve/reject)
  useEffect(() => {
    const channel = supabase
      .channel('pilot_flight_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completed_flights' }, () => {
        loadFlights()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadFlights])

  const handleRequestDeletion = async () => {
    if (!selectedFlightForDelete || !deleteReason.trim()) return
    setIsDeleting(true)
    try {
      await DataService.requestFlightDeletion(selectedFlightForDelete.id, deleteReason)
      setShowDeleteModal(false)
      setDeleteReason('')
      await loadFlights() // Refresh list to show pending badge
    } catch (error: any) {
      console.error('Error requesting deletion:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate advanced stats
  const totalHours = flights.reduce((sum, f) => sum + (f.duration || 0), 0) / 60
  const totalEarnings = flights.reduce((sum, f) => sum + (f.earnings || 0), 0)

  const validLandingRates = flights.filter(f => f.landingRate !== undefined && f.landingRate !== null)
  const bestLanding = validLandingRates.length > 0
    ? [...validLandingRates].sort((a, b) => Math.abs(a.landingRate!) - Math.abs(b.landingRate!))[0]
    : null

  const longestFlight = flights.length > 0
    ? [...flights].sort((a, b) => (b.duration || 0) - (a.duration || 0))[0]
    : null

  const recentFlights = flights.slice(0, 10)

  // Get unique months
  const months = [
    ...new Set(
      flights.map((f) => {
        const d = new Date(f.date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
    )
  ]

  // Filter flights
  const filteredFlights =
    filterMonth === 'All' ? flights : flights.filter((f) => f.date.startsWith(filterMonth))

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  const toggleFlight = (id: string) => {
    setExpandedFlightId(expandedFlightId === id ? null : id)
  }

  return (
    <motion.div
      className="p-6 h-full flex flex-col bg-slate-50/50 overflow-y-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={slideDown} className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 px-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-magenta/10 border border-sky-magenta/20 flex items-center justify-center">
            <History className="w-6 h-6 text-sky-magenta" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-sky-navy tracking-tight uppercase">Pilot Logbook</h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest flex items-center gap-2 uppercase">
              Your Entire Flight History
            </p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="flex -space-x-1">
             {recentFlights.slice(0, 5).map((f, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm border border-white ${getLandingGrade(f.landingRate!).bg.replace('/10', '')} ${getLandingGrade(f.landingRate!).color.replace('text', 'bg')}`} title={`${f.landingRate} fpm`}></div>
             ))}
          </div>
          <p className="text-xs font-black tracking-widest text-slate-400">TREND</p>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <span className="text-lg font-black text-sky-navy">{flights.length}</span>
          <span className="text-xs font-bold tracking-widest text-slate-400">FLIGHTS</span>
        </div>
      </motion.div>

      {/* Highlights Row */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 relative overflow-hidden group hover:border-sky-cyan/50 hover:shadow-lg transition-all">
          <div className="w-14 h-14 rounded-2xl bg-sky-cyan/10 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 text-sky-cyan" />
          </div>
          <div>
            <div className="text-3xl font-black text-sky-navy tracking-tighter">{totalHours.toFixed(1)}<span className="text-sm text-slate-400 font-bold ml-1">h</span></div>
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Total Hours</div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
             <Clock className="w-32 h-32" />
          </div>
        </motion.div>

        <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 relative overflow-hidden group hover:border-emerald-200 hover:shadow-lg transition-all">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 tracking-tighter">
              €{totalEarnings.toLocaleString()}
            </div>
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Total Earnings</div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
             <DollarSign className="w-32 h-32" />
          </div>
        </motion.div>

        <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 relative overflow-hidden group hover:border-sky-magenta/30 hover:shadow-lg transition-all">
          <div className="w-14 h-14 rounded-2xl bg-sky-magenta/10 flex items-center justify-center shrink-0">
            <Award className="w-7 h-7 text-sky-magenta" />
          </div>
          <div>
            <div className="text-2xl font-black text-sky-magenta tracking-tighter flex items-center gap-1">
              {bestLanding ? `${bestLanding.landingRate} fpm` : 'N/A'}
            </div>
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Best Landing</div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
             <Star className="w-32 h-32" />
          </div>
        </motion.div>

        <motion.div variants={scaleIn} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 relative overflow-hidden group hover:border-sky-navy/30 hover:shadow-lg transition-all">
          <div className="w-14 h-14 rounded-2xl bg-sky-navy/5 flex items-center justify-center shrink-0">
            <Activity className="w-7 h-7 text-sky-navy" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-700 tracking-tighter">
              {longestFlight ? `${longestFlight.duration} min` : 'N/A'}
            </div>
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Longest Flight</div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
             <Plane className="w-32 h-32" />
          </div>
        </motion.div>
      </motion.div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6 px-2 overflow-x-auto pb-2 shrink-0">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 tracking-wider">FILTER MONTH:</span>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          <button
            onClick={() => setFilterMonth('All')}
            className={`px-6 py-2 text-xs font-black tracking-wider rounded-xl transition-all uppercase ${filterMonth === 'All' ? 'bg-sky-navy text-white shadow-md' : 'text-slate-500 hover:text-sky-navy hover:bg-slate-50'}`}
          >
            All Time
          </button>
          {months.slice(0, 6).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMonth(m)}
              className={`px-6 py-2 text-xs font-black tracking-wider rounded-xl transition-all uppercase ${filterMonth === m ? 'bg-sky-navy text-white shadow-md' : 'text-slate-500 hover:text-sky-navy hover:bg-slate-50'}`}
            >
              {formatMonth(m)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
            <span className="animate-pulse flex items-center gap-2">
              <History className="w-5 h-5 animate-spin"/> Loading flight history...
            </span>
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-200 rounded-3xl m-2">
            <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              <History className="w-10 h-10 text-slate-300" />
            </div>
            <p className="font-black text-xl text-slate-500 mt-2">No completed flights yet</p>
            <p className="text-sm font-medium">Complete your first flight to start your logbook!</p>
          </div>
        ) : (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4 pb-10"
          >
            {filteredFlights.map((flight) => {
              const isExpanded = expandedFlightId === flight.id
              const grade = getLandingGrade(flight.landingRate || 0)

              return (
                <motion.div
                  variants={fadeInUp}
                  key={flight.id}
                  className={`bg-white border rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'border-sky-cyan shadow-lg shadow-sky-cyan/10 ring-4 ring-sky-cyan/5' : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Flight Accordion Header (Always Visible) */}
                  <div 
                    className="p-5 cursor-pointer flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-8 hover:bg-slate-50 transition-colors"
                    onClick={() => toggleFlight(flight.id)}
                  >
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xl font-black ${isExpanded ? 'text-sky-cyan' : 'text-sky-navy'}`}>{flight.flightNumber}</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                           {flight.date && flight.date.includes('T') ? new Date(flight.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : flight.date}
                        </span>
                        {flight.deleteRequested && (
                          <span className="text-[10px] px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse tracking-widest uppercase">
                            Pending Deletion
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {flight.departure}
                        </span>
                        <Plane className="w-4 h-4 text-sky-cyan" />
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {flight.arrival}
                        </span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{flight.aircraft}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 ml-auto">
                       <div className="text-right hidden sm:block">
                         <div className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1">Landing</div>
                         {flight.landingRate !== undefined && flight.landingRate !== null ? (
                            <span className={`text-[10px] px-3 py-1 rounded-lg font-black tracking-widest border border-transparent ${grade.bg} ${grade.color}`}>
                              {flight.landingRate} fpm
                            </span>
                         ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">UNKNOWN</span>
                         )}
                       </div>

                       <div className="text-right flex flex-col justify-center">
                         <div className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1">Earnings</div>
                         <div className="text-lg font-black text-emerald-600">€{flight.earnings.toLocaleString()}</div>
                       </div>
                       
                       <div className="text-right flex flex-col justify-center">
                          <div className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1">Score</div>
                          <div className="text-sm font-black text-sky-magenta bg-sky-magenta/10 border border-sky-magenta/20 px-3 py-1.5 rounded-xl">{flight.score}%</div>
                       </div>

                       <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-sky-cyan text-white shadow-md shadow-sky-cyan/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                          <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                       </div>
                    </div>
                  </div>

                  {/* Expanded Flight Details Board */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-slate-50"
                      >
                         <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {/* Route Map Card Concept */}
                               <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Route Tracing</p>
                                  <div className="flex items-center justify-between mt-2">
                                     <div className="text-center">
                                       <p className="text-3xl font-black text-sky-navy">{flight.departure}</p>
                                     </div>
                                     <div className="flex-1 mx-4 border-t-[3px] border-dashed border-sky-cyan/30 relative">
                                        <Plane className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-cyan bg-white px-0.5" />
                                     </div>
                                     <div className="text-center">
                                       <p className="text-3xl font-black text-sky-navy">{flight.arrival}</p>
                                     </div>
                                  </div>
                                  <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                     <div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Duration</p>
                                        <p className="text-lg font-black text-slate-700">{flight.duration} min</p>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Fuel Used</p>
                                        <p className="text-lg font-black text-slate-700">{(flight.fuelUsed || 0).toLocaleString()} kg</p>
                                     </div>
                                  </div>
                               </div>

                               {/* Telemetry Card */}
                               <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center relative">
                                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4 absolute top-6 left-6">Telemetry</p>
                                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 mt-6">
                                     <div>
                                        <div className="w-8 h-8 rounded-lg bg-sky-magenta/10 flex items-center justify-center mb-2">
                                           <TrendingUp className="w-4 h-4 text-sky-magenta" />
                                        </div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Max Alt</p>
                                        <p className="text-lg font-black text-slate-700">{(flight.maxAltitude || 0).toLocaleString()} ft</p>
                                     </div>
                                     <div>
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                                           <Activity className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Max Speed</p>
                                        <p className="text-lg font-black text-slate-700">{flight.maxSpeed || '---'} kts</p>
                                     </div>
                                     <div className="col-span-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
                                           <Plane className="w-4 h-4 text-emerald-600 rotate-45" />
                                        </div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Landing Impact</p>
                                        <p className={`text-2xl font-black mt-1 ${grade.color}`}>
                                           {flight.landingRate} <span className="text-sm font-bold opacity-70">fpm</span>
                                           <span className={`ml-3 text-xs px-2 py-1 rounded-md border ${grade.bg} border-transparent`}>{grade.text}</span>
                                        </p>
                                     </div>
                                  </div>
                               </div>

                               {/* Actions Card */}
                               <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                                  <div>
                                     <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Logbook Actions</p>
                                     <p className="text-sm text-slate-500 font-medium mb-6">Access your full PIREP layout or request admin intervention for this logged flight.</p>
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    <button
                                      onClick={() => navigate(`/flight-summary/${flight.id}`)}
                                      className="w-full bg-sky-navy text-white hover:bg-[#002244] py-3.5 rounded-2xl font-black tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 shadow-sm uppercase"
                                    >
                                      <Trophy className="w-4 h-4" /> Full Summary Report
                                    </button>

                                    {flight.deleteRequested ? (
                                      <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 text-center rounded-2xl shadow-inner font-medium">
                                        <strong className="block mb-1">Deletion Requested</strong> Waiting for Admin Approval <br />
                                        <span className="text-[10px] opacity-80 italic mt-1 block px-2">Reason: {flight.deleteReason}</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                           setSelectedFlightForDelete(flight)
                                           setShowDeleteModal(true)
                                        }}
                                        className="w-full py-3.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-2xl text-[11px] font-black tracking-widest transition-all flex justify-center items-center gap-2 uppercase"
                                      >
                                        <Trash2 className="w-4 h-4" /> Request Deletion
                                      </button>
                                    )}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Deletion Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedFlightForDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-sky-navy/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="bg-rose-600 text-white p-5 flex justify-between items-center shrink-0">
                <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm">
                  <Trash2 className="w-5 h-5" /> Request Deletion
                </h3>
                <button onClick={() => setShowDeleteModal(false)} className="hover:text-rose-200 transition-colors bg-rose-700 p-1.5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  You are requesting to permanently delete flight{' '}
                  <strong className="text-sky-navy font-black">{selectedFlightForDelete.flightNumber}</strong> (
                  {selectedFlightForDelete.departure} ➔ {selectedFlightForDelete.arrival}).
                </p>
                <div className="bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 rounded-2xl flex gap-3 shadow-inner">
                  <span className="text-xl">⚠️</span>
                  <p>
                    <strong>Note:</strong> Deletions must be verified by an Administrator. If
                    approved, hours and balance earned from this flight will be reversed off your profile.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-500 mb-2 uppercase">
                    Provide a reason for deletion:
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Simulator crashed mid-flight, imported wrong plan..."
                    className="w-full text-sm font-medium border border-slate-200 bg-slate-50 rounded-2xl p-4 h-28 focus:outline-none focus:ring-4 focus:ring-sky-cyan/20 focus:border-sky-cyan resize-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3.5 text-xs font-black tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all uppercase border border-slate-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestDeletion}
                  disabled={!deleteReason.trim() || isDeleting}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black tracking-widest rounded-xl text-xs shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-2 uppercase"
                >
                  {isDeleting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
