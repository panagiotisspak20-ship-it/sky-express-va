import { useState, useEffect } from 'react'
import { DataService, ActiveFlight } from '../services/dataService'
import { Users } from 'lucide-react'

export const WhoIsOnline = () => {
    const [onlinePilots, setOnlinePilots] = useState<ActiveFlight[]>([])

    const fetchOnline = async () => {
        const pilots = await DataService.getActiveFlights()
        setOnlinePilots(pilots)
    }

    useEffect(() => {
        fetchOnline()
        const interval = setInterval(fetchOnline, 30000) // 30s refresh
        return () => clearInterval(interval)
    }, [])

    if (onlinePilots.length === 0) return null

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Users className="w-3 h-3" />
                Who's Online ({onlinePilots.length})
            </div>
            <div className="space-y-1 px-2">
                {onlinePilots.map(pilot => (
                    <div key={pilot.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/50 hover:bg-slate-800 text-xs transition-colors">
                        <div className="relative">
                            {pilot.pilot?.avatar_url ? (
                                <img src={pilot.pilot.avatar_url} className="w-6 h-6 rounded-full border border-slate-600" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">👤</div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-200 truncate">{pilot.pilot?.callsign || 'Unknown'}</div>
                            <div className="text-slate-400 text-[10px] truncate">
                                {pilot.flight_number} • {pilot.phase || 'Flying'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
