import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { DataService, ActiveFlight } from '../services/dataService'
import { Plane, Navigation, Globe } from 'lucide-react'

// Fix generic Leaflet icon issue in Webpack/Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Custom Plane Icon
const createPlaneIcon = (heading: number) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${heading - 45}deg); font-size: 24px;">✈️</div>`,
    className: 'plane-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
}

export const LiveMap = () => {
  const [flights, setFlights] = useState<ActiveFlight[]>([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<L.Map>(null)

  const fetchTraffic = async () => {
    const data = await DataService.getActiveFlights()
    setFlights(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTraffic()
    const interval = setInterval(fetchTraffic, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Live Operations Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time traffic of all Sky Express pilots currently airborne.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {flights.length} PILOTS ONLINE
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[38.0, 24.0]} // Center on Greece
          zoom={6}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {flights.map((flight) => (
            <Marker
              key={flight.id}
              position={[flight.latitude, flight.longitude]}
              icon={createPlaneIcon(flight.heading)}
            >
              <Popup>
                <div className="min-w-[200px] font-sans">
                  <div className="border-b pb-2 mb-2 flex justify-between items-center">
                    <span className="font-bold text-blue-800 text-lg">{flight.flight_number}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {flight.phase || 'Enroute'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {flight.pilot?.avatar_url ? (
                      <img src={flight.pilot.avatar_url} className="w-8 h-8 rounded-full border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">👤</div>
                    )}
                    <div>
                      <div className="font-bold text-sm text-gray-800">{flight.pilot?.callsign || 'Unknown'}</div>
                      <div className="text-[10px] text-gray-500">Rank: {flight.pilot?.rank}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">ROUTE</span>
                      <span className="font-mono font-bold">{flight.departure} ➝ {flight.arrival}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">AIRCRAFT</span>
                      <span className="font-bold">{flight.aircraft}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">ALTITUDE</span>
                      <span className="font-bold">{flight.altitude} ft</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">SPEED</span>
                      <span className="font-bold">{flight.speed} kts</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-gray-400 text-right">
                    Last updated: {new Date(flight.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}
