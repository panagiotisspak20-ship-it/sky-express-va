import { useState, useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plane, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { DataService } from '../services/dataService'
import { pageVariants, slideDown, fadeInUp } from '../utils/animations'

export const Flights = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  )

  const [dbFlights, setDbFlights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch flights from Supabase on mount
  useEffect(() => {
    const fetchFlights = async () => {
      setIsLoading(true)
      try {
        const now = new Date()
        now.setUTCHours(0, 0, 0, 0)
        const { data, error } = await supabase
          .from('flight_schedules')
          .select('*')
          .gte('departure_time', now.toISOString())
          .order('departure_time', { ascending: true })
          .range(0, 5000)

        if (error) {
          console.warn('Supabase fetch error:', error)
        }

        if (data && data.length > 0) {
          const mappedFlights = data.map((f) => {
            const depDate = new Date(f.departure_time)
            const arrDate = new Date(f.arrival_time)

            const depTimeStr = depDate.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC'
            }) + 'Z'
            const arrTimeStr = arrDate.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC'
            }) + 'Z'

            const fDateStr = depDate.toISOString().split('T')[0]
            const todayStr = new Date().toISOString().split('T')[0]
            const tmrwDate = new Date()
            tmrwDate.setDate(tmrwDate.getDate() + 1)
            const tmrwStr = tmrwDate.toISOString().split('T')[0]

            let status = 'Scheduled'
            if (fDateStr === todayStr) status = 'Today'
            if (fDateStr === tmrwStr) status = 'Tomorrow'

            return {
              id: f.id,
              flightNo: f.flight_number,
              origin: f.dep_icao,
              destination: f.arr_icao,
              depTime: depTimeStr,
              arrTime: arrTimeStr,
              departureTime: f.departure_time, // Full ISO
              arrivalTime: f.arrival_time, // Full ISO
              aircraft: f.aircraft_type || 'A20N',
              date: fDateStr,
              dateObj: depDate,
              status: status
            }
          })
          setDbFlights(mappedFlights)
        }
      } catch (err) {
        console.error('Failed to fetch schedule from DB', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFlights()
  }, [])

  // Combine DB flights (primary)
  const allFlights = useMemo(() => {
    return dbFlights
  }, [dbFlights])

  // Get unique dates for calendar
  const uniqueDates = useMemo(() => {
    const dates = [...new Set(allFlights.map((f) => f.date))]
    return dates.sort()
  }, [allFlights])

  // Filter flights
  const filteredFlights = useMemo(() => {
    let result = allFlights
    if (selectedDate) {
      result = result.filter((f) => f.date === selectedDate)
    }
    return result
  }, [allFlights, selectedDate])

  const handleDispatch = async (flight: (typeof allFlights)[0]) => {
    // 1. Verify SimBrief ID exists
    const profile = await DataService.getProfile()
    if (!profile?.simBriefId || !profile?.simBriefUsername) {
      toast.error(
        '⚠️ Missing SimBrief Configuration!\n\nPlease go to Settings -> Integrations and enter your SimBrief Pilot ID and Username to book flights and generate SimBrief OFPs.'
      )
      navigate('/settings')
      return
    }

    // Create booking record
    const flightId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newBooking = {
      id: flightId,
      flightNumber: flight.flightNo,
      departure: flight.origin.includes('(')
        ? flight.origin.split('(')[1].replace(')', '')
        : flight.origin,
      arrival: flight.destination.includes('(')
        ? flight.destination.split('(')[1].replace(')', '')
        : flight.destination,
      aircraft: flight.aircraft,
      scheduledDeparture: flight.departureTime || new Date().toISOString(),
      scheduledArrival: flight.arrivalTime || new Date().toISOString(),
      scheduledDepartureZulu: flight.departureTime || new Date().toISOString(),
      scheduledArrivalZulu: flight.arrivalTime || new Date().toISOString(),
      status: 'booked' as const,
      bookedAt: new Date().toISOString(),
      ofpData: null
    }

    await DataService.addBookedFlight(newBooking)

    const type = flight.aircraft.includes('ATR')
      ? 'AT76'
      : flight.aircraft.includes('A321')
        ? 'A321'
        : 'A20N'

    const match = flight.flightNo.match(/\d+/)
    const fltNum = match ? match[0] : '0000'

    const origIcao = newBooking.departure
    const destIcao = newBooking.arrival

    // Extract date and time from the scheduled departure for SimBrief pre-fill
    const depDate = new Date(flight.departureTime || new Date().toISOString())
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC'
    ]
    const dd = depDate.getUTCDate().toString().padStart(2, '0')
    const mmm = months[depDate.getUTCMonth()]
    const yy = depDate.getUTCFullYear().toString().slice(-2)
    const sbDate = `${dd}${mmm}${yy}` // e.g. "20FEB26"
    // Departure times are already UTC in the database, extract directly
    const sbHour = depDate.getUTCHours()
    const sbMin = depDate.getUTCMinutes()
    console.log(
      '[SimBrief] Departure:',
      flight.departureTime,
      '→ date:',
      sbDate,
      'zulu:',
      sbHour + ':' + sbMin
    )

    const url = `https://dispatch.simbrief.com/options/custom?type=${type}&orig=${origIcao}&dest=${destIcao}&airline=SEH&fltnum=${fltNum}&date=${sbDate}&deph=${sbHour}&depm=${sbMin}`

    // @ts-ignore
    if (window.api?.openExternal) {
      // @ts-ignore
      window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }

    navigate('/dispatch', { state: { bookingId: flightId } })
  }

  const formatDate = (dateStr: string) => {
    // dateStr is YYYY-MM-DD from toISOString — parse as UTC to avoid timezone shift
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC'
    })
  }

  return (
    <motion.div
      className="p-6 h-full flex flex-col font-sans bg-slate-50/50"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header section */}
      <motion.div variants={slideDown} className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">
              Flight Schedule
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-blue-200 shadow-sm">
                {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />} 
                REAL WORLD DATA
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex gap-2 items-center">
            <span className="text-blue-600">{filteredFlights.length} FLIGHTS</span>
            <span className="text-slate-300">|</span>
            <span>{uniqueDates.length} DAY VIEW</span>
          </div>
        </div>
      </motion.div>

      {/* Date Selector */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-2xl p-2 mb-6 flex items-center gap-2 overflow-x-auto shadow-sm border border-slate-100 no-scrollbar min-h-[56px] shrink-0"
      >
        <button
          onClick={() => setSelectedDate(null)}
          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            !selectedDate 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> ALL DATES
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1 shrink-0"></div>
        {uniqueDates.length > 0 ? (
          uniqueDates.map((date) => {
            const isToday = date === new Date().toISOString().split('T')[0]
            const isTomorrow = date === new Date(Date.now() + 86400000).toISOString().split('T')[0]
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  selectedDate === date
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isToday
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                      : isTomorrow
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100'
                        : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isToday ? '★ TODAY' : isTomorrow ? 'TOMORROW' : formatDate(date)}
              </button>
            )
          })
        ) : (
          <span className="text-xs text-slate-400 px-4 italic font-medium">No dates available</span>
        )}
      </motion.div>

      {/* Flights Table */}
      <motion.div 
        variants={fadeInUp}
        className="bg-white flex-1 rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden"
      >
        <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex gap-4 justify-between items-center shrink-0">
          <span className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-500" />
            {selectedDate ? `Flights on ${formatDate(selectedDate)}` : 'All Scheduled Flights'}
          </span>
          <span className="text-xs text-slate-500 font-bold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {filteredFlights.length} Total Flights
          </span>
        </div>

        <div className="flex-1 overflow-y-auto relative no-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-white/95 backdrop-blur sticky top-0 z-10 border-b border-slate-100 shadow-sm">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-400 whitespace-nowrap w-32 border-none">DATE</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-24 border-none">FLIGHT</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-24 border-none">ORIGIN</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-24 border-none">DEST</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-20 text-center border-none">DEP</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-20 text-center border-none">ARR</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-28 text-center border-none">STATUS</th>
                <th className="px-5 py-3 font-bold text-slate-400 w-24 text-center border-none">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFlights.length > 0 ? (
                filteredFlights.map((flight) => (
                  <tr
                    key={flight.id}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-500 whitespace-nowrap border-none">
                      {formatDate(flight.date)}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-blue-700 border-none">
                      {flight.flightNo}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-700 border-none">{flight.origin}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-700 border-none">{flight.destination}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-500 border-none">
                      {flight.depTime}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-500 border-none">
                      {flight.arrTime}
                    </td>
                    <td className="px-5 py-3.5 text-center border-none">
                      <span
                        className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md shadow-sm border ${
                          flight.status === 'Today'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : flight.status === 'Tomorrow'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {flight.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center border-none">
                      <button
                        onClick={() => handleDispatch(flight)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full shadow-sm hover:shadow-md hover:shadow-blue-500/20 active:scale-95"
                      >
                        <Plane className="w-3.5 h-3.5" /> BOOK
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-inner border border-slate-100">
                        <Plane className="w-8 h-8 text-slate-300" />
                      </div>
                      <span className="text-slate-500 font-bold text-sm">No flights found.</span>
                      {dbFlights.length === 0 && !isLoading && (
                         <span className="text-slate-400 text-xs font-medium">Try running Sync from the Admin Dashboard.</span>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
