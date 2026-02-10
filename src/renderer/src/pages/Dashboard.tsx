import { useState, useEffect } from 'react'
import { Plane, Trash2 } from 'lucide-react'
import { DataService, PilotProfile } from '../services/dataService'
import { WeatherService } from '../services/weatherService'
import { useNavigate } from 'react-router-dom'
import { NotificationCenter } from '../components/NotificationCenter'
import { InteractiveGlobe } from '../components/ui/InteractiveGlobe'

export const Dashboard = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [weather, setWeather] = useState<any>(null)
  const [lastLanding, setLastLanding] = useState<{ rate: number; location: string } | null>(null)
  const [logbook, setLogbook] = useState<any[]>([])
  const [nextFlight, setNextFlight] = useState<any>(null)



  useEffect(() => {
    // Load Profile
    DataService.getProfile().then((p) => {
      setProfile(p)
    })

    // Load Next Booked Flight
    DataService.getBookedFlights().then((flights) => {
      const booked = flights.filter((f) => f.status === 'booked')
      if (booked.length > 0) {
        setNextFlight(booked[0]) // Show first booked flight
      }
    })

    // Load Logbook
    DataService.getFlightLog().then(setLogbook)

    // Load Weather
    WeatherService.getCurrentWeather(37.9363, 23.9444).then(setWeather)

    // Listen for Landing Reports
    let cleanup: (() => void) | undefined
    // @ts-ignore
    if (window.api && window.api.msfs) {
      // @ts-ignore
      cleanup = window.api.msfs.onLanding((report) => {
        setLastLanding(report)
      })
    }



    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // Helper for landing grade
  const getLandingGrade = (rate: number) => {
    if (rate > -100)
      return { text: 'BUTTER', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' }
    if (rate > -250)
      return { text: 'GOOD', color: 'text-green-500', bg: 'bg-green-50 border-green-200' }
    if (rate > -500)
      return { text: 'FIRM', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' }
    return { text: 'HARD', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  }

  return (
    <div className="p-4 h-full flex flex-col gap-4 font-tahoma bg-[#f0f0f0]">
      {/* Header Area */}
      <div className="flex justify-between items-end border-b-2 border-white pb-2 mb-2 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            Pilot Dashboard
          </h1>
          <p className="text-xs text-gray-600">
            Welcome, <span className="font-bold text-blue-800">{profile?.callsign || 'Pilot'}</span>{' '}
            (Rank: {profile?.rank})
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigate('/flights')}
            className="btn-classic flex items-center gap-1 active:bg-gray-300"
          >
            <Plane className="w-3 h-3" /> Flight Dispatch
          </button>

          <NotificationCenter />
        </div>
      </div>

      {/* Next Flight Card (Only if booked) */}
      {
        nextFlight && (
          <div className="bg-[#e3f2fd] border-l-4 border-blue-500 p-3 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">
                Next Booked Flight
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-[#333]">{nextFlight.flightNumber}</span>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-gray-700">
                    {nextFlight.departure} ➔ {nextFlight.arrival}
                  </span>
                  <span className="text-gray-500">
                    {nextFlight.aircraft} • Dep: {nextFlight.scheduledDeparture}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-classic bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                onClick={async () => {
                  if (confirm('Are you sure you want to cancel this booking?')) {
                    await DataService.deleteBookedFlight(nextFlight.id)
                    // Refresh
                    const flights = await DataService.getBookedFlights()
                    const booked = flights.filter((f) => f.status === 'booked')
                    setNextFlight(booked.length > 0 ? booked[0] : null)
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="btn-classic bg-white" onClick={() => navigate('/booked-flights')}>
                VIEW BOOKINGS
              </button>
            </div>
          </div>
        )
      }

      {/* Top Stats Row - "Inset" look */}
      <div className="grid grid-cols-4 gap-2 dashboard-stats">
        {[
          {
            label: 'FLIGHT HOURS',
            value: profile?.flightHours.toFixed(1) || '0.0',
            color: 'text-blue-900'
          },
          {
            label: 'BANK BALANCE',
            value: '€' + profile?.balance?.toLocaleString(),
            color: 'text-green-900'
          },
          { label: 'REPUTATION', value: profile?.reputation + '%', color: 'text-[#333]' },
          { label: 'VIRTUAL RANK', value: profile?.rank || 'Cadet', color: 'text-[#555]' }
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-[#e1e1e1] border border-[#a0a0a0] p-1 flex flex-col justify-between h-16"
          >
            <span className="text-[9px] font-bold text-[#666] px-1">{stat.label}</span>
            <div className="inset-box flex-1 flex items-center justify-end px-2 mx-1 mb-1 bg-white">
              <span className={`text-lg font-mono font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {/* Left Col: Operations / Weather */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Weather Panel */}
          <div className="legacy-panel flex-1 flex flex-col min-h-[200px]">
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-2 py-1 text-xs font-bold mb-2 flex justify-between items-center shadow-sm">
              <span>METAR / WEATHER (LGAV)</span>
              <span className="bg-blue-900 px-1 rounded text-[10px]">LIVE</span>
            </div>

            <div className="flex-1 bg-[#eef] border border-[#99b] inset-shadow p-3 flex gap-6 items-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#333] font-mono leading-none">
                  {weather ? Math.round(weather.temperature) : '--'}°
                </div>
                <div className="text-xs font-bold text-[#666] mt-1">
                  {weather?.condition || 'N/A'}
                </div>
              </div>

              <div className="h-full w-px bg-[#ccc]"></div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs flex-1">
                <div className="flex justify-between border-b border-[#ddd]">
                  <span className="font-bold text-[#555]">WIND:</span>
                  <span className="font-mono">
                    {weather ? Math.round(weather.windSpeed) + ' kts' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#ddd]">
                  <span className="font-bold text-[#555]">PRESSURE:</span>
                  <span className="font-mono">
                    {weather ? Math.round(weather.pressure) + ' hPa' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#ddd]">
                  <span className="font-bold text-[#555]">HUMIDITY:</span>
                  <span className="font-mono">{weather ? weather.humidity + '%' : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-[#ddd]">
                  <span className="font-bold text-[#555]">VISIBILITY:</span>
                  <span className="font-mono text-green-700">10km+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Landing Rate Panel */}
          <div className="legacy-panel h-[150px] flex flex-col">
            <div className="bg-[#ddd] text-[#333] px-2 py-1 text-xs font-bold mb-2 border-b border-white">
              LAST LANDING REPORT
            </div>
            {lastLanding ? (
              <div className="flex items-center justify-between px-4 h-full">
                <div>
                  <div className="text-xs text-[#555] font-bold">TOUCHDOWN V/S</div>
                  <div
                    className={`text-3xl font-mono font-bold ${getLandingGrade(lastLanding.rate).color.replace('text-', 'text-')}`}
                  >
                    {lastLanding.rate} fpm
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 border border-[#999] bg-[#f9f9f9] text-xs font-bold mb-1">
                    {getLandingGrade(lastLanding.rate).text}
                  </div>
                  <div className="text-[10px] text-[#666] font-mono">{lastLanding.location}</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#888] italic bg-[#f9f9f9] border border-dashed border-[#ccc] m-2">
                No landing data received from ACARS
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Flights & Globe */}
        <div className="legacy-panel flex flex-col h-full overflow-hidden relative">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
            <InteractiveGlobe className="-mt-20 -mr-20" />
          </div>
          <div className="bg-[#ddd] text-[#333] px-2 py-1 text-xs font-bold mb-2 border-b border-white z-10 relative">
            RECENT LOGBOOK ENTRIES
          </div>
          <div className="flex-1 overflow-y-auto bg-white/80 inset-box z-10 relative backdrop-blur-sm">
            <table className="w-full text-[10px] text-left border-collapse">
              <thead className="bg-[#e1e1e1] sticky top-0">
                <tr>
                  <th className="p-1 border-b border-gray-400">FLT</th>
                  <th className="p-1 border-b border-gray-400">DEP</th>
                  <th className="p-1 border-b border-gray-400">ARR</th>
                  <th className="p-1 border-b border-gray-400 text-right">$$</th>
                </tr>
              </thead>
              <tbody>
                {logbook.length > 0 ? (
                  logbook.slice(0, 5).map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                    >
                      <td className="p-1 font-bold">{entry.flightNumber}</td>
                      <td className="p-1">{entry.departure}</td>
                      <td className="p-1">{entry.arrival}</td>
                      <td className="p-1 text-right font-mono text-green-700">
                        €{entry.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-xs text-gray-500 italic">
                      No recent flights found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => navigate('/career')}
            className="btn-classic w-full mt-2 active:bg-gray-300"
          >
            VIEW FULL LOGBOOK
          </button>
        </div>
      </div>
    </div >
  )
}
