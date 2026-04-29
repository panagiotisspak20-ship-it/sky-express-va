const fs = require('fs');

const content = `import React, { useEffect, useState } from 'react'

import { DataService, Tour, PilotTour } from '../services/dataService'
import { Trophy, ArrowRight, CheckCircle2, Plane, Map, Compass, CalendarRange, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'

export const Tours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([])
  const [pilotTours, setPilotTours] = useState<PilotTour[]>([])
  const [loading, setLoading] = useState(true)

  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const [allTours, myTours] = await Promise.all([
        DataService.getTours(),
        DataService.getPilotTours()
      ])
      setTours(allTours)
      setPilotTours(myTours)
    } catch (err) {
      console.error('Failed to load tours', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleJoinTour = async (tourId: string) => {
    try {
      await DataService.joinTour(tourId)
      await fetchData() // Refresh to show progress
    } catch (err) {
      console.error('Failed to join tour', err)
    }
  }

  const getPilotProgress = (tourId: string) => {
    return pilotTours.find((pt) => pt.tour_id === tourId)
  }

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-slate-50/50 relative overflow-hidden">
        <div className="text-slate-400 font-black uppercase tracking-widest text-sm flex gap-3 items-center relative z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-sky-cyan"></div>
          Loading Expeditions...
        </div>
      </div>
    )
  }

  const activeTours = tours.filter(t => {
     const p = getPilotProgress(t.id)
     return p && p.status !== 'completed'
  })
  
  const completedTours = tours.filter(t => {
     const p = getPilotProgress(t.id)
     return p && p.status === 'completed'
  })
  
  const availableTours = tours.filter(t => {
     const p = getPilotProgress(t.id)
     return !p
  })

  return (
    <motion.div
      className="h-full flex flex-col bg-slate-50 relative overflow-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Subtle Background Elements restored to pristine white/light theme */}
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none z-0"></div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 pt-10 pb-20 relative z-10">
         
         {/* Top Header */}
         <motion.div variants={slideDown} initial="hidden" animate="visible" className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12 shrink-0 border-b-2 border-slate-100 pb-6">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-white to-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                  <Compass className="w-8 h-8 text-sky-navy" />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-sky-navy tracking-tighter uppercase mb-1">Expeditions</h1>
                  <p className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">
                     Sky Express Grand Tours
                  </p>
               </div>
            </div>
            
            <div className="bg-white border border-slate-200 px-6 py-4 rounded-[24px] shadow-sm flex items-center gap-6">
               <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-sky-navy leading-none">{availableTours.length}</span>
                  <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 mt-1 uppercase">Available</span>
               </div>
               <div className="w-px h-10 bg-slate-200 mx-1"></div>
               <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-sky-cyan leading-none">{activeTours.length}</span>
                  <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 mt-1 uppercase">Active</span>
               </div>
               <div className="w-px h-10 bg-slate-200 mx-1"></div>
               <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-emerald-500 leading-none">{completedTours.length}</span>
                  <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 mt-1 uppercase">Mastered</span>
               </div>
            </div>
         </motion.div>

         <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-12 w-full mx-auto relative z-10">
            
            {/* Section: SPLIT-PANEL ACTIVE DASHBOARD */}
            {activeTours.length > 0 && (
               <div className="flex flex-col gap-6 w-full">
                  <h3 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-3 ml-2">
                     <span className="w-8 h-px bg-sky-cyan"></span> Active Operations
                  </h3>
                  
                  {activeTours.map(tour => {
                     const progress = getPilotProgress(tour.id)!
                     const totalLegs = tour.legs?.length || 0
                     const currentLegIndex = progress.current_leg_order - 1
                     const progressPercent = totalLegs > 0 ? (Math.min(currentLegIndex, totalLegs) / totalLegs) * 100 : 0
                     const nextLeg = tour.legs?.[currentLegIndex]

                     return (
                        <motion.div variants={fadeInUp} key={tour.id} className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                           
                           {/* LEFT PANEL: The Tour Briefing */}
                           <div className="xl:col-span-5 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col p-8 md:p-10 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                              
                              <div className="flex items-center gap-6 relative z-10 mb-8">
                                 <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-md p-3 group-hover:scale-105 transition-transform duration-500">
                                    {tour.badge_image_url && !imageError[tour.id] ? (
                                       <img src={tour.badge_image_url} alt="Badge" className="w-full h-full object-contain drop-shadow-sm" onError={() => setImageError((prev) => ({ ...prev, [tour.id]: true }))} />
                                    ) : (
                                       <Compass className="w-10 h-10 text-slate-300" />
                                    )}
                                 </div>
                                 <div className="flex-1">
                                    <div className="inline-block px-3 py-1 bg-sky-cyan/10 text-sky-cyan text-[10px] font-black tracking-widest uppercase rounded-lg mb-2 border border-sky-cyan/20">
                                       Deployed En-Route
                                    </div>
                                    <h2 className="text-3xl font-black text-sky-navy tracking-tighter uppercase leading-none drop-shadow-sm">{tour.title}</h2>
                                 </div>
                              </div>
                              
                              <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed border-b border-slate-100 pb-8 relative z-10">
                                 {tour.description}
                              </p>

                              {/* Vertical Stats */}
                              <div className="flex flex-col gap-6 relative z-10">
                                 <div>
                                    <div className="flex justify-between items-center text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-3">
                                       <span>Overall Progress</span>
                                       <span className="text-sky-navy">LEG {progress.current_leg_order} OF {totalLegs}</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                       <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: \`\${progressPercent}%\` }}
                                          transition={{ duration: 1.5, ease: 'easeOut' }}
                                          className="h-full bg-gradient-to-r from-sky-cyan to-sky-navy rounded-full relative"
                                       >
                                       </motion.div>
                                    </div>
                                 </div>

                                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-4">
                                    <h4 className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                                       <Plane className="w-4 h-4 text-sky-cyan" /> Next Objective
                                    </h4>
                                    
                                    {nextLeg ? (
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-4">
                                             <span className="text-2xl font-black text-sky-navy font-mono uppercase bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{nextLeg.departure_icao}</span>
                                             <ArrowRight className="w-5 h-5 text-slate-300" />
                                             <span className="text-2xl font-black text-sky-navy font-mono uppercase bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{nextLeg.arrival_icao}</span>
                                          </div>
                                       </div>
                                    ) : (
                                       <span className="text-emerald-500 font-black tracking-widest uppercase text-sm">Tour Completed</span>
                                    )}
                                    
                                    {nextLeg?.leg_name && (
                                       <div className="mt-4 text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                          <Map className="w-3 h-3 text-slate-400" />
                                          {nextLeg.leg_name}
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                           
                           {/* RIGHT PANEL: Permanent Full-Trace Itinerary Timeline */}
                           {/* This beautifully utilizes the massive horizontal emptiness */}
                           <div className="xl:col-span-7 bg-white rounded-[2rem] border border-slate-200 p-8 h-full min-h-[500px] shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden">
                              <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                                 <Clock className="w-4 h-4 text-sky-cyan" /> Itinerary Schedule Timeline
                              </h3>
                              
                              <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar relative">
                                 {/* Vertical timeline line */}
                                 <div className="absolute top-6 bottom-6 left-[22px] w-0.5 bg-slate-100 rounded-full z-0"></div>

                                 {tour.legs?.map((leg) => {
                                    const isFlown = progress.current_leg_order > leg.sequence_order
                                    const isCurrent = progress.current_leg_order === leg.sequence_order
                                    const isFuture = !isFlown && !isCurrent

                                    return (
                                       <div key={leg.id} className="flex items-center gap-6 relative z-10 group">
                                          <div className={clsx(
                                             'w-[46px] h-[46px] rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors shadow-sm',
                                             isFlown ? 'bg-emerald-500 border-emerald-100 text-white shadow-emerald-500/20' :
                                             isCurrent ? 'bg-sky-cyan border-white ring-4 ring-sky-cyan/20 text-white animate-pulse' :
                                             'bg-white border-slate-200 text-slate-400'
                                          )}>
                                             {isFlown ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-black tracking-tighter">{leg.sequence_order}</span>}
                                          </div>

                                          <div className={clsx(
                                             'flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300',
                                             isFlown ? 'bg-slate-50 border-slate-200/60 opacity-60' :
                                             isCurrent ? 'bg-sky-cyan/5 border-sky-cyan/30 shadow-[0_0_20px_rgba(76,201,240,0.1)] ring-1 ring-sky-cyan/10' :
                                             'bg-white border-slate-100 hover:border-slate-300'
                                          )}>
                                             <div>
                                                <div className="flex items-center gap-3">
                                                   <span className={clsx('font-black text-xl font-mono uppercase', isFlown ? 'text-slate-500' : isCurrent ? 'text-sky-navy' : 'text-slate-600')}>{leg.departure_icao}</span>
                                                   <ArrowRight className={clsx('w-4 h-4', isFlown ? 'text-slate-300' : isCurrent ? 'text-sky-cyan' : 'text-slate-300')} />
                                                   <span className={clsx('font-black text-xl font-mono uppercase', isFlown ? 'text-slate-500' : isCurrent ? 'text-sky-navy' : 'text-slate-600')}>{leg.arrival_icao}</span>
                                                </div>
                                                {leg.leg_name && (
                                                   <div className={clsx('text-[9px] font-black tracking-[0.1em] uppercase mt-1.5', isFlown ? 'text-slate-400' : isCurrent ? 'text-sky-cyan/80' : 'text-slate-400')}>{leg.leg_name}</div>
                                                )}
                                             </div>
                                             {isCurrent && <span className="hidden sm:inline-block px-3 py-1 bg-sky-cyan text-white text-[9px] font-black tracking-widest uppercase rounded-lg shadow-sm">En-Route</span>}
                                             {isFlown && <span className="hidden sm:inline-block text-[9px] font-black tracking-widest uppercase text-emerald-500">Completed</span>}
                                             {isFuture && <span className="hidden sm:inline-block text-[9px] font-black tracking-widest uppercase text-slate-300">Pending</span>}
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>
                           </div>

                        </motion.div>
                     )
                  })}
               </div>
            )}

            {/* Section: AVAILABLE & COMPLETED DATABASE GRID */}
            <div className="flex flex-col gap-6 w-full pt-8">
               {(availableTours.length > 0 || completedTours.length > 0) && (
                  <h3 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-3 ml-2">
                     <span className="w-8 h-px bg-slate-300"></span> Expedition Database
                  </h3>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                  {/* Available Tours */}
                  {availableTours.map(tour => (
                     <motion.div variants={fadeInUp} key={tour.id} className="w-full bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-sky-cyan/30 transition-all duration-300 flex flex-col overflow-hidden group">
                        
                        <div className="p-8 pb-0">
                           <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-6 mb-6">
                              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-3 shadow-md group-hover:scale-110 transition-transform duration-500 relative z-10 shrink-0">
                                 {tour.badge_image_url && !imageError[tour.id] ? (
                                    <img src={tour.badge_image_url} alt="Badge" className="w-full h-full object-contain" onError={() => setImageError((prev) => ({ ...prev, [tour.id]: true }))} />
                                 ) : (
                                    <Compass className="w-8 h-8 text-slate-300" />
                                 )}
                              </div>
                              <div className="flex-1 text-right">
                                 <h2 className="text-2xl font-black text-sky-navy tracking-tighter uppercase leading-none">{tour.title}</h2>
                                 <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded-lg border border-slate-200">
                                    <CalendarRange className="w-3 h-3" /> {tour.legs?.length || 0} TOTAL LEGS
                                 </span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="px-8 pb-8 flex-1 flex flex-col justify-between">
                           <p className="text-sm font-medium text-slate-500 line-clamp-2 md:line-clamp-3 mb-6 relative z-10">
                              {tour.description}
                           </p>
                           
                           <button
                              onClick={() => handleJoinTour(tour.id)}
                              className="w-full py-4 bg-slate-50 hover:bg-sky-cyan group-hover:bg-sky-navy text-slate-500 group-hover:text-white text-[10px] font-black tracking-[0.2em] uppercase rounded-xl transition-all shadow-sm group-hover:shadow-md flex items-center justify-center gap-2 border border-slate-200 group-hover:border-sky-navy"
                           >
                              Begin Operations <ArrowRight className="w-4 h-4 opacity-50" />
                           </button>
                        </div>
                     </motion.div>
                  ))}

                  {/* Completed Tours */}
                  {completedTours.map(tour => (
                     <motion.div variants={fadeInUp} key={tour.id} className="w-full bg-white rounded-[2rem] border border-emerald-100 shadow-sm flex flex-col overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] z-0 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                        <div className="p-8 pb-0 relative z-10">
                           <div className="flex justify-between items-start gap-4 border-b border-emerald-50 pb-6 mb-6">
                              <div className="w-20 h-20 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center p-3 shadow-sm relative z-10 shrink-0">
                                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                 </div>
                                 {tour.badge_image_url && !imageError[tour.id] ? (
                                    <img src={tour.badge_image_url} alt="Badge" className="w-full h-full object-contain grayscale-[20%]" onError={() => setImageError((prev) => ({ ...prev, [tour.id]: true }))} />
                                 ) : (
                                    <Trophy className="w-8 h-8 text-emerald-500" />
                                 )}
                              </div>
                              <div className="flex-1 text-right">
                                 <h2 className="text-2xl font-black text-emerald-700 tracking-tighter uppercase leading-none">{tour.title}</h2>
                                 <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest uppercase rounded-lg border border-emerald-100">
                                    <Trophy className="w-3 h-3" /> Mastered
                                 </span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="px-8 pb-8 flex-1 flex flex-col justify-between relative z-10">
                           <p className="text-sm font-medium text-slate-400 line-clamp-2 mb-6 line-through decoration-slate-200 opacity-80">
                              {tour.description}
                           </p>
                           
                           <div className="w-full py-4 bg-emerald-50/50 text-emerald-600 text-[10px] font-black tracking-[0.2em] uppercase rounded-xl flex items-center justify-center gap-2 border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4" /> Tour Successfully Completed
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </div>

            </div>
         </motion.div>
      </div>
    </motion.div>
  )
}
`

fs.writeFileSync('src/renderer/src/pages/Tours.tsx', content)
console.log('Successfully completed pure white split panel Tours page redesign rewrite!')
