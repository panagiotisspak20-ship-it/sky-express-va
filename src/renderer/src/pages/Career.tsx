import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DataService,
  PilotProfile,
  FlightLogEntry,
  PilotBadge,
  PilotRank
} from '../services/dataService'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, scaleIn, slideDown } from '../utils/animations'
import {
  User,
  Award,
  MapPin,
  Plane,
  CreditCard,
  TrendingUp,
  History,
  ShieldCheck,
  Building,
  PlaneTakeoff,
  Map
} from 'lucide-react'

export const Career = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [logbook, setLogbook] = useState<FlightLogEntry[]>([])
  const [badges, setBadges] = useState<PilotBadge[]>([])
  const [ranks, setRanks] = useState<PilotRank[]>([])
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleError = (err: any) => {
      console.error(err)
    }

    DataService.getProfile().then(setProfile).catch(handleError)
    DataService.getFlightLog().then(setLogbook).catch(handleError)
    DataService.getPilotBadges().then(setBadges).catch(handleError)
    DataService.getRanks().then(setRanks).catch(handleError)
  }, [])

  if (!profile) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-slate-50/50">
        <div className="text-slate-400 font-black uppercase tracking-widest text-sm flex gap-3 items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-sky-cyan"></div>
          Loading Personnel File...
        </div>
      </div>
    )
  }

  const getRankProgress = (): {
    current: PilotRank
    next: PilotRank | null
    percent: number
  } | null => {
    if (!profile || ranks.length === 0) return null
    const sortedDetails = [...ranks].sort((a, b) => a.min_hours - b.min_hours)
    const nextRank = sortedDetails.find((r) => r.min_hours > profile.flightHours)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentRankDetails =
      sortedDetails
        .slice()
        .reverse()
        .find((r) => r.min_hours <= profile.flightHours) || sortedDetails[0]

    if (!nextRank) return { current: currentRankDetails, next: null, percent: 100 }

    const prevHours = currentRankDetails.min_hours
    const targetHours = nextRank.min_hours
    const percent = Math.min(
      100,
      Math.max(0, ((profile.flightHours - prevHours) / (targetHours - prevHours)) * 100)
    )

    return { current: currentRankDetails, next: nextRank, percent }
  }

  const rankProgress = getRankProgress()
  const recentFlights = [...logbook].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 h-full flex flex-col bg-slate-50/50 overflow-y-auto"
    >
      {/* Header */}
      <motion.div variants={slideDown} className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-sky-navy tracking-tighter uppercase mb-1">Dossier</h1>
          <p className="text-slate-400 font-black text-xs tracking-[0.2em] flex items-center gap-2 uppercase">
            <ShieldCheck className="w-4 h-4 text-sky-cyan" /> Secure Pilot Operations Profile
          </p>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <motion.div 
         variants={staggerContainer}
         initial="hidden"
         animate="visible"
         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 auto-rows-min"
      >
         {/* TILE 1: Identity (Square, span 1) */}
         <motion.div variants={scaleIn} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-cyan/5 to-transparent pointer-events-none"></div>
            <div className="w-28 h-28 rounded-full border-[6px] border-white bg-slate-100 shadow-lg flex items-center justify-center overflow-hidden mb-6 relative z-10 group-hover:scale-105 transition-transform duration-500">
               {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Pilot" className="w-full h-full object-cover" />
               ) : (
                  <User className="w-12 h-12 text-slate-300" />
               )}
            </div>
            <h2 className="text-3xl font-black text-sky-navy tracking-tighter uppercase">{profile.callsign}</h2>
            <div className="flex items-center justify-center gap-4 mt-4 w-full text-slate-500">
               <div className="flex flex-col items-center">
                  <MapPin className="w-5 h-5 mb-1 text-sky-cyan" />
                  <span className="text-[9px] font-black tracking-widest uppercase">{profile.currentLocation}</span>
               </div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="flex flex-col items-center">
                  <Building className="w-5 h-5 mb-1 text-sky-magenta" />
                  <span className="text-[9px] font-black tracking-widest uppercase">{profile.homeBase}</span>
               </div>
            </div>
         </motion.div>

         {/* TILE 2: Promotion & Hours (Wide, span 2) */}
         <motion.div variants={scaleIn} className="md:col-span-1 lg:col-span-2 bg-sky-navy rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
               <div>
                  <div className="text-[10px] font-black tracking-[0.2em] text-sky-cyan uppercase mb-1 flex items-center gap-2">
                     <TrendingUp className="w-3 h-3" /> Career Trajectory
                  </div>
                  <div className="text-3xl font-black tracking-tighter uppercase text-white">
                     {rankProgress?.current.name || profile.rank}
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-5xl font-black tracking-tighter text-white drop-shadow-md">
                     {profile.flightHours.toFixed(1)}<span className="text-xl text-sky-cyan ml-1">h</span>
                  </div>
                  <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mt-1">Total Block Time</div>
               </div>
            </div>

            <div className="mt-8 relative z-10 w-full max-w-2xl">
               {rankProgress?.next ? (
                  <>
                     <div className="flex justify-between items-end mb-3">
                        <span className="text-xs font-bold text-slate-300">Progress to {rankProgress.next.name}</span>
                        <span className="text-sm font-black text-sky-cyan">{profile.flightHours.toFixed(1)} / {rankProgress.next.min_hours} HRS</span>
                     </div>
                     <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${rankProgress?.percent || 100}%` }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           className="h-full bg-gradient-to-r from-sky-cyan via-sky-cyan to-white rounded-full relative"
                        >
                           <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </motion.div>
                     </div>
                  </>
               ) : (
                  <div className="w-full h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                     <span className="text-sm font-black tracking-widest text-sky-cyan uppercase">Chief Pilot Rank Achieved</span>
                  </div>
               )}
            </div>
         </motion.div>

         {/* TILE 3: Finance (Square, span 1) */}
         <motion.div variants={scaleIn} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
               <CreditCard className="w-8 h-8" />
            </div>
            <div className="text-4xl font-black text-emerald-600 tracking-tighter">
               €{profile.balance.toLocaleString()}
            </div>
            <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mt-3">Available Balance</div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         </motion.div>

         {/* TILE 4: Medal Case (Wide, span 2) */}
         <motion.div variants={scaleIn} className="md:col-span-1 lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-sky-magenta/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-sky-magenta" />
               </div>
               <span className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Achievements Frame</span>
            </div>

            <div className="flex-1 flex items-center overflow-x-auto pb-4 hide-scrollbar">
               {badges.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center text-center py-6">
                     <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-3">
                        <Award className="w-6 h-6 text-slate-300" />
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No badges earned yet</p>
                  </div>
               ) : (
                  <div className="flex gap-6 min-w-max px-2">
                     {badges.map((badge) => (
                        <div
                           key={badge.id}
                           className="flex flex-col items-center group relative cursor-help"
                           title={`Awarded: ${new Date(badge.awarded_at).toLocaleDateString()}`}
                        >
                           <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-sm border border-white ring-1 ring-slate-200 flex items-center justify-center overflow-hidden mb-3 group-hover:-translate-y-2 group-hover:shadow-lg group-hover:ring-sky-magenta/30 transition-all duration-300 relative z-10">
                              {badge.badge_image_url && !imageError[badge.id] ? (
                                 <img
                                    src={badge.badge_image_url}
                                    alt={badge.badge_name}
                                    className="w-12 h-12 object-contain drop-shadow-md"
                                    onError={() => setImageError((prev) => ({ ...prev, [badge.id]: true }))}
                                 />
                              ) : (
                                 <Award className="w-8 h-8 text-sky-magenta" />
                              )}
                           </div>
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider text-center w-24 leading-tight">
                              {badge.badge_name}
                           </span>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </motion.div>

         {/* TILE 5: Vertical Flight Timeline (Full Width Span 3) */}
         <motion.div variants={scaleIn} className="md:col-span-2 lg:col-span-3 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-cyan/10 flex items-center justify-center">
                     <History className="w-5 h-5 text-sky-cyan" />
                  </div>
                  <span className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Operation History Trace</span>
               </div>
               <button
                  onClick={() => navigate('/flight-history')}
                  className="bg-slate-50 hover:bg-sky-navy hover:text-white text-slate-600 px-6 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-colors flex items-center gap-2 border border-slate-200 hover:border-sky-navy"
               >
                  Open Full Logbook <PlaneTakeoff className="w-4 h-4" />
               </button>
            </div>

            {recentFlights.length === 0 ? (
               <div className="py-12 flex flex-col items-center justify-center">
                  <Map className="w-16 h-16 text-slate-200 mb-4" />
                  <p className="text-sm font-bold text-slate-400">History trace empty. Report to dispatch.</p>
               </div>
            ) : (
               <div className="relative pl-6 lg:pl-10 pb-4">
                  {/* The actual vertical line */}
                  <div className="absolute top-4 bottom-4 left-[22px] lg:left-[38px] w-1 bg-gradient-to-b from-sky-cyan/40 via-sky-cyan/20 to-transparent rounded-full"></div>
                  
                  <div className="flex flex-col gap-8 relative z-10 w-full">
                     {recentFlights.map((flight) => (
                        <div key={flight.id} className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 group">
                           {/* Node Dot */}
                           <div className="absolute left-0 lg:left-4 w-12 h-12 -ml-6 lg:-ml-6 bg-white rounded-full border-[4px] border-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:border-sky-cyan/20 transition-transform shadow-sm">
                              <div className="w-4 h-4 rounded-full bg-sky-navy shadow-[0_0_10px_rgba(0,51,102,0.5)]"></div>
                           </div>

                           <div className="pl-8 lg:pl-16 w-full max-w-lg">
                              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
                                 {new Date(flight.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-sky-cyan/40 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/flight-history')}>
                                 <div>
                                    <div className="font-black text-sky-navy uppercase text-lg mb-1">{flight.flightNumber}</div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                       <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{flight.departure}</span>
                                       <Plane className="w-3 h-3 text-sky-cyan" />
                                       <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{flight.arrival}</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-emerald-600 font-black text-lg">€{flight.earnings.toLocaleString()}</div>
                                    <div className="text-[9px] font-black tracking-widest text-sky-magenta uppercase">{flight.score}% SCORE</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </motion.div>
      </motion.div>
    </motion.div>
  )
}
