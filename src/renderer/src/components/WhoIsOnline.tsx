import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, Plane } from 'lucide-react'
import { DataService, OnlineUser, ActiveFlight } from '../services/dataService'

export const WhoIsOnline = () => {
  const [onlinePilots, setOnlinePilots] = useState<ActiveFlight[]>([]) // Actually flying
  const [appUsers, setAppUsers] = useState<OnlineUser[]>([]) // Just online in app
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING')
  const [isExpanded, setIsExpanded] = useState(false)

  // Helper to fetch flights
  const fetchFlying = async () => {
    const data = await DataService.getActiveFlights()
    if (data) {
      setOnlinePilots(data)
    }
  }

  useEffect(() => {
    // 1. Initial Fetch
    fetchFlying()

    // 2. Poll for flying pilots every 30s (fallback)
    const interval = setInterval(fetchFlying, 30000)

    // 3. Real-time Flight Updates (New!)
    const flightChannel = DataService.subscribeToActiveFlights(() => {
      console.log('[WhoIsOnline] Flight data changed, refreshing...')
      fetchFlying()
    })

    // 4. Subscribe to Presence (App Online)
    try {
      // @ts-ignore - Supabase types can be tricky
      DataService.subscribeToPresence(
        (users: OnlineUser[]) => {
          setAppUsers(users)
        },
        (status) => {
          setConnectionStatus(status)
        }
      )
    } catch (e) {
      console.error('Presence Error:', e)
      setConnectionStatus('ERROR')
    }

    return () => {
      clearInterval(interval)
      DataService.unsubscribeFromPresence()
      if (flightChannel) DataService.unsubscribe(flightChannel)
    }
  }, [])

  // Merge lists for display
  const uniqueUsers = Array.from(
    new Set([
      ...appUsers.map((u) => u.callsign),
      ...onlinePilots.map((p) => p.pilot?.callsign || '')
    ])
  )
    .filter(Boolean)
    .map((callsign) => {
      const flight = onlinePilots.find((p) => p.pilot?.callsign === callsign)
      const presence = appUsers.find((u) => u.callsign === callsign)

      // Prefer flight data if available, else presence data
      return {
        callsign,
        isFlying: !!flight,
        flightData: flight,
        presenceData: presence,
        // Fallback for avatar/rank if not flying
        avatar_url: flight?.pilot?.avatar_url || presence?.avatar_url,
        rank: flight?.pilot?.rank || presence?.rank
      }
    })

  const onlineCount = uniqueUsers.length

  return (
    <div className="relative border border-slate-200/60 bg-white rounded-2xl shadow-sm overflow-hidden shrink-0 transition-shadow hover:shadow-md">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 transition-colors text-slate-700 bg-white relative z-10 outline-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 flex items-center justify-center bg-sky-50 rounded-lg text-sky-500 shrink-0">
            <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[11px] whitespace-nowrap truncate text-slate-700">
            WHO'S ONLINE <span className="text-slate-400 font-medium ml-0.5">({onlineCount})</span>
          </span>
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-sm ${
              connectionStatus === 'SUBSCRIBED'
                ? 'bg-emerald-500 shadow-emerald-500/40' // Green for App online presence
                : connectionStatus === 'CHANNEL_ERROR' || connectionStatus === 'ERROR'
                  ? 'bg-red-500 shadow-red-500/40' // Red for disconnected
                  : 'bg-amber-500 shadow-amber-500/40'
            }`}
            title={`Status: ${connectionStatus}`}
          />
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </motion.div>
      </button>

      {/* Collapsible Content (Expands Down) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full bg-slate-50/50 border-t border-slate-100 overflow-hidden"
          >
            {onlineCount === 0 ? (
              <div className="text-center py-5 text-slate-400 text-xs font-medium">No pilots online</div>
            ) : (
              <div className="space-y-1 p-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                {uniqueUsers.map((user) => (
                  <div
                    key={user.callsign}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200 cursor-pointer group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.callsign}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sky-600 font-black bg-sky-50 text-[10px] tracking-tight">
                            {user.callsign.substring(0, 3)}
                          </div>
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.isFlying ? 'bg-sky-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-emerald-500'}`}
                      ></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[13px] truncate group-hover:text-sky-600 transition-colors">
                          {user.callsign}
                        </span>
                        {user.isFlying && <Plane className="w-3.5 h-3.5 text-sky-500" strokeWidth={2.5} />}
                      </div>
                      <div className="text-[11px] flex items-center gap-1.5 truncate mt-0.5 font-medium">
                        <span className={user.isFlying ? 'text-sky-600 font-semibold' : 'text-slate-400'}>
                          {user.isFlying ? 'Flying' : 'Online'}
                        </span>
                        {user.isFlying && user.flightData && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="truncate text-slate-500">
                              {user.flightData?.departure} ➝ {user.flightData?.arrival}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
