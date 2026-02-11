import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Clock, Plane } from 'lucide-react'
import { supabase } from '../services/supabase'
import { WeatherService } from '../services/weatherService'

// Component for Airport Popup with Live METAR
const AirportPopup = ({ airport }: { airport: any }) => {
  const [metar, setMetar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    WeatherService.getMetar(airport.icao).then((data) => {
      if (mounted) {
        setMetar(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [airport.icao])

  return (
    <div className="text-xs w-64 font-tahoma">
      <div className="font-bold text-blue-800 text-sm border-b border-gray-300 pb-1 mb-2">
        {airport.iata} / {airport.icao}
        <span className="text-gray-500 font-normal ml-2">{airport.city}</span>
      </div>

      <div className="font-semibold mb-1">{airport.name}</div>

      {/* METAR Display */}
      <div className="bg-gray-100 border border-gray-300 p-2 font-mono text-[10px] break-words text-gray-700 leading-tight mb-2">
        {loading ? (
          <span className="text-gray-500 italic flex items-center gap-1">
            <span className="animate-spin">⌛</span> Loading Live METAR...
          </span>
        ) : (
          metar || 'METAR UNAVAILABLE'
        )}
      </div>

      {airport.hub && (
        <div className="text-orange-600 font-bold text-[10px] uppercase flex items-center gap-1">
          <span>★</span> Sky Express Hub
        </div>
      )}
    </div>
  )
}

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom Icon for Other Pilots
const OtherPilotIcon = L.divIcon({
  html: `<div style="color: #d63384; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#d63384" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 22 12 18 2 22 12 2"></polygon></svg></div>`,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
})

L.Marker.prototype.options.icon = DefaultIcon

// Sky Express Destinations - Complete Network
import { skyExpressAirports } from '../services/airportDatabase'

interface FlightEvent {
  time: string
  description: string
  type: 'info' | 'alert' | 'success'
}

export const LiveMap = () => {
  const [planePos, setPlanePos] = useState<[number, number] | null>(null)
  const [connected, setConnected] = useState(false)
  const [flightData, setFlightData] = useState<any>(null)
  const [events, setEvents] = useState<FlightEvent[]>([])

  // Online Multiplayer State
  const [otherPilots, setOtherPilots] = useState<any[]>([])
  const myRef = useRef<any>(null)

  // Tracking State
  const [lastGearState, setLastGearState] = useState(false)
  const [lastFlapState, setLastFlapState] = useState(0)

  // Initial Center (Greece)
  const center: [number, number] = [38.5, 24.5]

  // Mock ETA for Lateness Calc
  const [scheduledArrival] = useState(() => new Date(Date.now() + 30 * 60000))
  const [lateness, setLateness] = useState<string>('ON TIME')

  const logEvent = (time: string, desc: string, type: 'info' | 'alert' | 'success') => {
    setEvents((prev) => [{ time, description: desc, type }, ...prev].slice(0, 50))
  }

  // Fetch initial online pilots
  useEffect(() => {
    const fetchPilots = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('is_online', true)
      if (data) setOtherPilots(data)
    }

    fetchPilots()

    // Subscribe to changes
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        const updated = payload.new as any
        const { user } = myRef.current || {}

        // If update is me, ignore (I have my local smooth data)
        if (updated.id === user?.id) return

        setOtherPilots((prev) => {
          // Remove if offline or old
          if (!updated.is_online) return prev.filter((p) => p.id !== updated.id)

          // Update or Add
          const index = prev.findIndex((p) => p.id === updated.id)
          if (index >= 0) {
            const newArr = [...prev]
            newArr[index] = updated
            return newArr
          } else {
            return [...prev, updated]
          }
        })
      })
      .subscribe()

    // Get my user ID for filtering
    supabase.auth.getUser().then(({ data }) => {
      myRef.current = { user: data.user }
    })

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  // Broadcast My Position
  useEffect(() => {
    if (!connected || !planePos || !flightData) return

    const broadcast = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('profiles')
        .update({
          current_location: { lat: planePos[0], lng: planePos[1] },
          heading: Math.round(flightData.heading),
          altitude: Math.round(flightData.altitude),
          speed: Math.round(flightData.speed),
          is_online: true,
          last_seen: new Date().toISOString()
        } as any)
        .eq('id', user.id)
    }

    const interval = setInterval(broadcast, 5000) // 5 seconds
    return () => clearInterval(interval)
  }, [connected, planePos, flightData])

  useEffect(() => {
    // MSFS Data Listener
    // @ts-ignore -- MSFS API injected by Electron preload
    if (window.api && window.api.msfs) {
      // @ts-ignore -- msfs.onData signature
      window.api.msfs.onData((data) => {
        if (data.latitude && data.longitude) {
          setPlanePos([data.latitude, data.longitude])
          setFlightData(data)

          const time = new Date().toLocaleTimeString('en-GB', { hour12: false })

          // Gear Check
          if (data.gear_handle && !lastGearState) {
            logEvent(time, 'LANDING GEAR EXTENDED', 'info')
            setLastGearState(true)
          } else if (!data.gear_handle && lastGearState) {
            logEvent(time, 'LANDING GEAR RETRACTED', 'info')
            setLastGearState(false)
          }

          // Flaps Check
          if (data.flaps_handle_index !== lastFlapState) {
            if (data.flaps_handle_index > lastFlapState) {
              logEvent(time, `FLAPS EXTENDED TO POSITION ${data.flaps_handle_index}`, 'info')
            }
            setLastFlapState(data.flaps_handle_index)
          }
        }
      })
      // @ts-ignore -- msfs.onStatus signature
      window.api.msfs.onStatus((status) => {
        setConnected(status)
        if (status) logEvent(new Date().toLocaleTimeString(), 'ACARS LINK ESTABLISHED', 'success')
      })
    }

    // Timer for Lateness
    const timer = setInterval(() => {
      if (!connected) return
      const now = new Date()
      const diffMins = Math.round((now.getTime() - scheduledArrival.getTime()) / 60000)

      if (diffMins > 10) {
        setLateness(`DELAYED (+${diffMins}m)`)
      } else if (diffMins < -10) {
        setLateness(`EARLY (${Math.abs(diffMins)}m)`)
      } else {
        setLateness('ON TIME')
      }
    }, 30000)

    return () => {
      clearInterval(timer)
      // Remove all listeners on unmount
      // @ts-ignore
      if (window.api && window.api.msfs && window.api.msfs.removeListeners) {
        // @ts-ignore
        window.api.msfs.removeListeners()
      }
    }
  }, [lastGearState, lastFlapState, connected, scheduledArrival])

  return (
    <div className="p-2 h-full flex flex-row gap-2 font-tahoma bg-[#f0f0f0]">
      {/* Left Side: Map & Telemetry */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-1 px-1">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-bold text-[#333] uppercase">Sky Express Network</h2>
          </div>
          <div
            className={`flex items-center gap-2 px-2 py-0.5 border ${connected ? 'bg-green-100 border-green-600' : 'bg-red-100 border-red-600'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}
            ></div>
            <span className="font-bold text-xs text-[#333]">
              {connected ? 'ACARS ONLINE' : 'ACARS OFFLINE'}
            </span>
          </div>
        </div>

        {/* Flight Data Ribbon */}
        <div className="legacy-panel mb-2 flex gap-4 bg-[#e1e1e1] py-1">
          <div className="flex flex-col border-r border-gray-400 pr-4">
            <span className="text-[9px] font-bold text-gray-600">ALTITUDE</span>
            <span className="font-mono font-bold text-blue-900">
              {connected ? Math.round(flightData?.altitude || 0) : '-----'} ft
            </span>
          </div>
          <div className="flex flex-col border-r border-gray-400 pr-4">
            <span className="text-[9px] font-bold text-gray-600">GROUND SPEED</span>
            <span className="font-mono font-bold text-blue-900">
              {connected ? Math.round(flightData?.speed || 0) : '---'} kts
            </span>
          </div>
          <div className="flex flex-col border-r border-gray-400 pr-4">
            <span className="text-[9px] font-bold text-gray-600">HEADING</span>
            <span className="font-mono font-bold text-blue-900">
              {connected ? Math.round(flightData?.heading || 0) : '---'}°
            </span>
          </div>
          <div className="flex flex-col border-r border-gray-400 pr-4">
            <span className="text-[9px] font-bold text-gray-600">SCHEDULE</span>
            <span
              className={`font-mono font-bold ${lateness.includes('DELAYED') ? 'text-red-600' : 'text-green-700'}`}
            >
              {lateness}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-600">AIRPORTS</span>
            <span className="font-bold text-purple-700">
              {skyExpressAirports.length} destinations
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 inset-box relative" data-tutorial="live-map">
          <MapContainer
            center={center}
            zoom={6}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution="&copy; Esri World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Sky Express Airport Markers */}
            {skyExpressAirports.map((airport) => (
              <CircleMarker
                key={airport.icao}
                center={[airport.lat, airport.lng]}
                radius={airport.hub ? 8 : 5}
                fillColor={airport.hub ? '#ff6b00' : '#00a8e8'}
                color={airport.hub ? '#cc5500' : '#0077b3'}
                weight={2}
                opacity={1}
                fillOpacity={0.8}
              >
                <Popup>
                  <AirportPopup airport={airport} />
                </Popup>
              </CircleMarker>
            ))}

            {/* Other Pilots Markers */}
            {otherPilots.map((pilot) => {
              if (!pilot.current_location) return null
              const pos: [number, number] = [pilot.current_location.lat, pilot.current_location.lng]
              return (
                <Marker key={pilot.id} position={pos} icon={OtherPilotIcon}>
                  <Popup>
                    <div className="text-xs font-tahoma">
                      <div className="font-bold text-[#d63384] text-sm uppercase">
                        {pilot.callsign}
                      </div>
                      <div className="text-gray-600 font-bold mb-1">Sky Express Pilot</div>
                      <div>Alt: {pilot.altitude || 0} ft</div>
                      <div>Spd: {pilot.speed || 0} kts</div>
                      <div>Hdg: {pilot.heading || 0}°</div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {/* Live Plane Marker */}
            {planePos && (
              <Marker position={planePos}>
                <Popup>
                  <strong>My Aircraft</strong>
                  <br />
                  Alt: {Math.round(flightData?.altitude || 0)} ft
                  <br />
                  Hdg: {Math.round(flightData?.heading || 0)}°<br />
                  GS: {Math.round(flightData?.speed || 0)} kts
                </Popup>
              </Marker>
            )}
          </MapContainer>
          <div className="absolute top-2 left-2 bg-white/95 px-2 py-1 text-[10px] border border-gray-500 z-[1000] font-mono shadow-sm">
            <span className="text-orange-600 font-bold">●</span> HUB
            <span className="ml-2 text-blue-500 font-bold">●</span> DESTINATION
            <span className="ml-2 text-[#d63384] font-bold">✈</span> PILOT
          </div>
        </div>
      </div>

      {/* Right Side: Event Log */}
      <div className="w-64 flex flex-col">
        <div className="bg-[#3a6ea5] text-white px-2 py-1 font-bold text-[11px] flex items-center gap-2 border border-blue-900">
          <Clock className="w-3 h-3" /> FLIGHT LOG
        </div>
        <div className="flex-1 inset-box bg-white overflow-y-auto p-1">
          {events.length === 0 ? (
            <div className="text-center text-gray-400 text-xs mt-4 italic">No events recorded.</div>
          ) : (
            <div className="space-y-1">
              {events.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 text-[10px] border-b border-dotted border-gray-300 pb-1"
                >
                  <span className="font-mono text-gray-500 min-w-[45px]">{evt.time}</span>
                  <span
                    className={`font-mono ${evt.type === 'alert' ? 'text-red-600 font-bold' : evt.type === 'success' ? 'text-green-700 font-bold' : 'text-gray-800'}`}
                  >
                    {evt.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
