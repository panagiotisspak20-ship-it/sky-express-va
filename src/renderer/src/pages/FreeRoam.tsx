import { useState } from 'react'
import { Globe, Plane, MapPin, Navigation } from 'lucide-react'
import { DataService } from '../services/dataService'
import { useNavigate } from 'react-router-dom'
import { getAirportByICAO } from '../services/airportDatabase'

export const FreeRoam = () => {
  const navigate = useNavigate()
  const [departure, setDeparture] = useState('')
  const [arrival, setArrival] = useState('')
  const [aircraft, setAircraft] = useState('A320')
  const [flightNumber, setFlightNumber] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const dep = departure.toUpperCase().trim()
    const arr = arrival.toUpperCase().trim()

    if (dep.length < 3 || dep.length > 4) {
      setError('Departure ICAO must be 3-4 characters')
      return
    }
    if (arr.length < 3 || arr.length > 4) {
      setError('Arrival ICAO must be 3-4 characters')
      return
    }
    if (dep === arr) {
      setError('Departure and arrival cannot be the same')
      return
    }

    setCreating(true)
    setError(null)

    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const fltNum = flightNumber.trim() || `SEH-FR-${randomNum}`
    const now = new Date()
    const flightId = `FR-${Date.now()}`

    const booking = {
      id: flightId,
      flightNumber: fltNum,
      departure: dep,
      arrival: arr,
      aircraft,
      aircraftName: aircraft,
      scheduledDeparture: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scheduledArrival: '--:--',
      scheduledDepartureZulu: now.toISOString().substr(11, 5) + 'Z',
      scheduledArrivalZulu: '--:--Z',
      status: 'booked' as const,
      bookedAt: now.toISOString(),
      ofpData: null
    }

    await DataService.addBookedFlight(booking)

    // Construct SimBrief URL
    const typeMap: Record<string, string> = {
      A320: 'A320',
      A321: 'A321',
      'ATR 72-600': 'AT76',
      'ATR 42-600': 'AT46',
      'B737-800': 'B738',
      'B777-300ER': 'B77W',
      'B787-9': 'B789',
      'A330-300': 'A333',
      'CRJ-900': 'CRJ9',
      E190: 'E190'
    }
    const simBriefType = typeMap[aircraft] || 'A320'
    const url = `https://www.simbrief.com/system/dispatch.php?type=${simBriefType}&orig=${dep}&dest=${arr}&airline=SEH&fltnum=${fltNum.replace(/\D/g, '')}`

    // Open SimBrief in external browser
    // @ts-ignore
    if (window.api?.openExternal) {
      // @ts-ignore
      window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }

    setCreating(false)
    // Navigate to OFP Viewer to import the generated plan
    navigate('/ofp-viewer', { state: { bookingId: flightId } })
  }

  const depInfo = departure.length >= 3 ? getAirportByICAO(departure) : null
  const arrInfo = arrival.length >= 3 ? getAirportByICAO(arrival) : null

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Globe className="w-5 h-5 text-emerald-600" />
        <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">Free Roam</h1>
        <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded">
          FLY ANYWHERE
        </span>
      </div>

      <div className="legacy-panel bg-white p-4 flex-1 flex flex-col">
        {/* Info Banner */}
        <div className="bg-emerald-50 border border-emerald-300 p-3 mb-4 text-sm">
          <p className="font-bold text-emerald-800 mb-1">🌍 Free Roam Mode</p>
          <p className="text-emerald-700 text-xs">
            Fly any route worldwide with full SimBrief integration. Enter your departure and
            destination, generate an OFP, and enjoy full flight tracking, scoring, and PIREP
            generation.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 text-sm p-2 mb-3">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Departure */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
              <MapPin className="w-3 h-3 inline mr-1" />
              Departure ICAO
            </label>
            <input
              type="text"
              value={departure}
              onChange={(e) => setDeparture(e.target.value.toUpperCase())}
              placeholder="e.g. LGAV"
              maxLength={4}
              data-tutorial="freeroam-dep"
              className="w-full border border-gray-400 px-3 py-2 text-sm font-mono uppercase bg-white focus:border-blue-500 focus:outline-none"
            />
            {depInfo && (
              <div className="text-[10px] text-emerald-700 mt-1 font-bold">
                ✓ {depInfo.name} — {depInfo.city}
              </div>
            )}
            {departure.length >= 3 && !depInfo && (
              <div className="text-[10px] text-gray-500 mt-1">
                Non-network airport (valid for Free Roam)
              </div>
            )}
          </div>

          {/* Arrival */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
              <Navigation className="w-3 h-3 inline mr-1" />
              Arrival ICAO
            </label>
            <input
              type="text"
              value={arrival}
              onChange={(e) => setArrival(e.target.value.toUpperCase())}
              placeholder="e.g. KJFK"
              maxLength={4}
              data-tutorial="freeroam-arr"
              className="w-full border border-gray-400 px-3 py-2 text-sm font-mono uppercase bg-white focus:border-blue-500 focus:outline-none"
            />
            {arrInfo && (
              <div className="text-[10px] text-emerald-700 mt-1 font-bold">
                ✓ {arrInfo.name} — {arrInfo.city}
              </div>
            )}
            {arrival.length >= 3 && !arrInfo && (
              <div className="text-[10px] text-gray-500 mt-1">
                Non-network airport (valid for Free Roam)
              </div>
            )}
          </div>

          {/* Aircraft */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
              <Plane className="w-3 h-3 inline mr-1" />
              Aircraft Type
            </label>
            <select
              value={aircraft}
              onChange={(e) => setAircraft(e.target.value)}
              className="w-full border border-gray-400 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="A320">Airbus A320neo</option>
              <option value="A321">Airbus A321neo</option>
              <option value="ATR 72-600">ATR 72-600</option>
              <option value="ATR 42-600">ATR 42-600</option>
              <option value="B737-800">Boeing 737-800</option>
              <option value="B777-300ER">Boeing 777-300ER</option>
              <option value="B787-9">Boeing 787-9</option>
              <option value="A330-300">Airbus A330-300</option>
              <option value="CRJ-900">Bombardier CRJ-900</option>
              <option value="E190">Embraer E190</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Flight Number */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
              Flight Number (Optional)
            </label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full border border-gray-400 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Route Preview */}
        {departure && arrival && (
          <div className="bg-gray-50 border border-gray-300 p-3 mb-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Route Preview</div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-blue-900 text-lg">
                {departure.toUpperCase() || '????'}
              </span>
              <div className="flex-1 flex items-center">
                <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                <Plane className="w-4 h-4 text-emerald-600 mx-2" />
                <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
              </div>
              <span className="font-bold text-blue-900 text-lg">
                {arrival.toUpperCase() || '????'}
              </span>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>{depInfo ? depInfo.city : 'Custom'}</span>
              <span className="font-mono">{aircraft}</span>
              <span>{arrInfo ? arrInfo.city : 'Custom'}</span>
            </div>
          </div>
        )}

        {/* Create Button */}
        <div className="mt-auto pt-4">
          <button
            onClick={handleCreate}
            disabled={creating || departure.length < 3 || arrival.length < 3}
            data-tutorial="freeroam-generate"
            className="w-full btn-classic flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
          >
            {creating ? <span className="animate-spin">⌛</span> : <Plane className="w-4 h-4" />}
            {creating ? 'GENERATING...' : 'GENERATE SIMBRIEF OFP'}
          </button>
          <p className="text-center text-[10px] text-gray-500 mt-2">
            Opens SimBrief to generate plan, then imports it here.
          </p>
        </div>
      </div>
    </div>
  )
}
