import { useState, useEffect, useCallback } from 'react'
import { Megaphone, X } from 'lucide-react'
import { DataService, SystemAnnouncement } from '../services/dataService'
import { supabase } from '../services/supabase'

export function AnnouncementBanner(): React.ReactElement | null {
    const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    const fetchAnnouncements = useCallback(async (): Promise<void> => {
        try {
            const data = await DataService.getActiveAnnouncements()
            setAnnouncements(data)
            if (data.length > 0) setIsVisible(true)
        } catch (error) {
            console.error('Failed to fetch announcements:', error)
        }
    }, [])

    useEffect(() => {
        // Initial fetch
        fetchAnnouncements()

        // Realtime subscription for instant updates
        const channel = supabase
            .channel('system-announcements-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_announcements' },
                () => {
                    fetchAnnouncements()
                }
            )
            .subscribe()

        // Fallback: also poll every 30 seconds in case realtime is not enabled
        const interval = setInterval(fetchAnnouncements, 30 * 1000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [fetchAnnouncements])

    // Rotate messages every 10 seconds if multiple
    useEffect(() => {
        if (announcements.length <= 1) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length)
        }, 10000)

        return () => clearInterval(timer)
    }, [announcements.length])

    if (!isVisible || announcements.length === 0) return null

    const currentAnnouncement = announcements[currentIndex]

    const animationClass = announcements.length > 1 ? 'animate-fade-in' : ''

    return (
        <div className="bg-blue-600 text-white px-4 py-2 relative shadow-md z-50 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="bg-white/20 p-1 rounded-full shrink-0 animate-pulse">
                    <Megaphone className="w-4 h-4" />
                </div>
                <div className={`text-xs font-bold font-tahoma flex-1 truncate ${animationClass}`}>
                    <span className="uppercase opacity-70 mr-2 border-r border-white/30 pr-2">
                        System Broadcast
                    </span>
                    {currentAnnouncement.message}
                    {announcements.length > 1 && (
                        <span className="ml-2 text-[10px] opacity-50 font-normal">
                            ({currentIndex + 1}/{announcements.length})
                        </span>
                    )}
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="text-white/70 hover:text-white hover:bg-white/20 p-1 rounded transition-colors ml-2"
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
