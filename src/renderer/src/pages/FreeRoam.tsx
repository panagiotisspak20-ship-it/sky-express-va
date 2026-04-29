import { useState, useEffect } from 'react'
import { Globe, Plane, MapPin, Navigation } from 'lucide-react'
import { DataService } from '../services/dataService'
import { useNavigate } from 'react-router-dom'
import { getAirportByICAO } from '../services/airportDatabase'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'


export const FreeRoam = () => {
  const navigate = useNavigate()
  const [departure, setDeparture] = useState('')
  const [arrival, setArrival] = useState('')
  const [aircraft, setAircraft] = useState('A20N')
  const [flightNumber, setFlightNumber] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    DataService.getProfile().catch((e) => {
      console.error('Failed to load profile in FreeRoam', e)
    })
  }, [])

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
      scheduledDepartureZulu: now.toISOString().substring(11, 16) + 'Z',
      scheduledArrivalZulu: '--:--Z',
      status: 'booked' as const,
      bookedAt: now.toISOString(),
      ofpData: null
    }

    try {
      await DataService.addBookedFlight(booking)

      // Construct SimBrief URL
      const typeMap: Record<string, string> = {
        A20N: 'A20N',
        A320: 'A320',
        AT46: 'AT46',
        AT76: 'AT76'
      }
      const simBriefType = typeMap[aircraft] || 'A20N'
      const fltNumDigits = fltNum.replace(/\D/g, '') || '0000'
      const url = `https://dispatch.simbrief.com/options/custom?type=${simBriefType}&orig=${dep}&dest=${arr}&airline=SEH&fltnum=${fltNumDigits}`

      // Open SimBrief in external browser
      // @ts-ignore
      if (window.api?.openExternal) {
        // @ts-ignore
        window.api.openExternal(url)
      } else {
        window.open(url, '_blank')
      }

      setCreating(false)
      // Navigate to Dispatch page to allow user time to generate and then fetch the plan
      navigate('/dispatch', { state: { bookingId: flightId } })
    } catch (err: any) {
      console.error('Failed to generate free roam flight', err)
      setCreating(false)
    }
  }

  const depInfo = departure.length >= 3 ? getAirportByICAO(departure) : null
  const arrInfo = arrival.length >= 3 ? getAirportByICAO(arrival) : null

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 h-full flex flex-col bg-slate-50/50"
    >
      <motion.div variants={slideDown} className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 rounded-xl bg-sky-magenta/10 border border-sky-magenta/20 flex items-center justify-center">
          <Globe className="w-5 h-5 text-sky-magenta" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-sky-navy tracking-tight">FREE ROAM</h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest flex items-center gap-2">
            FLY ANYWHERE
            <span className="bg-sky-cyan text-sky-navy text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
              Unlocked
            </span>
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex-1 flex flex-col"
      >
        {/* Info Banner */}
        <motion.div
          variants={fadeInUp}
          className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6"
        >
          <p className="font-extrabold text-sky-navy flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-sky-cyan" />
            Free Roam Mode
          </p>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Fly any route worldwide with full SimBrief integration. Enter your departure and
            destination, generate an OFP, and enjoy full flight tracking, scoring, and PIREP
            generation.
          </p>
        </motion.div>

        {error && (
          <motion.div
            variants={fadeInUp}
            className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded-xl mb-6 font-medium flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {error}
          </motion.div>
        )}

        {/* Form */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Departure */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4 inline mr-1 text-slate-400" />
              Departure ICAO
            </label>
            <input
              type="text"
              value={departure}
              onChange={(e) => setDeparture(e.target.value.toUpperCase())}
              placeholder="e.g. LGAV"
              maxLength={4}
              data-tutorial="freeroam-dep"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-700 uppercase focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
            {depInfo && (
              <div className="text-xs text-sky-cyan mt-2 font-bold px-1 drop-shadow-sm">
                ✓ {depInfo?.name} — {depInfo?.city}
              </div>
            )}
            {departure.length >= 3 && !depInfo && (
              <div className="text-xs text-slate-400 mt-2 font-medium px-1">
                Non-network airport (valid for Free Roam)
              </div>
            )}
          </div>

          {/* Arrival */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Navigation className="w-4 h-4 inline mr-1 text-slate-400" />
              Arrival ICAO
            </label>
            <input
              type="text"
              value={arrival}
              onChange={(e) => setArrival(e.target.value.toUpperCase())}
              placeholder="e.g. KJFK"
              maxLength={4}
              data-tutorial="freeroam-arr"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-700 uppercase focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
            {arrInfo && (
              <div className="text-xs text-sky-cyan mt-2 font-bold px-1 drop-shadow-sm">
                ✓ {arrInfo?.name} — {arrInfo?.city}
              </div>
            )}
            {arrival.length >= 3 && !arrInfo && (
              <div className="text-xs text-slate-400 mt-2 font-medium px-1">
                Non-network airport (valid for Free Roam)
              </div>
            )}
          </div>

          {/* Aircraft */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Plane className="w-4 h-4 inline mr-1 text-slate-400" />
              Aircraft Type
            </label>
            <select
              value={aircraft}
              onChange={(e) => setAircraft(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="A20N">Airbus A320neo (A20N)</option>
              <option value="A320">Airbus A320-200 (A320)</option>
              <option value="AT46">ATR 42-600 (AT46)</option>
              <option value="AT76">ATR 72-600 (AT76)</option>
            </select>
          </div>

          {/* Flight Number */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Flight Number (Optional)
            </label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
        </motion.div>

        {/* Route Preview */}
        {departure && arrival && (
          <motion.div variants={fadeInUp} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase mb-4 text-center">Route Preview</div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-right flex-1">
                 <span className="font-black text-slate-800 text-3xl block">
                   {departure.toUpperCase() || '????'}
                 </span>
                 <span className="text-slate-500 font-medium text-xs">
                   {depInfo ? depInfo?.city : 'Custom Location'}
                 </span>
              </div>
              <div className="w-32 flex flex-col items-center">
                <div className="w-full h-0.5 bg-slate-200 relative mt-3 mb-2">
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-slate-300 bg-white"></div>
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-slate-300 bg-white"></div>
                </div>
                <Plane className="w-5 h-5 text-sky-cyan bg-slate-50 px-1 -mt-5 mb-1 z-10" />
                <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{aircraft}</span>
              </div>
              <div className="text-left flex-1">
                 <span className="font-black text-slate-800 text-3xl block">
                   {arrival.toUpperCase() || '????'}
                 </span>
                 <span className="text-slate-500 font-medium text-xs">
                   {arrInfo ? arrInfo?.city : 'Custom Location'}
                 </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Button */}
        <motion.div variants={fadeInUp} className="mt-auto pt-6 flex flex-col items-center">
          <button
            onClick={handleCreate}
            disabled={creating || departure.length < 3 || arrival.length < 3}
            data-tutorial="freeroam-generate"
            className="w-full md:w-2/3 flex items-center justify-center gap-3 py-4 bg-sky-cyan text-sky-navy hover:bg-[#3bb8df] disabled:opacity-50 disabled:cursor-not-allowed font-black tracking-wider text-sm rounded-xl shadow-lg shadow-sky-cyan/20 transition-all border border-sky-cyan"
          >
            {creating ? <span className="animate-spin text-lg">⏳</span> : <Plane className="w-5 h-5" />}
            {creating ? 'GENERATING...' : 'GENERATE SIMBRIEF OFP'}
          </button>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium flex items-center gap-2">
            <Globe className="w-3 h-3 text-sky-cyan" />
            Opens SimBrief to generate plan, then imports it here automatically.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
