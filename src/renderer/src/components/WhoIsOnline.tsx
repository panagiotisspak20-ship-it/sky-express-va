import { useEffect, useState } from 'react'
import { Users, ChevronUp, ChevronDown, Plane } from 'lucide-react'
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
        <div className="relative border-t border-pink-200 bg-white mt-auto">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-pink-50 transition-colors text-[#1a365d] bg-white relative z-10"
            >
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">WHO'S ONLINE ({onlineCount})</span>
                    <div
                        className={`w-2 h-2 rounded-full ${connectionStatus === 'SUBSCRIBED'
                            ? 'bg-green-500'
                            : connectionStatus === 'CHANNEL_ERROR' || connectionStatus === 'ERROR'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                        title={`Status: ${connectionStatus}`}
                    />
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Collapsible Content (Expands Down) */}
            {isExpanded && (
                <div className="w-full custom-scrollbar bg-white border-t border-pink-200 shadow-inner">
                    {onlineCount === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-sm italic">
                            No pilots online
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {uniqueUsers.map((user) => (
                                <div
                                    key={user.callsign}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-pink-50 transition-colors border border-transparent cursor-pointer group"
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.callsign}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-100 text-xs">
                                                    {user.callsign.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${user.isFlying ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}
                                        ></div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-[#1a365d] text-sm truncate group-hover:text-pink-600 transition-colors">
                                                {user.callsign}
                                            </span>
                                            {user.isFlying && (
                                                <Plane className="w-3 h-3 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                                            <span>{user.isFlying ? 'Flying' : 'Online'}</span>
                                            {user.isFlying && user.flightData && (
                                                <>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                    <span>
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
                </div>
            )}
        </div>
    )
}
