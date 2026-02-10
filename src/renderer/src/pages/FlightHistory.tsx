import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, Plane, Trophy, Clock, TrendingUp, DollarSign, Filter } from 'lucide-react'
import { DataService, FlightLogEntry } from '../services/dataService'

// Helper: Get landing grade
const getLandingGrade = (rate: number) => {
  if (!rate) return { text: 'N/A', color: 'text-gray-500', bg: 'bg-gray-100' }
  const absRate = Math.abs(rate)
  if (absRate < 100) return { text: 'BUTTER', color: 'text-purple-600', bg: 'bg-purple-100' }
  if (absRate < 200) return { text: 'GOOD', color: 'text-green-600', bg: 'bg-green-100' }
  if (absRate < 350) return { text: 'ACCEPTABLE', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  if (absRate < 500) return { text: 'FIRM', color: 'text-orange-600', bg: 'bg-orange-100' }
  return { text: 'HARD', color: 'text-red-600', bg: 'bg-red-100' }
}

export const FlightHistory = () => {
  const navigate = useNavigate()
  const [flights, setFlights] = useState<FlightLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFlight, setSelectedFlight] = useState<FlightLogEntry | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>('All')

  useEffect(() => {
    loadFlights()
  }, [])

  const loadFlights = async () => {
    setLoading(true)
    const log = await DataService.getFlightLog()
    // Sort by date descending
    log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setFlights(log)
    setLoading(false)
  }

  // Calculate stats
  const stats = {
    totalFlights: flights.length,
    totalHours: flights.reduce((sum, f) => sum + (f.duration || 0), 0) / 60,
    totalEarnings: flights.reduce((sum, f) => sum + (f.earnings || 0), 0),
    avgScore:
      flights.length > 0
        ? Math.round(flights.reduce((sum, f) => sum + (f.score || 0), 0) / flights.length)
        : 0,
    avgLandingRate:
      flights.length > 0 && flights.some((f) => f.landingRate)
        ? Math.round(
            flights
              .filter((f) => f.landingRate)
              .reduce((sum, f) => sum + Math.abs(f.landingRate || 0), 0) /
              flights.filter((f) => f.landingRate).length
          )
        : null
  }

  // Get unique months
  const months = [
    ...new Set(
      flights.map((f) => {
        const d = new Date(f.date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
    )
  ]

  // Filter flights
  const filteredFlights =
    filterMonth === 'All' ? flights : flights.filter((f) => f.date.startsWith(filterMonth))

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            Flight History
          </h1>
        </div>
        <div className="text-xs text-gray-600 font-bold border border-gray-400 bg-white px-2 py-0.5">
          {flights.length} COMPLETED FLIGHTS
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        <div className="legacy-panel bg-white p-2 text-center">
          <Plane className="w-4 h-4 mx-auto text-blue-600 mb-1" />
          <div className="text-lg font-bold text-blue-800">{stats.totalFlights}</div>
          <div className="text-[9px] text-gray-500 uppercase">Total Flights</div>
        </div>
        <div className="legacy-panel bg-white p-2 text-center">
          <Clock className="w-4 h-4 mx-auto text-green-600 mb-1" />
          <div className="text-lg font-bold text-green-800">{stats.totalHours.toFixed(1)}h</div>
          <div className="text-[9px] text-gray-500 uppercase">Flight Hours</div>
        </div>
        <div className="legacy-panel bg-white p-2 text-center">
          <DollarSign className="w-4 h-4 mx-auto text-yellow-600 mb-1" />
          <div className="text-lg font-bold text-yellow-800">
            €{stats.totalEarnings.toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-500 uppercase">Total Earnings</div>
        </div>
        <div className="legacy-panel bg-white p-2 text-center">
          <Trophy className="w-4 h-4 mx-auto text-purple-600 mb-1" />
          <div className="text-lg font-bold text-purple-800">{stats.avgScore}%</div>
          <div className="text-[9px] text-gray-500 uppercase">Avg Score</div>
        </div>
        <div className="legacy-panel bg-white p-2 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-orange-600 mb-1" />
          <div className="text-lg font-bold text-orange-800">
            {stats.avgLandingRate || '---'} fpm
          </div>
          <div className="text-[9px] text-gray-500 uppercase">Avg Landing</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <Filter className="w-3 h-3 text-gray-500" />
        <span className="text-[10px] font-bold text-gray-600">MONTH:</span>
        <button
          onClick={() => setFilterMonth('All')}
          className={`px-2 py-0.5 text-[10px] border ${filterMonth === 'All' ? 'bg-blue-600 text-white' : 'bg-white border-gray-300'}`}
        >
          All Time
        </button>
        {months.slice(0, 6).map((m) => (
          <button
            key={m}
            onClick={() => setFilterMonth(m)}
            className={`px-2 py-0.5 text-[10px] border ${filterMonth === m ? 'bg-blue-600 text-white' : 'bg-white border-gray-300'}`}
          >
            {formatMonth(m)}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Flights List */}
        <div
          className="flex-1 legacy-panel bg-white flex flex-col overflow-hidden"
          data-tutorial="history-list"
        >
          <div className="bg-[#ddd] border-b border-[#999] p-2 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">COMPLETED FLIGHTS</span>
            <span className="text-[10px] text-gray-500">{filteredFlights.length} results</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading flight history...
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <History className="w-12 h-12" />
              <p className="text-sm">No completed flights yet</p>
              <p className="text-[10px]">Complete your first flight to see it here!</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredFlights.map((flight) => {
                const isSelected = selectedFlight?.id === flight.id
                const grade = getLandingGrade(flight.landingRate || 0)

                return (
                  <div
                    key={flight.id}
                    onClick={() => setSelectedFlight(flight)}
                    className={`border-b border-gray-200 p-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-blue-800">{flight.flightNumber}</span>
                          <span className="text-[10px] text-gray-500">{flight.date}</span>
                          {flight.landingRate && (
                            <span className={`text-[9px] px-1 rounded ${grade.bg} ${grade.color}`}>
                              {grade.text}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="font-mono">
                            {flight.departure} → {flight.arrival}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span>{flight.aircraft}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-700">€{flight.earnings}</div>
                        <div className="text-[10px] text-purple-700 font-bold">{flight.score}%</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Flight Details Panel */}
        <div className="w-80 legacy-panel bg-white flex flex-col">
          <div className="bg-[#ddd] border-b border-[#999] p-2">
            <span className="text-xs font-bold text-gray-700">FLIGHT DETAILS</span>
          </div>

          {selectedFlight ? (
            <div className="flex-1 p-3 overflow-y-auto text-xs">
              {/* Flight Header */}
              <div className="text-center mb-4 pb-3 border-b border-gray-200">
                <p className="text-2xl font-bold text-blue-800">{selectedFlight.flightNumber}</p>
                <p className="text-gray-500">{selectedFlight.aircraft}</p>
                <p className="text-[10px] text-gray-400">{selectedFlight.date}</p>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="text-center">
                  <p className="text-xl font-bold">{selectedFlight.departure}</p>
                  <p className="text-[10px] text-gray-500">DEPARTURE</p>
                </div>
                <div className="flex-1 mx-2 border-t-2 border-dashed border-gray-300 relative">
                  <Plane className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 bg-white" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{selectedFlight.arrival}</p>
                  <p className="text-[10px] text-gray-500">ARRIVAL</p>
                </div>
              </div>

              {/* Landing Rate */}
              {selectedFlight.landingRate && (
                <div
                  className={`${getLandingGrade(selectedFlight.landingRate).bg} border rounded p-3 mb-3 text-center`}
                >
                  <p className="text-[10px] text-gray-600 uppercase mb-1">Landing Rate</p>
                  <p
                    className={`text-3xl font-bold font-mono ${getLandingGrade(selectedFlight.landingRate).color}`}
                  >
                    {selectedFlight.landingRate} fpm
                  </p>
                  <p
                    className={`text-sm font-bold ${getLandingGrade(selectedFlight.landingRate).color}`}
                  >
                    {getLandingGrade(selectedFlight.landingRate).text}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                <p className="text-[10px] text-gray-500 uppercase mb-2 font-bold">
                  Flight Statistics
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-bold">{selectedFlight.duration || '---'} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Score:</span>
                    <span className="font-bold text-purple-700">{selectedFlight.score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Earnings:</span>
                    <span className="font-bold text-green-700">€{selectedFlight.earnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Alt:</span>
                    <span className="font-bold">{selectedFlight.maxAltitude || '---'} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Speed:</span>
                    <span className="font-bold">{selectedFlight.maxSpeed || '---'} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fuel Used:</span>
                    <span className="font-bold">{selectedFlight.fuelUsed || '---'} kg</span>
                  </div>
                </div>
              </div>

              {/* View Full Summary */}
              <button
                onClick={() => navigate(`/flight-summary/${selectedFlight.id}`)}
                className="w-full btn-classic flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" /> VIEW FULL SUMMARY
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
              Select a flight to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
