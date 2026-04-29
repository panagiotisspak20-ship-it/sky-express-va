import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plane,
  Clock,
  Fuel,
  Weight,
  Route,
  Cloud,
  AlertCircle,
  ArrowLeft,
  Printer,
  RefreshCw
} from 'lucide-react'
import { DataService } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'
import { formatZulu, formatLocal, formatDuration } from '../utils/dateUtils'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'

export const OFPViewer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [ofp, setOfp] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOFP = useCallback(
    async (forceRefresh = false) => {
      // 1. If we have data and aren't forcing refresh, do nothing
      if (!forceRefresh && ofp) {
        return
      }

      // 2. If no data, try to get from navigation state first
      if (!forceRefresh && location.state?.ofpData && !ofp) {
        setOfp(location.state.ofpData)
        return
      }

      // 3. Fetch from SimBrief
      setLoading(true)
      setError(null)
      try {
        const profile = await DataService.getProfile()
        if (profile.simBriefUsername) {
          const data = await DataService.getLatestOFP(profile.simBriefUsername)
          setOfp(data)

          // If we have a booking ID, update the booking with this OFP
          if (location.state?.bookingId) {
            await DataService.updateBookedFlight(location.state.bookingId, {
              ofpData: data
            })
          }
        } else {
          setError('No SimBrief username configured. Please go to Settings.')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to fetch latest flight plan. Please generate one on SimBrief first.')
      } finally {
        setLoading(false)
      }
    },
    [location.state, ofp]
  )

  useEffect(() => {
    fetchOFP()
  }, [fetchOFP])

  if (loading) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-slate-500">
        <SkyLoader size="large" text="Dispatching SimBrief Flight Plan..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-slate-500">
        <AlertCircle className="w-16 h-16 mb-4 text-rose-500" />
        <p className="font-extrabold text-2xl text-rose-600 mb-2 tracking-tight">Dispatch Error</p>
        <p className="text-slate-600 mb-6 max-w-md text-center">{error}</p>
        <div className="flex gap-4">
          <button onClick={() => navigate(-1)} className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm px-6 py-2.5 rounded-xl font-bold transition-all">
            GO BACK
          </button>
          <button onClick={() => navigate('/settings')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 py-2.5 rounded-xl font-bold transition-all">
            SETTINGS
          </button>
        </div>
      </div>
    )
  }

  if (!ofp) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-slate-500">
        <AlertCircle className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-lg font-bold text-slate-600">No OFP Data Available</p>
        <button onClick={() => navigate(-1)} className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm px-6 py-2.5 rounded-xl font-bold mt-6 transition-all">
          GO BACK
        </button>
      </div>
    )
  }

  // Extract data from SimBrief OFP
  const general = ofp.general || {}
  const origin = ofp.origin || {}
  const destination = ofp.destination || {}
  const alternate = ofp.alternate || {}
  const aircraft = ofp.aircraft || {}
  const fuel = ofp.fuel || {}
  const weights = ofp.weights || {}
  const times = ofp.times || {}

  const weather = ofp.weather || {}

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 h-full flex flex-col bg-slate-50/50"
    >
      {/* Header */}
      <motion.div variants={slideDown} className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm p-2 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              OPERATIONAL FLIGHT PLAN
            </h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest">
              {general.icao_airline}{general.flight_number}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-classic flex items-center gap-1"
            onClick={() => fetchOFP(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'LOADING...' : 'REFRESH'}
          </button>
          <button className="btn-classic flex items-center gap-1" onClick={() => window.print()}>
            <Printer className="w-3 h-3" /> PRINT OFP
          </button>
        </div>
      </motion.div>

      {/* OFP Content */}
      <div className="flex-1 overflow-auto no-scrollbar pb-6 px-2">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-2 gap-5"
        >
          {/* Flight Info Card */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                 <Plane className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">FLIGHT INFORMATION</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">Flight Number:</span>
                <span className="font-bold text-slate-800">
                  {general.icao_airline}
                  {general.flight_number}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">Aircraft:</span>
                <span className="font-bold text-slate-800">
                  {aircraft.icaocode} <span className="text-slate-400 font-normal">({aircraft.name || 'N/A'})</span>
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">Registration:</span>
                <span className="font-mono font-bold text-slate-700">{aircraft.reg || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">Cruise FL:</span>
                <span className="font-bold text-slate-800">
                  FL{Math.round((general.initial_altitude || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">Cost Index:</span>
                <span className="font-mono font-bold text-slate-700">{general.costindex || 'AUTO'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium">Distance:</span>
                <span className="font-bold text-slate-800">{general.route_distance || '---'} NM</span>
              </div>
            </div>
          </motion.div>

          {/* Route Card - Brought up higher for logic flow */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                 <Route className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">ROUTE OF FLIGHT</span>
            </div>
            
            <div className="flex items-center justify-between mb-4 mt-2 px-2">
               <div className="text-center">
                  <p className="text-3xl font-black text-slate-800">{origin.icao_code}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 pb-1 border-b-2 border-slate-200 inline-block">RWY {origin.plan_rwy || '--'}</p>
               </div>
               <div className="flex-1 mx-6 relative flex items-center">
                  <div className="h-0.5 w-full bg-slate-200 relative">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-slate-300 bg-white"></div>
                  </div>
                  <Plane className="w-5 h-5 text-indigo-400 absolute left-1/2 -translate-x-1/2 bg-white px-1 -my-2" />
               </div>
               <div className="text-center">
                  <p className="text-3xl font-black text-slate-800">{destination.icao_code}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 pb-1 border-b-2 border-slate-200 inline-block">RWY {destination.plan_rwy || '--'}</p>
               </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono text-sm leading-relaxed text-slate-600 break-words mt-4">
              {general.route || 'Direct'}
            </div>
            
            {alternate?.icao_code && (
              <div className="mt-4 flex items-center gap-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3">
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest bg-orange-100 px-2 py-1 rounded">ALTERNATE</span>
                <span className="font-bold text-orange-700 text-lg">{alternate.icao_code}</span>
                <span className="text-orange-500/70 font-medium text-sm">({alternate.name})</span>
              </div>
            )}
          </motion.div>

          {/* Times Card */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                 <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">SCHEDULE (ZULU / LOCAL)</span>
            </div>
            <div className="grid grid-cols-2 gap-5 text-xs">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <p className="text-blue-500 text-[10px] font-extrabold uppercase mb-3 flex items-center justify-between">
                  <span>Departure</span>
                  <span className="text-blue-700 font-black text-sm">{origin.icao_code}</span>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium">STD (Zulu):</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">{formatZulu(times.sched_out)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium text-[10px]">STD (Local):</span>
                    <span className="font-mono text-[10px]">{formatLocal(times.sched_out)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 pt-2 border-t border-blue-100/50">
                    <span className="font-bold">Off Block:</span>
                    <span className="font-bold font-mono text-sm">{formatZulu(times.est_out)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                <p className="text-emerald-600 text-[10px] font-extrabold uppercase mb-3 flex items-center justify-between">
                  <span>Arrival</span>
                  <span className="text-emerald-800 font-black text-sm">{destination.icao_code}</span>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-medium">STA (Zulu):</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">{formatZulu(times.sched_in)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium text-[10px]">STA (Local):</span>
                    <span className="font-mono text-[10px]">{formatLocal(times.sched_in)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 pt-2 border-t border-emerald-200/50">
                    <span className="font-bold">On Block:</span>
                    <span className="font-bold font-mono text-sm">{formatZulu(times.est_in)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 mb-1">BLOCK TIME</p>
                <p className="font-bold text-blue-600 font-mono">{formatDuration(times.est_block)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 mb-1">FLIGHT TIME</p>
                <p className="font-bold text-emerald-600 font-mono">{formatDuration(times.est_time_enroute)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 mb-1">TAXI OUT</p>
                <p className="font-bold text-slate-700 font-mono">
                  {times.taxi_out ? Math.round(Number(times.taxi_out) / 60) : '--'}m
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 mb-1">TAXI IN</p>
                <p className="font-bold text-slate-700 font-mono">
                  {times.taxi_in ? Math.round(Number(times.taxi_in) / 60) : '--'}m
                </p>
              </div>
            </div>
          </motion.div>

          {/* Fuel Card */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                 <Fuel className="w-4 h-4 text-orange-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">FUEL SUMMARY (KG)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between items-center bg-orange-50/50 border border-orange-100 p-2.5 rounded-lg">
                <span className="text-orange-800 font-bold">Block Fuel:</span>
                <span className="font-bold font-mono text-orange-600 text-lg">{fuel.plan_ramp}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                <span className="text-slate-500 font-medium">Min Takeoff:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.min_takeoff}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">Trip Fuel:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.enroute_burn}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">Contingency:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.contingency}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">Alternate:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.alternate_burn}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">Final Reserve:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.reserve}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">Extra Fuel:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.extra}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">Taxi Fuel:</span>
                <span className="font-bold font-mono text-slate-700">{fuel.taxi}</span>
              </div>
            </div>
          </motion.div>

          {/* Weights Card */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                 <Weight className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">WEIGHTS (KG)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between items-center bg-purple-50/50 border border-purple-100 p-2.5 rounded-lg">
                <span className="text-purple-800 font-bold">Payload:</span>
                <span className="font-bold font-mono text-purple-600 text-lg">{weights.payload}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                <span className="text-slate-500 font-medium">Passengers:</span>
                <span className="font-bold font-mono text-slate-700">{weights.pax_count || '---'} pax</span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5 col-span-2">
                <span className="text-slate-500 font-medium">Cargo:</span>
                <span className="font-bold font-mono text-slate-700">{weights.cargo}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-500 font-medium">ZFW:</span>
                <span className="font-bold font-mono text-slate-700">{weights.est_zfw}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-400 text-xs">Max ZFW:</span>
                <span className="font-bold font-mono text-slate-400 text-xs">{weights.max_zfw || '---'}</span>
              </div>

              <div className="flex justify-between items-center bg-yellow-50/50 border border-yellow-100 p-2.5 rounded-lg">
                <span className="text-yellow-700 font-bold">Takeoff Wt:</span>
                <span className="font-bold font-mono text-yellow-600">{weights.est_tow}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-400 text-xs">Max TOW:</span>
                <span className="font-bold font-mono text-slate-400 text-xs">{weights.max_tow}</span>
              </div>

              <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg">
                <span className="text-emerald-700 font-bold">Landing Wt:</span>
                <span className="font-bold font-mono text-emerald-600">{weights.est_ldw}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-50 border-b-slate-100 p-2.5">
                <span className="text-slate-400 text-xs">Max LDW:</span>
                <span className="font-bold font-mono text-slate-400 text-xs">{weights.max_ldw}</span>
              </div>
            </div>
          </motion.div>

          {/* Weather Card */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 xl:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                 <Cloud className="w-4 h-4 text-sky-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">WEATHER (METAR)</span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                   Departure ({origin.icao_code})
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed shadow-inner">
                  {weather.orig_metar || 'METAR not available'}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                   Arrival ({destination.icao_code})
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed shadow-inner">
                  {weather.dest_metar || 'METAR not available'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ATC Flight Plan */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 xl:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                 <Route className="w-4 h-4 text-slate-600" />
              </div>
              <span className="font-extrabold text-sm text-slate-700 tracking-wider">ATC FLIGHT PLAN</span>
            </div>
            <div className="bg-slate-800 text-emerald-400 p-5 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto shadow-inner border border-slate-900">
              <pre className="whitespace-pre-wrap">
                {ofp.atc?.flightplan_text || 'ATC Flight Plan not available'}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
