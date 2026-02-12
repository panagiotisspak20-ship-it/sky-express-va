import { useState, useEffect } from 'react'
import { Plane, Trash2, Download, ArrowUpCircle, Sparkles } from 'lucide-react'
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

  // Update state
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

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

    // Listen for app updates
    let cleanupUpdateAvailable: (() => void) | undefined
    let cleanupUpdateDownloaded: (() => void) | undefined
    let cleanupDownloadProgress: (() => void) | undefined
    // @ts-ignore - window.api may not exist in dev
    if (window.api && window.api.updater) {
      // @ts-ignore
      cleanupUpdateAvailable = window.api.updater.onUpdateAvailable(() => {
        setUpdateAvailable(true)
      })
      // @ts-ignore
      cleanupDownloadProgress = window.api.updater.onDownloadProgress((progress: any) => {
        setDownloadProgress(progress.percent || 0)
      })
      // @ts-ignore
      cleanupUpdateDownloaded = window.api.updater.onUpdateDownloaded(() => {
        setUpdateDownloaded(true)
        setIsDownloading(false)
      })
      // Auto-check for updates on mount
      // @ts-ignore
      window.api.updater.checkForUpdates()
    }

    return () => {
      if (cleanup) cleanup()
      if (cleanupUpdateAvailable) cleanupUpdateAvailable()
      if (cleanupUpdateDownloaded) cleanupUpdateDownloaded()
      if (cleanupDownloadProgress) cleanupDownloadProgress()
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
      {/* Header Area */}
      {/* Header Area */}
      <div className="relative rounded-xl mb-4 shadow-md transition-all duration-300 z-50">
        {/* Background Layer (Clipped) */}
        <div className={`absolute inset-0 rounded-xl overflow-hidden -z-10 ${profile?.equipped_background || 'bg-white/50 border-b-2 border-white'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${profile?.equipped_background ? 'opacity-50' : 'opacity-100'}`} />
          <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12 pointer-events-none">
            <Sparkles className={`w-32 h-32 ${profile?.equipped_background ? 'text-white' : 'text-blue-900'}`} />
          </div>
        </div>

        {/* Content Container (Visible Overflow) */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl shadow-md overflow-hidden relative group transition-all duration-300 ${profile?.equipped_frame || 'border-2 border-white'}`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${profile?.equipped_background || 'bg-slate-200'}`}>
                  <Plane className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tighter leading-none mb-1 drop-shadow-md">
                Pilot Dashboard
              </h1>
              <p className="text-xs font-medium flex items-center gap-1 drop-shadow-sm opacity-90">
                Welcome, <span className={`font-bold text-lg ${profile?.equipped_color || 'text-blue-800'}`}>
                  {profile?.callsign || 'Pilot'}
                </span>
                <span className="text-[10px] bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/30 ml-2 shadow-sm">
                  {profile?.rank || 'Cadet'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Update Available Button */}
            {updateAvailable && (
              <button
                onClick={() => {
                  if (updateDownloaded) {
                    // @ts-ignore
                    window.api?.updater?.quitAndInstall()
                  } else if (!isDownloading) {
                    setIsDownloading(true)
                    // @ts-ignore
                    window.api?.updater?.downloadUpdate()
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded shadow-md transition-all ${updateDownloaded
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : isDownloading
                    ? 'bg-blue-500 text-white cursor-wait'
                    : 'bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white animate-pulse'
                  }`}
              >
                {updateDownloaded ? (
                  <>
                    <ArrowUpCircle className="w-3.5 h-3.5" /> INSTALL NOW
                  </>
                ) : isDownloading ? (
                  <>
                    <Download className="w-3.5 h-3.5 animate-bounce" /> {Math.round(downloadProgress)}
                    %
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> UPDATE AVAILABLE
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => navigate('/flights')}
              className="btn-classic flex items-center gap-1 active:bg-gray-300"
            >
              <Plane className="w-3 h-3" /> Flight Dispatch
            </button>

            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Next Flight Card (Only if booked) */}
      {nextFlight && (
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
      )}

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
              <span>METAR / WEATHER ({weather?.location || 'LGAV'})</span>
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
                  <span className="font-mono text-green-700">
                    {weather?.visibility
                      ? weather.visibility >= 10000
                        ? '10km+'
                        : (weather.visibility / 1000).toFixed(1) + 'km'
                      : '10km+'}
                  </span>
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
    </div>
  )
}
