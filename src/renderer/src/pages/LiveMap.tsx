import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { DataService, ActiveFlight } from '../services/dataService'
import { Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { pageVariants, slideDown } from '../utils/animations'

// Fix generic Leaflet icon issue in Webpack/Vite
// @ts-ignore Ignore leaflet types mismatch
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Custom Plane Icon for VA Pilots - Vibrant Magenta
const createPlaneIcon = (heading: number) => {
  return L.divIcon({
    html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="#c83296" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${heading - 45}deg); filter: drop-shadow(0px 0px 3px rgba(0,0,0,0.8));"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5.2-2.8 2.8-3.2-.8c-.4-.1-.8.1-1 .5L1 17l4.5 1.5L7 23l1.2-1c.4-.2.6-.6.5-1l-.8-3.2 2.8-2.8 5.2 6 l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>`,
    className: 'plane-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

// Custom Plane Icon for Vatsim Radar - Bright Amber
const createVatsimIcon = (heading: number) => {
  return L.divIcon({
    html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${heading - 45}deg); filter: drop-shadow(0px 0px 3px rgba(0,0,0,0.8));"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5.2-2.8 2.8-3.2-.8c-.4-.1-.8.1-1 .5L1 17l4.5 1.5L7 23l1.2-1c.4-.2.6-.6.5-1l-.8-3.2 2.8-2.8 5.2 6 l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>`,
    className: 'vatsim-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

export const LiveMap = () => {
  const [flights, setFlights] = useState<ActiveFlight[]>([])
  const [vatsimFlights, setVatsimFlights] = useState<any[]>([])
  const [showVatsim, setShowVatsim] = useState(false)
  const [loading, setLoading] = useState(true)
  const [vatsimLoading, setVatsimLoading] = useState(false)
  const mapRef = useRef<L.Map>(null)

  const fetchTraffic = async () => {
    try {
      const data = await DataService.getActiveFlights()
      setFlights(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVatsimTraffic = async (isBackground = false): Promise<void> => {
    if (!showVatsim) {
      setVatsimFlights([])
      return
    }
    try {
      if (!isBackground) setVatsimLoading(true)
      // Safety check: ensure backend exists
      if (!window.api || !window.api.vatsim || !window.api.vatsim.getAllPilots) {
        throw new Error(
          'Backend VATSIM service is not running. Please restart the application entirely.'
        )
      }

      // @ts-ignore Ignore API type for now
      const data = await window.api.vatsim.getAllPilots()

      // Safety check: ensure robust array
      if (!Array.isArray(data)) {
        throw new Error('Backend returned invalid VATSIM data')
      }

      setVatsimFlights(data)
    } catch (err: any) {
      console.error('Failed to fetch vatsim traffic', err)
      alert(`VATSIM Error: ${err.message || err.toString()}`)
      setShowVatsim(false)
    } finally {
      if (!isBackground) setVatsimLoading(false)
    }
  }

  useEffect(() => {
    fetchTraffic()
    const interval = setInterval(fetchTraffic, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchVatsimTraffic()
    const interval = setInterval(() => fetchVatsimTraffic(true), 17000) // Refresh VATSIM background every 17s
    return () => clearInterval(interval)
  }, [showVatsim])

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="h-full w-full relative font-sans overflow-hidden bg-slate-900"
    >
      {/* Full Bleed Map Container */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[38.0, 24.0]} // Center on Greece
          zoom={6}
          className="h-full w-full"
          zoomControl={false} // We will hide default zoom or let it render underneath
          ref={mapRef}
        >
          {/* Satellite Map Tiles */}
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {flights.map((flight) => (
            <Marker
              key={flight.id}
              position={[flight.latitude, flight.longitude]}
              icon={createPlaneIcon(flight.heading)}
            >
              <Popup className="sky-express-popup">
                <div className="w-[240px] font-sans p-1">
                  <div className="border-b border-slate-100 pb-3 mb-3 flex justify-between items-center">
                    <span className="font-extrabold text-blue-800 text-lg tracking-tight">
                      {flight.flight_number}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md shadow-sm uppercase">
                      {flight.phase || 'Enroute'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {flight.pilot?.avatar_url ? (
                      <img
                        src={flight.pilot.avatar_url}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover bg-white"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                        SE
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm text-slate-800 leading-tight">
                        {flight.pilot?.callsign || 'Unknown'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {flight.pilot?.rank}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-slate-700">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-slate-400 block text-[9px] font-black tracking-widest uppercase mb-0.5">
                        Route
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {flight.departure} ➝ {flight.arrival}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-slate-400 block text-[9px] font-black tracking-widest uppercase mb-0.5">
                        Aircraft
                      </span>
                      <span className="font-bold text-slate-800">{flight.aircraft}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-slate-400 block text-[9px] font-black tracking-widest uppercase mb-0.5">
                        Altitude
                      </span>
                      <span className="font-mono font-bold text-blue-600">
                        {flight.altitude.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-500">ft</span>
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <span className="text-slate-400 block text-[9px] font-black tracking-widest uppercase mb-0.5">
                        Speed
                      </span>
                      <span className="font-mono font-bold text-blue-600">
                        {flight.speed} <span className="text-[10px] text-slate-500">kts</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">
                    Updated: {new Date(flight.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* VATSIM Flights */}
          {showVatsim &&
            vatsimFlights.map((flight, idx) => {
              if (typeof flight.lat !== 'number' || typeof flight.lon !== 'number') return null

              return (
                <Marker
                  key={`vatsim-${flight.callsign || idx}`}
                  position={[flight.lat, flight.lon]}
                  icon={createVatsimIcon(flight.hdg || 0)}
                >
                  <Popup>
                    <div className="w-[180px] font-sans p-1">
                      <div className="border border-slate-200 flex justify-between items-center bg-slate-50 px-3 py-2 -mx-2 -mt-2 rounded-t-xl mb-3 shadow-sm">
                        <span className="font-black text-slate-700 text-xs uppercase tracking-wider">
                          VATSIM Network
                        </span>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded shadow-sm">
                          LIVE
                        </span>
                      </div>
                      <div className="font-black text-lg text-slate-800 mb-3 tracking-tight">
                        {flight.callsign || 'Unknown'}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700">
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-slate-400 block text-[8px] font-black tracking-widest uppercase">
                            Altitude
                          </span>
                          <span className="font-mono font-bold text-blue-600">
                            {(flight.alt || 0).toLocaleString()}{' '}
                            <span className="text-[8px] text-slate-500">ft</span>
                          </span>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-slate-400 block text-[8px] font-black tracking-widest uppercase">
                            Heading
                          </span>
                          <span className="font-mono font-bold text-blue-600">
                            {flight.hdg || 0}°
                          </span>
                        </div>
                        {(flight.dep || flight.arr) && (
                          <div className="col-span-2 mt-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-slate-400 block text-[8px] font-black tracking-widest uppercase mb-0.5">
                              Filed Route
                            </span>
                            <span className="font-mono font-bold text-slate-800 text-xs">
                              {flight.dep || 'N/A'} ➝ {flight.arr || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
        </MapContainer>
      </div>

      {/* Floating UI Elements Group */}
      <motion.div
        variants={slideDown}
        className="absolute top-6 left-6 right-6 z-[1000] flex flex-wrap items-center gap-4 pointer-events-none"
      >
        {/* Title Panel */}
        <div className="bg-white/90 backdrop-blur-md border border-white/50 p-4 pr-6 pl-4 rounded-[2rem] shadow-xl pointer-events-auto flex items-center gap-4 shrink-0 transition-all hover:shadow-2xl">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-600/30">
            <Globe className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
              Live Operations
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Sky Express Radar
            </p>
          </div>
        </div>

        {/* VA Pilots Counter */}
        <div className="bg-white/90 backdrop-blur-md h-[76px] px-6 rounded-[2rem] shadow-xl border border-white/50 flex items-center gap-4 pointer-events-auto shrink-0 transition-all hover:shadow-2xl">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-600 shadow-inner">
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse shadow-md shadow-emerald-500/50"></div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-2xl font-black text-slate-800 leading-none tracking-tight">
              {flights.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Sky Pilots
            </span>
          </div>
        </div>

        {/* VATSIM Toggle */}
        <label
          className={`backdrop-blur-md h-[76px] px-6 rounded-[2rem] cursor-pointer transition-all duration-300 shadow-xl pointer-events-auto border flex items-center gap-4 shrink-0 hover:shadow-2xl ${showVatsim ? 'bg-gradient-to-br from-indigo-500 to-blue-600 border-indigo-400 text-white shadow-indigo-500/40' : 'bg-white/90 border-white/50 text-slate-700 hover:bg-white'}`}
        >
          {vatsimLoading ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div
              className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-300 ${showVatsim ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 border border-slate-200'}`}
            >
              {showVatsim && <span className="text-sm font-black">✓</span>}
            </div>
          )}
          <div className="flex flex-col justify-center mr-2">
            <span className="text-[14px] font-black leading-none tracking-tight">VATSIM Radar</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-90`}>
              {showVatsim ? 'Network Active' : 'Offline'}
            </span>
          </div>
          {/* Invisible real checkbox */}
          <input
            type="checkbox"
            checked={showVatsim}
            onChange={(e) => setShowVatsim(e.target.checked)}
            className="hidden"
          />
        </label>
      </motion.div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[2000] pointer-events-auto">
          <div className="bg-white/90 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-5 border border-white/50 backdrop-blur-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-blue-600"></div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Establishing Uplink...
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
