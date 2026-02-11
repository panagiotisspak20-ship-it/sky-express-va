import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Filter,
  Plane,
  RefreshCw
} from 'lucide-react'
import { DataService } from '../services/dataService'

export const Flights = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterAircraft, setFilterAircraft] = useState<string>('All')
  const [dbFlights, setDbFlights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch flights from Supabase on mount
  useEffect(() => {
    const fetchFlights = async () => {
      setIsLoading(true)
      try {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const { data, error } = await supabase
          .from('flight_schedules')
          .select('*')
          .gte('departure_time', now.toISOString())
          .order('departure_time', { ascending: true })
          .range(0, 5000)

        if (error) {
          console.warn('Supabase fetch error, using fallback:', error)
        }

        if (data && data.length > 0) {
          const mappedFlights = data.map(f => {
            const depDate = new Date(f.departure_time)
            const arrDate = new Date(f.arrival_time)

            const depTimeStr = depDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            const arrTimeStr = arrDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

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
              arrivalTime: f.arrival_time,     // Full ISO
              aircraft: f.aircraft_type || 'A320',
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
    if (filterAircraft !== 'All') {
      result = result.filter((f) => f.aircraft.includes(filterAircraft))
    }
    return result
  }, [allFlights, selectedDate, filterAircraft])

  const handleDispatch = async (flight: (typeof allFlights)[0]) => {
    // 1. Verify SimBrief ID exists
    const profile = await DataService.getProfile()
    if (!profile?.simBriefId || !profile?.simBriefUsername) {
      alert('⚠️ Missing SimBrief Configuration!\n\nPlease go to Settings -> Integrations and enter your SimBrief Pilot ID and Username to book flights and generate SimBrief OFPs.')
      navigate('/settings')
      return
    }

    // Create booking record
    const flightId = Date.now().toString()
    const newBooking = {
      id: flightId,
      flightNumber: flight.flightNo,
      departure: flight.origin.includes('(') ? flight.origin.split('(')[1].replace(')', '') : flight.origin,
      arrival: flight.destination.includes('(') ? flight.destination.split('(')[1].replace(')', '') : flight.destination,
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
        : 'A320'

    const match = flight.flightNo.match(/\d+/)
    const fltNum = match ? match[0] : '0000'

    const origIcao = newBooking.departure
    const destIcao = newBooking.arrival
    const url = `https://www.simbrief.com/system/dispatch.php?type=${type}&orig=${origIcao}&dest=${destIcao}&airline=SEH&fltnum=${fltNum}`

    // @ts-ignore
    if (window.api?.openExternal) {
      // @ts-ignore
      window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }

    navigate('/ofp-viewer', { state: { bookingId: flightId } })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }



  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            Flight Schedule
          </h1>
          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'REAL WORLD DATA'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 font-bold border border-gray-400 bg-white px-2 py-0.5">
            {filteredFlights.length} FLIGHTS • 30 DAY VIEW
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="legacy-panel bg-white p-2 mb-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedDate(null)}
          className={`btn-classic text-[10px] flex items-center gap-1 ${!selectedDate ? 'bg-blue-100 border-blue-400' : ''}`}
        >
          <RefreshCw className="w-3 h-3" /> ALL DATES
        </button>
        <div className="h-4 w-px bg-gray-300"></div>
        {uniqueDates.length > 0 ? uniqueDates.slice(0, 14).map((date) => {
          const isToday = date === new Date().toISOString().split('T')[0]
          const isTomorrow = date === new Date(Date.now() + 86400000).toISOString().split('T')[0]
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-2 py-1 text-[10px] border whitespace-nowrap ${selectedDate === date
                ? 'bg-blue-600 text-white border-blue-700'
                : isToday
                  ? 'bg-green-100 border-green-400 text-green-800 font-bold'
                  : isTomorrow
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                }`}
            >
              {isToday ? '★ TODAY' : isTomorrow ? 'TOMORROW' : formatDate(date)}
            </button>
          )
        }) : <span className="text-[10px] text-gray-400 px-2 italic">No dates available</span>}
        {uniqueDates.length > 14 && <span className="text-[10px] text-gray-500">+{uniqueDates.length - 14} more...</span>}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-2 px-1" data-tutorial="flight-filters">
        <Filter className="w-3 h-3 text-gray-500" />
        <span className="text-[10px] font-bold text-gray-600">AIRCRAFT:</span>
        {['All', 'A320', 'A321', 'ATR 72', 'ATR 42'].map((ac) => (
          <button
            key={ac}
            onClick={() => setFilterAircraft(ac)}
            className={`px-2 py-0.5 text-[10px] border ${filterAircraft === ac
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white border-gray-300'
              }`}
          >
            {ac}
          </button>
        ))}
      </div>

      {/* Flights Table */}
      <div className="legacy-panel flex-1 flex flex-col overflow-hidden flight-table">
        <div className="bg-[#ddd] border-b border-[#999] p-1 mb-1 flex gap-2 justify-between">
          <span className="text-xs font-bold text-[#333]">
            {selectedDate ? `Flights on ${formatDate(selectedDate)}` : 'All Scheduled Flights'}
          </span>
          <span className="text-[10px] text-gray-600 font-mono">{filteredFlights.length} Total Flights</span>
        </div>

        <div className="flex-1 overflow-y-auto inset-box bg-white">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-[#e1e1e1] sticky top-0 z-10">
              <tr>
                <th className="p-1 border border-gray-300 w-16">DATE</th>
                <th className="p-1 border border-gray-300 w-16">FLIGHT</th>
                <th className="p-1 border border-gray-300">ORIGIN</th>
                <th className="p-1 border border-gray-300">DEST</th>
                <th className="p-1 border border-gray-300 w-14 text-center">DEP</th>
                <th className="p-1 border border-gray-300 w-14 text-center">ARR</th>
                <th className="p-1 border border-gray-300 w-24">AIRCRAFT</th>
                <th className="p-1 border border-gray-300 w-20 text-center">STATUS</th>
                <th className="p-1 border border-gray-300 w-20 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlights.length > 0 ? filteredFlights.map((flight, idx) => (
                <tr
                  key={flight.id}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'} hover:bg-blue-100 cursor-default`}
                >
                  <td className="p-1 border border-gray-200 text-[10px] text-gray-600">
                    {formatDate(flight.date)}
                  </td>
                  <td className="p-1 border border-gray-200 font-bold text-blue-900">
                    {flight.flightNo}
                  </td>
                  <td className="p-1 border border-gray-200">{flight.origin}</td>
                  <td className="p-1 border border-gray-200">{flight.destination}</td>
                  <td className="p-1 border border-gray-200 text-center font-mono">
                    {flight.depTime}
                  </td>
                  <td className="p-1 border border-gray-200 text-center font-mono">
                    {flight.arrTime}
                  </td>
                  <td className="p-1 border border-gray-200">
                    <span
                      className={`px-1 text-[9px] ${flight.aircraft.includes('A321')
                        ? 'bg-purple-100 text-purple-800'
                        : flight.aircraft.includes('A320')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                        }`}
                    >
                      {flight.aircraft}
                    </span>
                  </td>
                  <td className="p-1 border border-gray-200 text-center">
                    <span
                      className={`px-1 text-[10px] uppercase font-bold ${flight.status === 'Today'
                        ? 'bg-green-200 text-green-900'
                        : flight.status === 'Tomorrow'
                          ? 'bg-yellow-200 text-yellow-900'
                          : 'text-gray-500'
                        }`}
                    >
                      {flight.status}
                    </span>
                  </td>
                  <td className="p-1 border border-gray-200 text-center">
                    <button
                      onClick={() => handleDispatch(flight)}
                      className="border border-gray-400 bg-[#eee] px-2 text-[9px] hover:bg-[#ddd] active:border-t-gray-600 active:border-l-gray-600 active:border-white active:bg-[#d0d0d0] flex items-center gap-1"
                    >
                      <Plane className="w-2.5 h-2.5" /> BOOK
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 italic">
                    No flights found. {dbFlights.length === 0 && !isLoading && "Try running Sync from Admin Dashboard."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="text-center py-2 text-[10px] text-gray-500">
            Showing {filteredFlights.length} flights. Use filters to narrow down.
          </div>
        </div>
      </div>
    </div >
  )
}
