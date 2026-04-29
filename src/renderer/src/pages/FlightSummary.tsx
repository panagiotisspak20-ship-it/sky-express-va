import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'
import {
  ArrowLeft,
  Plane,
  Clock,
  Fuel,
  TrendingDown,
  Award,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Activity,
  Zap,
  Gauge
} from 'lucide-react'
import { DataService, FlightLogEntry } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'

// Landing grade calculator
const getLandingGrade = (rate: number) => {
  if (rate === undefined || rate === null) return { text: 'N/A', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' }
  const absRate = Math.abs(rate)
  if (absRate < 50) return { text: 'PERFECT BUTTER', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200 shadow-purple-500/20' }
  if (absRate < 100) return { text: 'BUTTER', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 shadow-indigo-500/20' }
  if (absRate < 150) return { text: 'EXCELLENT', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 shadow-emerald-500/20' }
  if (absRate < 200) return { text: 'GOOD', color: 'text-green-600', bg: 'bg-green-50 border-green-200 shadow-green-500/20' }
  if (absRate < 250) return { text: 'ACCEPTABLE', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200 shadow-yellow-500/20' }
  if (absRate < 350) return { text: 'FIRM', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200 shadow-orange-500/20' }
  if (absRate < 500) return { text: 'HARD', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200 shadow-rose-500/20' }
  return { text: 'VERY HARD', color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300 shadow-rose-500/20' }
}

const getOverallGrade = (score: number) => {
  if (score >= 95) return { grade: 'A+', color: 'text-purple-600' }
  if (score >= 90) return { grade: 'A', color: 'text-emerald-600' }
  if (score >= 85) return { grade: 'A-', color: 'text-emerald-500' }
  if (score >= 80) return { grade: 'B+', color: 'text-blue-600' }
  if (score >= 75) return { grade: 'B', color: 'text-blue-500' }
  if (score >= 70) return { grade: 'B-', color: 'text-amber-600' }
  if (score >= 65) return { grade: 'C+', color: 'text-amber-500' }
  if (score >= 60) return { grade: 'C', color: 'text-orange-500' }
  if (score >= 50) return { grade: 'D', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-rose-600' }
}

const getOtpBadge = (status?: string) => {
  switch (status) {
    case 'On Time':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle }
    case 'Early':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Clock }
    case 'Delayed':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertCircle }
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: Clock }
  }
}

export const FlightSummary = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [flight, setFlight] = useState<FlightLogEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFlight = async () => {
      // First check if flight data was passed via navigation state
      if (location.state?.flightData) {
        setFlight(location.state.flightData)
        setLoading(false)
        return
      }

      // Otherwise try to load from flight log by ID
      if (id) {
        try {
          const log = await DataService.getFlightLog()
          const found = log.find((f) => f.id === id)
          setFlight(found || null)
        } catch (e) {
          console.error(e)
        }
      }
      setLoading(false)
    }
    loadFlight()
  }, [id, location.state])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/50">
        <SkyLoader text="Loading Flight Data..." />
      </div>
    )
  }

  if (!flight) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 p-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Flight Not Found</h2>
        <p className="text-slate-500 mb-8 font-medium">The flight details you requested could not be located.</p>
        <button
          onClick={() => navigate('/flight-history')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-sm transition-colors shadow-sm"
        >
          Back to History
        </button>
      </div>
    )
  }

  const landingGrade = getLandingGrade(flight.landingRate || 0)
  const overallGrade = getOverallGrade(flight.score || 0)

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 xl:p-8 font-sans bg-slate-50/50 h-full overflow-y-auto"
    >
      {/* Top Nav */}
      <motion.div variants={slideDown} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Post-Flight Debrief</h1>
          </div>
        </div>
      </motion.div>

      {/* Hero Boarding-Pass Section */}
      <motion.div variants={fadeInUp} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex flex-col xl:flex-row justify-between items-center gap-8 relative z-10">
          {/* Left side: Flight num & Aircraft & Date */}
          <div className="flex-1 w-full text-center xl:text-left">
            <div className="flex flex-col xl:flex-row items-center gap-4 mb-5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-1">{flight.flightNumber}</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {flight.date && flight.date.includes('T') ? new Date(flight.date).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric'
                  }) : flight.date}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-500 tracking-widest uppercase">
              Aircraft: {flight.aircraft}
            </div>
          </div>

          {/* Center: Route Map */}
          <div className="flex-[1.5] flex items-center justify-center w-full min-w-[280px] lg:min-w-[320px]">
            <div className="text-center shrink-0 w-auto bg-white relative z-10">
              <p className="text-5xl lg:text-6xl font-black text-slate-800 tracking-tight">{flight.departure}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Origin</p>
            </div>
            <div className="flex-1 flex flex-col items-center px-4 sm:px-8 min-w-[100px]">
              <div className="w-full relative flex items-center justify-center -mt-2">
                <div className="border-t-[4px] border-dotted border-slate-200 w-full absolute z-0" />
                <div className="bg-white px-2 sm:px-4 relative z-10 text-blue-500">
                  <Plane className="w-8 h-8 md:w-10 md:h-10" style={{ transform: 'rotate(90deg)' }} />
                </div>
              </div>
              {flight.otp && (
                <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getOtpBadge(flight.otp.status).text} ${getOtpBadge(flight.otp.status).bg} ${getOtpBadge(flight.otp.status).border} bg-white relative z-10 whitespace-nowrap`}>
                  {flight.otp.status} ({flight.otp.diffMinutes}m)
                </div>
              )}
            </div>
            <div className="text-center shrink-0 w-auto bg-white relative z-10">
              <p className="text-5xl lg:text-6xl font-black text-slate-800 tracking-tight">{flight.arrival}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Destination</p>
            </div>
          </div>

          {/* Right side: Overall Grade Stamp */}
          <div className="flex-1 w-full flex justify-center xl:justify-end mt-6 xl:mt-0 border-t xl:border-t-0 xl:border-l border-slate-100 pt-6 xl:pt-0 pl-0 xl:pl-8">
            <div className="text-center xl:text-right flex flex-col items-center xl:items-end w-full">
              <div className="flex items-baseline justify-center xl:justify-end gap-2 mb-2">
                <span className={`text-[80px] font-black bg-clip-text text-transparent bg-gradient-to-br from-current to-slate-900/20 leading-none drop-shadow-sm ${overallGrade.color}`}>
                  {overallGrade.grade}
                </span>
              </div>
              <div className="flex items-center justify-center xl:justify-end gap-3 w-full">
                 <div className="h-px w-8 bg-slate-200 hidden xl:block"></div>
                 <p className="text-xl font-black text-slate-700 tracking-tight leading-none">{flight.score}%</p>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center xl:justify-end gap-1.5 mt-3 w-full">
                <Award className="w-3.5 h-3.5 text-purple-400" /> Overall Flight Score
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4 Horizontal Critical Metrics Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Landing Rate */}
        <motion.div variants={fadeInUp} className={`${landingGrade.bg} p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-transform`}>
          <TrendingDown className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] transition-transform group-hover:scale-110 ${landingGrade.color}`} />
          <div className="relative z-10 flex items-center justify-between w-full mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${landingGrade.color}`}>Landing Rate</span>
            <div className={`p-1.5 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm ${landingGrade.color.replace('text', 'text')}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className={`text-4xl font-black font-mono tracking-tighter leading-none ${landingGrade.color}`}>
              {flight.landingRate || 0} <span className="text-sm font-bold opacity-60">FPM</span>
            </p>
            <div className="mt-2 text-[9px] font-black uppercase tracking-widest opacity-80">
              {landingGrade.text}
            </div>
          </div>
        </motion.div>

        {/* Earnings */}
        <motion.div variants={fadeInUp} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-transform">
          <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.04] text-emerald-800 transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">Flight Pay</span>
            <div className="p-1.5 rounded-lg bg-emerald-200/50 text-emerald-700 shadow-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-4xl font-black text-emerald-700 tracking-tight leading-none">
              €{flight.earnings?.toLocaleString() || 0}
            </p>
            <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-600/80">
              Total Revenue
            </div>
          </div>
        </motion.div>

        {/* Flight Time */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-transform">
          <Clock className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.02] text-blue-800 transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Flight Time</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-4xl font-black text-slate-800 tracking-tight leading-none">
              {flight.duration} <span className="text-sm font-bold text-slate-400">MIN</span>
            </p>
            <div className={flight.otp?.scheduledDeparture && flight.otp?.actualDeparture ? "mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono" : "hidden"}>
              {flight.otp?.scheduledDeparture?.includes('T') ? new Date(flight.otp.scheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : flight.otp?.scheduledDeparture} 
              {' '}-{' '}
              {flight.otp?.actualDeparture ? new Date(flight.otp.actualDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
        </motion.div>

        {/* Fuel Used */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:scale-[1.02] transition-transform">
          <Fuel className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.02] text-amber-800 transition-transform group-hover:scale-110" />
          <div className="relative z-10 flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fuel Burned</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shadow-sm border border-amber-100/50">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-4xl font-black text-slate-800 tracking-tight leading-none">
              {flight.fuelUsed?.toLocaleString() || 0} <span className="text-sm font-bold text-slate-400">KG</span>
            </p>
            <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Total Consumption
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* Split Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
        
        {/* Left Column: Technical Debrief (Max Stats & Constraints) */}
        <motion.div variants={fadeInUp} className="col-span-1 lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full">
            <h3 className="text-xs font-black text-slate-700 mb-5 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase tracking-widest">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50"><Gauge className="w-4 h-4" /></div>
              Technical Debrief
            </h3>

            {/* Max Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Altitude</p>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-slate-700 leading-none">{flight.maxAltitude?.toLocaleString() || '---'}</span>
                  <span className="text-xs font-bold text-slate-400">ft</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Speed</p>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-black text-slate-700 leading-none">{flight.maxSpeed || '---'}</span>
                  <span className="text-xs font-bold text-slate-400">kts</span>
                </div>
              </div>
            </div>

            {/* Flight Constraints */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Parameter Constraints</p>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <span className="text-sm font-semibold text-slate-600">Landing Lights &lt; 10k ft</span>
                {flight.systemStats?.landingLightsOffBelow10k ? (
                   <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">Violation</span>
                ) : (
                   <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Good</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                <span className="text-sm font-semibold text-slate-600">Flap Overspeed Limit</span>
                {flight.systemStats?.flapOverspeed ? (
                   <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">Exceeded</span>
                ) : (
                   <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Good</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Bank Angle</p>
                  <p className={`text-lg font-black leading-none ${(flight.systemStats?.maxBankAngle || 0) > 30 ? 'text-amber-500' : 'text-slate-700'}`}>
                    {Math.round(flight.systemStats?.maxBankAngle || 0)}°
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Pitch Angle</p>
                  <p className="text-lg font-black leading-none text-slate-700">
                    {Math.round(flight.systemStats?.maxPitchAngle || 0)}°
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max G-Force</p>
                  <p className={`text-lg font-black leading-none ${(flight.systemStats?.maxG || 1.0) > 2.0 ? 'text-amber-500' : 'text-slate-700'}`}>
                    {flight.systemStats?.maxG?.toFixed(2) || '1.00'}G
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gear Ext. Alt</p>
                  <p className="text-lg font-black leading-none text-slate-700">
                    {flight.systemStats?.gearExtensionAlt ? `${Math.round(flight.systemStats.gearExtensionAlt).toLocaleString()} ft` : '---'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Right Column: Event Log */}
        <motion.div variants={fadeInUp} className="col-span-1 lg:col-span-7 h-full">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col max-h-[600px] lg:min-h-[480px]">
             <div className="mb-5 border-b border-slate-100 pb-4 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 uppercase tracking-widest">
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><Activity className="w-4 h-4" /></div>
                Flight Timeline & Events
              </h3>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {flight.events?.length || 0} Records
              </div>
            </div>

            {!flight.events || flight.events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <span className="font-black text-slate-600 text-lg mb-1">Perfect Flight!</span>
                <span className="text-sm font-medium">No timeline events or penalties recorded.</span>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-3 custom-scrollbar flex-1 relative pl-2">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100 z-0"></div>

                {flight.events.map((event, idx) => (
                  <div key={idx} className="relative z-10 flex items-start gap-4">
                    {/* Timestamp bubble */}
                    <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200 font-mono text-[9px] font-black text-slate-500 mt-1 shrink-0 w-[60px] text-center">
                      {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    
                    {/* Event Card */}
                    <div className={`flex-1 p-3.5 rounded-2xl border text-sm flex justify-between items-start gap-3 shadow-sm ${
                        event.type === 'penalty'
                          ? 'bg-rose-50 border-rose-100 text-rose-800'
                          : event.type === 'warning'
                            ? 'bg-amber-50 border-amber-100 text-amber-800 flex-col sm:flex-row'
                            : event.type === 'bonus'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold leading-snug self-center">
                        {event.description}
                      </div>
                      
                      {event.penalty ? (
                        <div className="font-black text-rose-600 bg-white px-2.5 py-1.5 rounded-xl border border-rose-100 shadow-sm shrink-0 flex items-center gap-1">
                           <AlertCircle className="w-3.5 h-3.5" />
                          -{event.penalty} <span className="text-[10px] tracking-widest uppercase">pts</span>
                        </div>
                      ) : event.type === 'warning' ? (
                        <div className="font-black text-amber-600 bg-white px-2.5 py-1 rounded-lg border border-amber-100 shadow-sm shrink-0 text-[10px] uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Warning
                        </div>
                      ) : event.type === 'bonus' ? (
                         <div className="font-black text-emerald-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm shrink-0 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-yellow-500" fill="currentColor"/> +Bonus
                        </div>                     
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
