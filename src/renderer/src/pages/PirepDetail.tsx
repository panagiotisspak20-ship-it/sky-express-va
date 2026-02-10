import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'
import { DataService } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'

export const PirepDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [pirep, setPirep] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) loadPirep(id)
    }, [id])

    const loadPirep = async (flightId: string) => {
        setLoading(true)
        const data = await DataService.getPirep(flightId)
        setPirep(data)
        setLoading(false)
    }

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <SkyLoader text="Loading Report..." />
        </div>
    )
    if (!pirep) return <div className="p-4 text-center text-red-500">Report not found.</div>

    const evts = pirep.flight_events || []
    // Separate penalties from normal events if needed, but for now show all

    return (
        <div className="p-4 font-tahoma bg-[#f0f0f0] h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigate('/pireps')}
                    className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to Log
                </button>
                <span className="text-xs text-gray-500 font-mono">ID: {pirep.id.split('-')[0]}</span>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">

                {/* Top Summary Card */}
                <div className="legacy-panel bg-white p-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1a365d] mb-1">
                            PIREP: {pirep.flight_number}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                                {pirep.departure_icao} ➔ {pirep.arrival_icao}
                            </span>
                            <span>{pirep.aircraft_type}</span>
                            <span>•</span>
                            <span>{new Date(pirep.created_at).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 text-center">
                        <div className="p-2 border-r border-gray-200 pr-4">
                            <div className="text-3xl font-bold text-purple-700">{pirep.score}</div>
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Score</div>
                        </div>
                        <div className="p-2 border-r border-gray-200 pr-4">
                            <div className={`text-3xl font-bold ${Math.abs(pirep.landing_rate) < 200 ? 'text-green-600' : 'text-orange-600'}`}>
                                {pirep.landing_rate}
                            </div>
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Landing FPM</div>
                        </div>
                        <div className="p-2">
                            <div className="text-3xl font-bold text-blue-600">{pirep.flight_time}m</div>
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Duration</div>
                        </div>
                    </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Penalties & Events */}
                    <div className="legacy-panel bg-white p-0 overflow-hidden flex flex-col">
                        <div className="bg-red-50 border-b border-red-100 p-2 flex justify-between items-center">
                            <span className="text-xs font-bold text-red-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> FLIGHT EVENTS & PENALTIES
                            </span>
                            <span className="text-xs font-bold bg-red-200 text-red-800 px-2 rounded-full">
                                -{100 - pirep.score} pts
                            </span>
                        </div>
                        <div className="p-3 space-y-3 flex-1">
                            {evts.length === 0 && (
                                <div className="text-center text-gray-400 italic py-4">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                                    Perfect Flight! No events recorded.
                                </div>
                            )}
                            {evts.map((e: any, i: number) => (
                                <div key={i} className="flex gap-3 text-xs border-b border-gray-100 pb-2 last:border-0 relative">
                                    <div className="w-16 flex-shrink-0 text-gray-400 font-mono text-[10px] pt-0.5">
                                        {e.time}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold ${e.penalty > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                            {e.message}
                                        </p>
                                    </div>
                                    {e.penalty > 0 && (
                                        <div className="font-bold text-red-600">-{e.penalty}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Flight Stats */}
                    <div className="space-y-4">
                        <div className="legacy-panel bg-white p-3">
                            <h3 className="text-xs font-bold text-gray-700 mb-3 border-b pb-2">FLIGHT DATA</h3>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Max Bank Angle</span>
                                    <span className={`font-mono font-bold ${(pirep.max_bank || 0) > 30 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {Math.round(pirep.max_bank || 0)}°
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Max G-Force</span>
                                    <span className="font-mono font-bold">{(pirep.max_g || 1).toFixed(2)} G</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Fuel Used</span>
                                    <span className="font-mono font-bold">--- kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Distance</span>
                                    <span className="font-mono font-bold">{Math.round(pirep.distance || 0)} nm</span>
                                </div>
                                <div className="flex justify-between col-span-2 border-t pt-2 mt-1">
                                    <span className="text-gray-500">Revenue</span>
                                    <span className="font-bold text-green-700">€{pirep.revenue}</span>
                                </div>
                            </div>
                        </div>

                        <div className="legacy-panel bg-white p-3 flex flex-col items-center justify-center text-center h-32">
                            <span className="text-xs text-gray-500 uppercase font-bold mb-1">Overall Grade</span>
                            <span className={`text-6xl font-black ${getGradeColor(pirep.grade)} bg-clip-text text-transparent bg-gradient-to-br from-current to-black/50`}>
                                {pirep.grade || 'A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-600'
    if (grade === 'B') return 'text-blue-600'
    if (grade === 'C') return 'text-yellow-600'
    return 'text-red-600'
}
