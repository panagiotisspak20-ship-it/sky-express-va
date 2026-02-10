import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, Plane, RefreshCw } from 'lucide-react'
import { supabase } from '../services/supabase'
import { SkyLoader } from '../components/ui/SkyLoader'

import { useNavigate } from 'react-router-dom'

interface Flight {
    id: string
    flight_number: string
    dep_icao: string
    arr_icao: string
    departure_time: string
    arrival_time: string
    aircraft_type: string
    duration: number
    status: string
}

export const FlightBoard = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'schedule' | 'real-world'>('real-world')
    const [flights, setFlights] = useState<Flight[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [lastError, setLastError] = useState<string | null>(null)

    // Use local date for default selection to avoid "tomorrow/yesterday" confusion from UTC
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })

    useEffect(() => {
        fetchFlights()
    }, [activeTab, selectedDate])

    const fetchFlights = async () => {
        setLoading(true)
        setLastError(null)
        try {
            if (activeTab === 'real-world') {
                // Fetch from our new Sync Table
                // Explicitly use UTC range for the day query
                const { data, error } = await supabase
                    .from('flight_schedules')
                    .select('*')
                    .gte('departure_time', `${selectedDate}T00:00:00Z`)
                    .lt('departure_time', `${selectedDate}T23:59:59Z`)
                    .order('departure_time', { ascending: true })

                if (error) {
                    setLastError(error.message)
                    throw error
                }
                setFlights(data || [])
            } else {
                // Placeholder for original mocked schedule or user specific schedule
                setFlights([])
            }
        } catch (err: any) {
            console.error('Error fetching flights:', err)
            setLastError(err.message || 'Unknown Error')
        } finally {
            setLoading(false)
        }
    }

    const handleDispatch = (flight: Flight) => {
        // Navigate to dispatch with flight details
        navigate('/dispatch', {
            state: {
                flightNumber: flight.flight_number,
                departure: flight.dep_icao,
                arrival: flight.arr_icao,
                aircraft: flight.aircraft_type
            }
        })
    }

    return (
        <div className="flex-1 h-full bg-[#f0f0f0] flex flex-col font-tahoma text-[#333] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-md z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold italic tracking-wider flex items-center gap-2">
                            <Plane className="w-6 h-6" />
                            FLIGHT OPERATIONS
                        </h1>
                        <p className="text-xs text-blue-200 opacity-80 uppercase tracking-widest">
                            Sky Express Virtual • Real-World Schedules
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('real-world')}
                            className={`px-4 py-2 rounded text-xs font-bold transition-all ${activeTab === 'real-world'
                                ? 'bg-blue-500 text-white shadow-lg scale-105'
                                : 'bg-blue-800/50 text-blue-200 hover:bg-blue-700'
                                }`}
                        >
                            REAL WORLD (LIVE)
                        </button>
                        {/* We can hide the other tab for now or repurpose it */}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-2 bg-blue-950/30 p-2 rounded backdrop-blur-sm border border-blue-500/30">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
                        <input
                            type="text"
                            placeholder="Search Flight Number, ICAO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-blue-900/50 border border-blue-500/30 rounded pl-9 pr-2 py-1.5 text-xs text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 transition-colors"
                        />
                    </div>
                    <div className="relative w-40">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-blue-900/50 border border-blue-500/30 rounded pl-9 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={fetchFlights}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        REFRESH
                    </button>
                </div>
            </div>

            {/* Flight List */}
            <div className="flex-1 overflow-y-auto p-4 content-start grid gap-2">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <SkyLoader text="Loading Flight Schedule..." />
                    </div>
                ) : flights.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Plane className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-bold text-gray-600">No Flights Found</h2>
                        <p className="text-sm">Try selecting a different date or refreshing the schedule.</p>
                        {lastError && (
                            <p className="text-xs mt-2 text-red-500 font-bold">
                                Error: {lastError}
                            </p>
                        )}
                        {activeTab === 'real-world' && !lastError && (
                            <p className="text-xs mt-2 text-blue-600">
                                (Admin needs to run Sync from Dashboard to populate data)
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {flights
                            .filter(f =>
                                searchTerm === '' ||
                                f.flight_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                f.dep_icao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                f.arr_icao.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((flight) => (
                                <motion.div
                                    key={flight.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border-l-4 border-blue-600 p-3 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16">
                                            <span className="block text-lg font-bold text-blue-900 leading-none">{flight.flight_number}</span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{flight.aircraft_type}</span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <span className="block text-xl font-mono text-gray-800 font-bold leading-none">
                                                    {new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-lg font-bold text-blue-600">{flight.dep_icao}</span>
                                            </div>
                                            <div className="flex flex-col items-center px-4">
                                                <span className="text-[10px] text-gray-400 font-bold">{flight.duration}m</span>
                                                <div className="w-24 h-0.5 bg-gray-200 relative my-1">
                                                    <Plane className="w-3 h-3 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                                                </div>
                                                <span className="text-[9px] text-green-600 font-bold uppercase">Scheduled</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-xl font-mono text-gray-800 font-bold leading-none">
                                                    {new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-lg font-bold text-blue-600">{flight.arr_icao}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDispatch(flight)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded text-xs font-bold shadow transition-all transform group-hover:scale-105"
                                    >
                                        DISPATCH
                                    </button>
                                </motion.div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    )
}
