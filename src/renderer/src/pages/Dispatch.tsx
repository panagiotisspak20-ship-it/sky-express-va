import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Printer, RefreshCw, Ticket, FileText } from 'lucide-react'
import { DataService, BookedFlight } from '../services/dataService'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageVariants, fadeInUp, slideDown } from '../utils/animations'

export const Dispatch = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const existingBookingId = (location.state as any)?.bookingId || null
  const [ofp, setOfp] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOfp = async () => {
    setLoading(true)
    setError(null)
    try {
      const profile = await DataService.getProfile()
      if (!profile?.simBriefId) {
        setError('No SimBrief Pilot ID found. Please update Settings.')
        setLoading(false)
        return
      }

      const response = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(profile.simBriefId)}&json=1`
      )

      if (!response.ok) throw new Error('Failed to fetch from SimBrief')

      const data = await response.json()

      if (data.fetch && data.fetch.status !== 'Success') {
        throw new Error(data.fetch.status)
      }

      setOfp({
        flight: `${data.general.icao_airline}${data.general.flight_number}`,
        date: new Date(data.params.time_generated * 1000).toISOString().split('T')[0],
        dep: data.origin.icao_code,
        arr: data.destination.icao_code,
        aircraft: data.aircraft.icaocode,
        fuel: data.fuel.plan_ramp,
        payload: data.weights.payload,
        route: data.general.route,
        depTime: data.times.sched_out,
        arrTime: data.times.sched_in,
        raw: data
      })
      
      toast.success('Successfully imported dispatch data!')

      // Auto-save the imported OFP if we have an active booking session context.
      if (existingBookingId) {
        const formatDurationLocal = (seconds: number) => {
          if (!seconds) return '--:--'
          const totalMins = Math.floor(seconds / 60)
          const h = Math.floor(totalMins / 60)
          const m = totalMins % 60
          return `${h}h ${m.toString().padStart(2, '0')}m`
        }

        await DataService.updateBookedFlight(existingBookingId, {
          ofpData: data,
          distance: data?.general?.route_distance || 0,
          cruiseAlt: Math.round((data?.general?.initial_altitude || 0) / 100),
          blockFuel: data?.fuel?.plan_ramp || 0,
          flightTime: formatDurationLocal(data?.times?.est_time_enroute)
        })
      }

    } catch (err) {
      console.error('Failed to import OFP:', err)
      setError('Could not import OFP. Check SimBrief ID or Generate a Flight first.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!ofp) return

    const formatZulu = (ts: number) => {
      if (!ts) return '--:--Z'
      const d = new Date(ts * 1000)
      return d.toISOString().substring(11, 16) + 'Z'
    }

    const formatDuration = (seconds: number) => {
      if (!seconds) return '--:--'
      const totalMins = Math.floor(seconds / 60)
      const h = Math.floor(totalMins / 60)
      const m = totalMins % 60
      return `${h}h ${m.toString().padStart(2, '0')}m`
    }

    // If we arrived from the Schedule page, a booking already exists — just update it with OFP data
    if (existingBookingId) {
      await DataService.updateBookedFlight(existingBookingId, {
        ofpData: ofp.raw,
        distance: ofp.raw?.general?.route_distance || 0,
        cruiseAlt: Math.round((ofp.raw?.general?.initial_altitude || 0) / 100),
        blockFuel: ofp.raw?.fuel?.plan_ramp || 0,
        flightTime: formatDuration(ofp.raw?.times?.est_time_enroute)
      })
      navigate('/ofp-viewer', { state: { bookingId: existingBookingId } })
      return
    }

    // Otherwise, create a brand-new booking (standalone Dispatch usage)
    const bookedFlight: BookedFlight = {
      id: `SEH${Date.now().toString().slice(-8)}`,
      flightNumber: ofp.flight,
      departure: ofp.dep,
      arrival: ofp.arr,
      aircraft: ofp.aircraft,
      aircraftName: ofp.raw?.aircraft?.name || '',
      registration: ofp.raw?.aircraft?.reg || 'N/A',
      scheduledDeparture: ofp.depTime
        ? new Date(ofp.depTime * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '00:00',
      scheduledArrival: ofp.arrTime
        ? new Date(ofp.arrTime * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '00:00',
      scheduledDepartureZulu: formatZulu(ofp.depTime),
      scheduledArrivalZulu: formatZulu(ofp.arrTime),
      flightTime: formatDuration(ofp.raw?.times?.est_time_enroute),
      distance: ofp.raw?.general?.route_distance || 0,
      cruiseAlt: Math.round((ofp.raw?.general?.initial_altitude || 0) / 100),
      blockFuel: ofp.raw?.fuel?.plan_ramp || 0,
      status: 'booked',
      ofpData: ofp.raw,
      bookedAt: new Date().toISOString()
    }

    await DataService.addBookedFlight(bookedFlight)
    navigate('/ofp-viewer', { state: { bookingId: bookedFlight.id } })
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 h-full flex flex-col font-sans bg-slate-50 gap-6 overflow-hidden"
    >
      {/* Header section similar to modern dashboard */}
      <motion.div variants={slideDown} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-cyan/10 text-sky-cyan flex items-center justify-center border border-sky-cyan/20 shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-sky-navy tracking-tight uppercase">
              Flight Dispatch Room
            </h1>
            <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">
              Import and review your operational flight plan
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={fetchOfp}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[11px] tracking-widest transition-all bg-white text-sky-cyan border border-sky-cyan/50 hover:bg-sky-cyan/10 disabled:opacity-50 uppercase"
          >
            <Download className="w-4 h-4" /> IMPORT
          </button>
          <button
             onClick={fetchOfp}
             disabled={loading}
             className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[11px] tracking-widest transition-all bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 uppercase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> RELOAD
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={!ofp}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[11px] tracking-widest shadow-lg transition-all border border-transparent uppercase ${
              ofp 
                ? 'bg-sky-magenta hover:bg-[#c2005a] text-white shadow-sky-magenta/30' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Ticket className="w-4 h-4" /> VIEW TICKET
          </button>
        </div>
      </motion.div>

      {/* Main content: OFP container */}
      <motion.div
        variants={fadeInUp}
        className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative"
        data-tutorial="dispatch-info"
      >
        <div className="bg-gradient-to-r from-sky-cyan to-sky-magenta text-white px-5 py-3 text-[11px] font-black tracking-widest uppercase flex justify-between items-center flex-shrink-0">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/80" /> OPERATIONAL FLIGHT PLAN (OFP)
          </span>
          {ofp && (
             <button 
                onClick={() => window.print()}
                className="hover:scale-105 transition-transform"
                title="Print OFP"
              >
               <Printer className="w-4 h-4 text-blue-200 hover:text-white" />
             </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50 relative">
            {error && (
            <div className="mb-4 bg-rose-50 text-rose-600 p-4 rounded-xl text-center border border-rose-100 text-[11px] font-black tracking-widest uppercase shadow-sm relative z-10">
                {error}
            </div>
            )}

            {!ofp && !loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
                <FileText className="absolute w-[40rem] h-[40rem] text-slate-200/40 -rotate-12 blur-[2px] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-xl shadow-slate-200/50">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-cyan to-sky-magenta rounded-2xl flex items-center justify-center shadow-lg shadow-sky-cyan/20 mb-6 transform -rotate-6">
                    <FileText className="w-10 h-10 text-white rotate-6" />
                  </div>
                  <h2 className="text-2xl font-black text-sky-navy tracking-tight uppercase mb-2">No Dispatch Data Found</h2>
                  <p className="text-sm font-bold text-slate-500 max-w-sm mb-6 leading-relaxed">
                    You haven't imported an Operational Flight Plan yet. Click the IMPORT button above to fetch your latest SimBrief plan.
                  </p>
                  <button
                    onClick={fetchOfp}
                    className="flex items-center gap-2 px-8 py-4 bg-sky-cyan hover:bg-sky-blue text-white rounded-xl font-black tracking-widest text-[11px] uppercase transition-all shadow-lg shadow-sky-cyan/30 hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4" /> Fetch SimBrief OFP
                  </button>
                </div>
            </div>
            )}

            {loading && !ofp && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                  <div className="relative">
                    <RefreshCw className="w-16 h-16 text-sky-cyan animate-spin opacity-20 absolute inset-0" />
                    <FileText className="w-16 h-16 text-sky-magenta animate-pulse relative z-10" />
                  </div>
                  <p className="font-black tracking-widest text-sky-navy text-[11px] uppercase mt-6">Fetching Dispatch Data...</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">Contacting SimBrief Servers</p>
              </div>
            )}

            {ofp && (
            <pre className="whitespace-pre-wrap leading-tight text-slate-800 font-mono text-[11px] bg-white p-6 rounded-xl border border-slate-200 shadow-inner max-w-4xl mx-auto block">
                {`SKY EXPRESS VIRTUAL AIRLINES
OPERATIONAL FLIGHT PLAN
--------------------------------------------------------------------
FLT NO: \${ofp.flight}    DATE: \${ofp.date}
A/C: \${ofp.aircraft}    
--------------------------------------------------------------------
DEP: \${ofp.dep}
ARR: \${ofp.arr}
--------------------------------------------------------------------
BLOCK FUEL: \${ofp.fuel} KG
PAYLOAD:    \${ofp.payload} KG
--------------------------------------------------------------------
ROUTE:
\${ofp.route}

--------------------------------------------------------------------
DISPATCH REMARKS:
- I F L Y  S K Y  E X P R E S S
--------------------------------------------------------------------

                        I HEREBY CERTIFY THAT THIS FLIGHT
                        HAS BEEN DISPATCHED IN ACCORDANCE
                        WITH APPLICABLE REGULATIONS.

                        CAPTAIN SIGNATURE: __________________
`}
            </pre>
            )}
        </div>
      </motion.div>
    </motion.div>
  )
}
