import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { DataService } from '../services/dataService'
import { useState, useEffect } from 'react'

export const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const [userCallsign, setUserCallsign] = useState('Loading...')
  const [userColor, setUserColor] = useState('')
  const [msfsConnected, setMsfsConnected] = useState(false)

  useEffect(() => {
    DataService.getProfile().then((p) => {
      if (p) {
        if (p.callsign) setUserCallsign(p.callsign)
        if (p.equipped_color) setUserColor(p.equipped_color)
      }
    })

    let cleanup: (() => void) | undefined

    // Listen for MSFS status
    // @ts-ignore
    if (window.api && window.api.msfs) {
      // @ts-ignore
      window.api.msfs.getStatus().then((status: boolean) => {
        setMsfsConnected(status)
      })
      // @ts-ignore
      cleanup = window.api.msfs.onStatus((status: boolean) => {
        setMsfsConnected(status)
      })
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  const handleLogout = async () => {
    await DataService.logout()
    navigate('/login')
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-pink-50/30 overflow-hidden font-sans">
      {/* Sidebar with high z-index to ensure clickability */}
      <div className="z-50 relative h-full">
        <Sidebar onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white relative z-0">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-slate-50 p-1">
          <Outlet />
        </main>

        {/* Status Bar - Sky Express themed (Navy + Pink) */}
        <footer className="status-bar h-7 bg-gradient-to-r from-[#1a365d] to-[#2c5282] border-t border-[#1a365d] flex items-center px-3 text-xs text-white select-none font-sans space-x-4">
          <div className="flex items-center gap-1 min-w-[80px] border-r border-[#2c5282] pr-3">
            <span className="font-semibold">Status:</span>
            <span className="text-slate-300">Ready</span>
          </div>
          <div className="flex items-center gap-1 border-r border-[#2c5282] pr-3 px-2">
            <span className="font-semibold">MSFS:</span>
            {msfsConnected ? (
              <span className="text-green-300 font-bold">Connected</span>
            ) : (
              <span className="text-pink-300">Offline</span>
            )}
          </div>
          <div className="flex items-center gap-1 border-r border-[#2c5282] pr-3 px-2">
            <span className="font-semibold">VATSIM:</span>
            <span className="text-slate-300">Offline</span>
          </div>
          <div className="flex-1"></div>
          <div className="pl-3 border-l border-[#2c5282] flex items-center gap-2">
            <span className="text-slate-300">Pilot:</span>
            <span className={`font-bold ${userColor || 'text-[#e879a8]'}`}>{userCallsign}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
