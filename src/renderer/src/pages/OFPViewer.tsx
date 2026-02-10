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
      <div className="p-4 h-full flex flex-col items-center justify-center font-tahoma text-gray-600">
        <SkyLoader size="large" text="Dispatching SimBrief Flight Plan..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500 font-tahoma">
        <AlertCircle className="w-12 h-12 mb-2 text-red-500" />
        <p className="font-bold text-lg text-red-600 mb-2">Dispatch Error</p>
        <p>{error}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate(-1)} className="btn-classic">
            GO BACK
          </button>
          <button onClick={() => navigate('/settings')} className="btn-classic">
            SETTINGS
          </button>
        </div>
      </div>
    )
  }

  if (!ofp) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500 font-tahoma">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>No OFP Data Available</p>
        <button onClick={() => navigate(-1)} className="btn-classic mt-4">
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
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-classic p-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            Operational Flight Plan - {general.icao_airline}
            {general.flight_number}
          </h1>
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
      </div>

      {/* OFP Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Flight Info Card */}
          <div className="legacy-panel bg-white p-3">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <Plane className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-sm text-gray-700">FLIGHT INFORMATION</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between border-b border-dotted border-gray-200 py-1">
                <span className="text-gray-500">Flight Number:</span>
                <span className="font-bold">
                  {general.icao_airline}
                  {general.flight_number}
                </span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-200 py-1">
                <span className="text-gray-500">Aircraft:</span>
                <span className="font-bold">
                  {aircraft.icaocode} ({aircraft.name || 'N/A'})
                </span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-200 py-1">
                <span className="text-gray-500">Registration:</span>
                <span className="font-bold">{aircraft.reg || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-200 py-1">
                <span className="text-gray-500">Cruise FL:</span>
                <span className="font-bold">
                  FL{Math.round((general.initial_altitude || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-200 py-1">
                <span className="text-gray-500">Cost Index:</span>
                <span className="font-bold">{general.costindex || 'AUTO'}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-200 py-1">
                <span className="text-gray-500">Distance:</span>
                <span className="font-bold">{general.route_distance || '---'} NM</span>
              </div>
            </div>
          </div>

          {/* Times Card */}
          <div className="legacy-panel bg-white p-3">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="font-bold text-sm text-gray-700">SCHEDULE (ZULU / LOCAL)</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500 text-[10px] uppercase mb-1">
                  Departure ({origin.icao_code})
                </p>
                <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                  <div className="flex justify-between">
                    <span>STD (Zulu):</span>
                    <span className="font-bold font-mono">{formatZulu(times.sched_out)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STD (Local):</span>
                    <span className="font-bold font-mono">{formatLocal(times.sched_out)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Off Block:</span>
                    <span className="font-bold font-mono">{formatZulu(times.est_out)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase mb-1">
                  Arrival ({destination.icao_code})
                </p>
                <div className="bg-green-50 border border-green-200 p-2 rounded">
                  <div className="flex justify-between">
                    <span>STA (Zulu):</span>
                    <span className="font-bold font-mono">{formatZulu(times.sched_in)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STA (Local):</span>
                    <span className="font-bold font-mono">{formatLocal(times.sched_in)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>On Block:</span>
                    <span className="font-bold font-mono">{formatZulu(times.est_in)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-around text-center">
              <div>
                <p className="text-[10px] text-gray-500">BLOCK TIME</p>
                <p className="font-bold text-blue-700">{formatDuration(times.est_block)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">FLIGHT TIME</p>
                <p className="font-bold text-green-700">{formatDuration(times.est_time_enroute)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">TAXI OUT</p>
                <p className="font-bold">{times.taxi_out || '--'} min</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">TAXI IN</p>
                <p className="font-bold">{times.taxi_in || '--'} min</p>
              </div>
            </div>
          </div>

          {/* Fuel Card */}
          <div className="legacy-panel bg-white p-3">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <Fuel className="w-4 h-4 text-orange-600" />
              <span className="font-bold text-sm text-gray-700">FUEL SUMMARY (KG)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Block Fuel:</span>
                <span className="font-bold text-orange-700">{fuel.plan_ramp} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Trip Fuel:</span>
                <span className="font-bold">{fuel.enroute_burn} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Contingency:</span>
                <span className="font-bold">{fuel.contingency} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Alternate:</span>
                <span className="font-bold">{fuel.alternate_burn} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Final Reserve:</span>
                <span className="font-bold">{fuel.reserve} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Extra Fuel:</span>
                <span className="font-bold">{fuel.extra} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Taxi Fuel:</span>
                <span className="font-bold">{fuel.taxi} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Min Takeoff:</span>
                <span className="font-bold">{fuel.min_takeoff} kg</span>
              </div>
            </div>
          </div>

          {/* Weights Card */}
          <div className="legacy-panel bg-white p-3">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <Weight className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-sm text-gray-700">WEIGHTS (KG)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Passengers:</span>
                <span className="font-bold">{weights.pax_count || '---'} pax</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Cargo:</span>
                <span className="font-bold">{weights.cargo} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Payload:</span>
                <span className="font-bold text-purple-700">{weights.payload} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">ZFW:</span>
                <span className="font-bold">{weights.est_zfw} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1 bg-yellow-50">
                <span className="text-gray-600 font-semibold">Takeoff Weight:</span>
                <span className="font-bold text-yellow-700">{weights.est_tow} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1 bg-green-50">
                <span className="text-gray-600 font-semibold">Landing Weight:</span>
                <span className="font-bold text-green-700">{weights.est_ldw} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Max TOW:</span>
                <span className="font-bold">{weights.max_tow} kg</span>
              </div>
              <div className="flex justify-between border-b border-dotted py-1">
                <span className="text-gray-500">Max LDW:</span>
                <span className="font-bold">{weights.max_ldw} kg</span>
              </div>
            </div>
          </div>

          {/* Route Card - Full Width */}
          <div className="legacy-panel bg-white p-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <Route className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-sm text-gray-700">ROUTE</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2 rounded font-mono text-xs leading-relaxed">
              <span className="font-bold text-blue-700">
                {origin.icao_code}/{origin.plan_rwy || 'RWY'}
              </span>{' '}
              {general.route}{' '}
              <span className="font-bold text-green-700">
                {destination.icao_code}/{destination.plan_rwy || 'RWY'}
              </span>
            </div>
            {alternate?.icao_code && (
              <div className="mt-2 text-xs">
                <span className="text-gray-500">ALTERNATE: </span>
                <span className="font-bold text-orange-700">{alternate.icao_code}</span>
                <span className="text-gray-400 ml-2">({alternate.name})</span>
              </div>
            )}
          </div>

          {/* Weather Card */}
          <div className="legacy-panel bg-white p-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <Cloud className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-sm text-gray-700">WEATHER</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">
                  Departure METAR ({origin.icao_code})
                </p>
                <div className="bg-blue-50 border border-blue-200 p-2 rounded font-mono text-[10px] break-all">
                  {weather.orig_metar || 'METAR not available'}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">
                  Arrival METAR ({destination.icao_code})
                </p>
                <div className="bg-green-50 border border-green-200 p-2 rounded font-mono text-[10px] break-all">
                  {weather.dest_metar || 'METAR not available'}
                </div>
              </div>
            </div>
          </div>

          {/* ATC Flight Plan */}
          <div className="legacy-panel bg-white p-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="font-bold text-sm text-gray-700">ATC FLIGHT PLAN</span>
            </div>
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-[10px] leading-relaxed overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {ofp.atc?.flightplan_text || 'ATC Flight Plan not available'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
