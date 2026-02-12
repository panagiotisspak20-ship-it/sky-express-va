import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, LayoutList, Trophy, TrendingUp, AlertTriangle } from 'lucide-react'
import { DataService } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'

export const PirepLog = () => {
  const navigate = useNavigate()
  const [pireps, setPireps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPireps()
  }, [])

  const loadPireps = async () => {
    setLoading(true)

    // Let's get profile first to be safe
    const user = await DataService.getProfile()
    if (user) {
      const myPireps = await DataService.getPireps(user.id)
      setPireps(myPireps)
    }
    setLoading(false)
  }

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-600 bg-green-100 border-green-200'
    if (grade === 'B') return 'text-blue-600 bg-blue-100 border-blue-200'
    if (grade === 'C') return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    return 'text-red-600 bg-red-100 border-red-200'
  }

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <LayoutList className="w-6 h-6 text-blue-800" />
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            Pilot Reports (PIREPs)
          </h1>
        </div>
        <button onClick={loadPireps} className="text-xs text-blue-600 hover:underline">
          Refresh
        </button>
      </div>

      <div className="flex-1 legacy-panel bg-white flex flex-col overflow-hidden">
        <div className="bg-[#ddd] border-b border-[#999] p-2 flex justify-between items-center font-bold text-xs text-gray-700">
          <span>FLIGHT LOG</span>
          <span>{pireps.length} REPORTS</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <SkyLoader text="Loading PIREPs..." />
          </div>
        ) : pireps.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <History className="w-12 h-12 mb-2 opacity-20" />
            <p>No PIREPs filed yet.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-2" data-tutorial="pirep-list">
            {pireps.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/pirep/${p.id}`)}
                className="border border-gray-300 bg-white p-3 hover:bg-blue-50 cursor-pointer transition-colors shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  {/* Grade Badge */}
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded font-bold text-xl border ${getGradeColor(p.grade || 'A')}`}
                  >
                    {p.grade || 'A'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-blue-900">{p.flight_number}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
                      <span>
                        {p.departure_icao} ➤ {p.arrival_icao}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>{p.aircraft_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  {/* Landing Rate */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Landing
                    </span>
                    <span
                      className={`font-mono font-bold ${Math.abs(p.landing_rate) < 200 ? 'text-green-600' : 'text-gray-800'}`}
                    >
                      {p.landing_rate} fpm
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-end w-16">
                    <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Score
                    </span>
                    <span className="text-lg font-bold text-purple-700">{p.score}</span>
                  </div>

                  {/* Warning Icon if penalties */}
                  {p.flight_events?.length > 0 && (
                    <AlertTriangle className="w-4 h-4 text-orange-400 opacity-50 group-hover:opacity-100" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
