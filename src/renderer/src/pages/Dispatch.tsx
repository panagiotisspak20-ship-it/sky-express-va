import { useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { DataService, BookedFlight } from '../services/dataService'

import { useNavigate } from 'react-router-dom'

export const Dispatch = () => {
  const navigate = useNavigate()
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

      // In a real browser/electron app, we might run into CORS with direct fetch to SimBrief.
      // Best practice is to use the main process (ipcRenderer.invoke) to fetch this.
      // For now, we will try the direct fetch, but fallback to a mock if it fails (for dev resilience).

      // To properly fetch without CORS in Electron, we should rely on the main process proxy if available.
      // assuming window.api.weather.get is a generic fetcher or we add a new one?
      // We'll try a direct fetch first as SimBrief sometimes allows it or Electron security disabling helps.

      const response = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?userid=${profile.simBriefId}&json=1`
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
        depTime: data.times.sched_out, // Added depTime
        arrTime: data.times.sched_in, // Added arrTime
        raw: data // Store full data if needed later
      })
    } catch (err) {
      console.error(err)
      setError('Could not import OFP. Check SimBrief ID or Generate a Flight first.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!ofp) return

    // Helper to format Zulu time
    const formatZulu = (ts: number) => {
      if (!ts) return '--:--Z'
      const d = new Date(ts * 1000)
      return d.toISOString().substr(11, 5) + 'Z'
    }

    // Helper to format duration - SimBrief returns time in SECONDS
    const formatDuration = (seconds: number) => {
      if (!seconds) return '--:--'
      const totalMins = Math.floor(seconds / 60)
      const h = Math.floor(totalMins / 60)
      const m = totalMins % 60
      return `${h}h ${m.toString().padStart(2, '0')}m`
    }

    const bookedFlight: BookedFlight = {
      id: `SEH${Date.now().toString().slice(-8)}`, // More airline-like confirmation
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
    navigate('/booked-flights')
  }

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      <div className="flex justify-between items-center mb-2 px-1">
        <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
          Flight Dispatch / OFP
        </h1>
        <div className="flex gap-2">
          {ofp && (
            <button
              onClick={handleConfirmBooking}
              className="btn-classic flex items-center gap-1 bg-green-100 border-green-400 text-green-800 animate-in fade-in zoom-in"
            >
              <span className="font-bold">✓ CONFIRM BOOKING</span>
            </button>
          )}
          <button
            onClick={fetchOfp}
            disabled={loading}
            className="btn-classic flex items-center gap-1 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin">⌛</span> : <Download className="w-3 h-3" />}
            {loading ? 'IMPORTING...' : 'IMPORT FROM SIMBRIEF'}
          </button>
          <button className="btn-classic flex items-center gap-1" onClick={() => window.print()}>
            <Printer className="w-3 h-3" /> PRINT
          </button>
        </div>
      </div>

      <div
        className="legacy-panel flex-1 bg-white font-mono text-[11px] overflow-auto p-4 border-2 border-gray-300 relative"
        data-tutorial="dispatch-info"
      >
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-center border-b border-red-300">
            {error}
          </div>
        )}

        {!ofp && !loading && !error && (
          <div className="flex h-full items-center justify-center text-gray-400 italic">
            No Operational Flight Plan loaded. Click Import to fetch latest SimBrief plan.
          </div>
        )}

        {ofp && (
          <pre className="whitespace-pre-wrap leading-tight text-gray-800">
            {`
SKY EXPRESS VIRTUAL AIRLINES
OPERATIONAL FLIGHT PLAN
--------------------------------------------------------------------
FLT NO: ${ofp.flight}    DATE: ${ofp.date}
A/C: ${ofp.aircraft}    
--------------------------------------------------------------------
DEP: ${ofp.dep}
ARR: ${ofp.arr}
--------------------------------------------------------------------
BLOCK FUEL: ${ofp.fuel} KG
PAYLOAD:    ${ofp.payload} KG
--------------------------------------------------------------------
ROUTE:
${ofp.route}

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
    </div>
  )
}
