import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  Plane,
  Clock,
  Fuel,
  TrendingDown,
  Award,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { DataService, FlightLogEntry } from '../services/dataService'

// Landing grade calculator
const getLandingGrade = (rate: number) => {
  if (!rate) return { text: 'N/A', color: 'text-gray-500', bg: 'bg-gray-100', score: 0 }
  const absRate = Math.abs(rate)
  if (absRate < 50)
    return { text: 'PERFECT BUTTER', color: 'text-purple-700', bg: 'bg-purple-100', score: 100 }
  if (absRate < 100)
    return { text: 'BUTTER', color: 'text-purple-600', bg: 'bg-purple-100', score: 95 }
  if (absRate < 150)
    return { text: 'EXCELLENT', color: 'text-green-600', bg: 'bg-green-100', score: 90 }
  if (absRate < 200) return { text: 'GOOD', color: 'text-green-600', bg: 'bg-green-100', score: 85 }
  if (absRate < 250)
    return { text: 'ACCEPTABLE', color: 'text-yellow-600', bg: 'bg-yellow-100', score: 75 }
  if (absRate < 350)
    return { text: 'FIRM', color: 'text-orange-600', bg: 'bg-orange-100', score: 60 }
  if (absRate < 500) return { text: 'HARD', color: 'text-red-600', bg: 'bg-red-100', score: 40 }
  return { text: 'VERY HARD', color: 'text-red-700', bg: 'bg-red-200', score: 20 }
}

const getOverallGrade = (score: number) => {
  if (score >= 95) return { grade: 'A+', color: 'text-purple-600' }
  if (score >= 90) return { grade: 'A', color: 'text-green-600' }
  if (score >= 85) return { grade: 'A-', color: 'text-green-500' }
  if (score >= 80) return { grade: 'B+', color: 'text-blue-600' }
  if (score >= 75) return { grade: 'B', color: 'text-blue-500' }
  if (score >= 70) return { grade: 'B-', color: 'text-yellow-600' }
  if (score >= 65) return { grade: 'C+', color: 'text-yellow-500' }
  if (score >= 60) return { grade: 'C', color: 'text-orange-500' }
  if (score >= 50) return { grade: 'D', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

const getOtpBadge = (status?: string) => {
  switch (status) {
    case 'On Time':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' }
    case 'Early':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
    case 'Delayed':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
  }
}

export const FlightSummary = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [flight, setFlight] = useState<FlightLogEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFlight = async () => {
      // First check if flight data was passed via navigation state
      if (location.state?.flightData) {
        setFlight(location.state.flightData)
        setLoading(false)
        return
      }

      // Otherwise try to load from flight log by ID
      if (id) {
        const log = await DataService.getFlightLog()
        const found = log.find((f) => f.id === id)
        setFlight(found || null)
      }
      setLoading(false)
    }
    loadFlight()
  }, [id, location.state])

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center font-tahoma bg-[#f0f0f0]">
        <p className="text-gray-500">Loading flight data...</p>
      </div>
    )
  }

  if (!flight) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center font-tahoma bg-[#f0f0f0]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
        <p className="text-gray-600 mb-4">Flight not found</p>
        <button onClick={() => navigate('/flight-history')} className="btn-classic">
          Back to History
        </button>
      </div>
    )
  }

  const landingGrade = getLandingGrade(flight.landingRate || 0)
  const overallGrade = getOverallGrade(flight.score || 0)

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0] overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-classic p-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            Flight Summary
          </h1>
        </div>
        <div className="text-xs text-gray-600 font-mono bg-white border border-gray-400 px-3 py-1">
          {flight.date}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Flight Info */}
        <div className="space-y-3">
          {/* Flight Card */}
          <div className="legacy-panel bg-white p-4">
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-blue-800">{flight.flightNumber}</span>
              <p className="text-sm text-gray-500">{flight.aircraft}</p>
            </div>

            <div className="flex items-center justify-center gap-4 py-4 border-y border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold">{flight.departure}</p>
                <p className="text-[10px] text-gray-500 uppercase">Origin</p>
              </div>
              <div className="px-4">
                <Plane className="w-6 h-6 text-blue-500 rotate-90" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{flight.arrival}</p>
                <p className="text-[10px] text-gray-500 uppercase">Destination</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-bold">{flight.duration} min</span>
              </div>
              <span className="font-bold">{flight.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Scheduled:</span>
              <span className="font-bold">{flight.otp?.scheduledDeparture || '--:--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Actual:</span>
              <span className="font-bold">
                {flight.otp?.actualDeparture
                  ? new Date(flight.otp.actualDeparture).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '--:--'}
              </span>
            </div>
          </div>

          {flight.otp && (
            <div
              className={`mt-3 p-2 rounded border text-center ${getOtpBadge(flight.otp.status).bg} ${getOtpBadge(flight.otp.status).border} ${getOtpBadge(flight.otp.status).text}`}
            >
              <p className="text-[10px] uppercase font-bold">On-Time Performance</p>
              <p className="text-lg font-bold">{flight.otp.status}</p>
              {flight.otp.diffMinutes !== 0 && (
                <p className="text-[10px]">
                  {Math.abs(flight.otp.diffMinutes)} min{' '}
                  {flight.otp.diffMinutes > 0 ? 'late' : 'early'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Earnings Card */}
        <div className="legacy-panel bg-gradient-to-r from-green-50 to-green-100 p-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto text-green-600 mb-1" />
          <p className="text-[10px] text-gray-500 uppercase mb-1">Flight Earnings</p>
          <p className="text-4xl font-bold text-green-700">
            €{flight.earnings?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Center Column - Performance */}
      <div className="space-y-3">
        {/* Overall Score */}
        <div className="legacy-panel bg-white p-4 text-center">
          <Award className="w-8 h-8 mx-auto text-purple-600 mb-2" />
          <p className="text-[10px] text-gray-500 uppercase mb-2">Overall Performance</p>
          <div className="flex items-center justify-center gap-4">
            <span className={`text-6xl font-bold ${overallGrade.color}`}>{overallGrade.grade}</span>
            <div className="text-left">
              <p className="text-4xl font-bold text-gray-700">{flight.score}%</p>
              <p className="text-xs text-gray-500">Flight Score</p>
            </div>
          </div>
        </div>

        {/* Landing Rate */}
        <div className={`legacy-panel ${landingGrade.bg} p-4 text-center`}>
          <TrendingDown className="w-6 h-6 mx-auto text-gray-600 mb-2" />
          <p className="text-[10px] text-gray-600 uppercase mb-1">Landing Rate</p>
          <p className={`text-5xl font-bold font-mono ${landingGrade.color}`}>
            {flight.landingRate || '---'}
          </p>
          <p className="text-lg text-gray-600">FPM</p>
          <div
            className={`mt-2 inline-block px-3 py-1 rounded ${landingGrade.bg} border ${landingGrade.color.replace('text', 'border')}`}
          >
            <span className={`font-bold ${landingGrade.color}`}>{landingGrade.text}</span>
          </div>
        </div>
      </div>

      {/* Right Column - Statistics */}
      <div className="space-y-3">
        {/* Flight Stats */}
        <div className="legacy-panel bg-white p-4">
          <p className="text-xs font-bold text-gray-700 mb-3 uppercase border-b pb-2">
            Flight Statistics
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">FLIGHT TIME</p>
                <p className="font-bold">{flight.duration} minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">MAX ALTITUDE</p>
                <p className="font-bold">{flight.maxAltitude?.toLocaleString() || '---'} ft</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <Plane className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">MAX SPEED</p>
                <p className="font-bold">{flight.maxSpeed || '---'} kts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                <Fuel className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">FUEL USED</p>
                <p className="font-bold">{flight.fuelUsed || '---'} kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Checklist */}
        <div className="legacy-panel bg-white p-4">
          <p className="text-xs font-bold text-gray-700 mb-3 uppercase border-b pb-2">
            Performance Checklist
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Flight Completed</span>
            </div>
            <div className="flex items-center gap-2">
              {flight.landingRate && Math.abs(flight.landingRate) < 300 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span>Safe Landing ({Math.abs(flight.landingRate || 0)} fpm)</span>
            </div>
            <div className="flex items-center gap-2">
              {(flight.score || 0) >= 70 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span>Good Score ({flight.score}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Extended Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Flight Event Log */}
        <div className="legacy-panel bg-white p-4">
          <p className="text-xs font-bold text-gray-700 mb-3 uppercase border-b pb-2">
            Flight Event Log
          </p>

          {!flight.events || flight.events.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-200" />
              No significant events recorded. Smooth flight!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {flight.events.map((event, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border text-xs flex justify-between items-center ${
                    event.type === 'penalty'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : event.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        : event.type === 'bonus'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{event.description}</span>
                    <span className="text-[9px] opacity-75">
                      {new Date(event.time).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="font-mono font-bold">
                    {event.penalty ? `-${event.penalty}` : ''} Points
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Violations / Detailed Stats */}
        <div className="legacy-panel bg-white p-4">
          <p className="text-xs font-bold text-gray-700 mb-3 uppercase border-b pb-2">
            Detailed Performance
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className={`p-2 rounded border ${flight.systemStats?.landingLightsOffBelow10k ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
            >
              <p className="text-[9px] uppercase">Lights &lt; 10k ft</p>
              <p className="font-bold">
                {flight.systemStats?.landingLightsOffBelow10k ? 'VIOLATION' : 'GOOD'}
              </p>
            </div>
            <div
              className={`p-2 rounded border ${flight.systemStats?.flapOverspeed ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
            >
              <p className="text-[9px] uppercase">Flap Speed</p>
              <p className="font-bold">{flight.systemStats?.flapOverspeed ? 'EXCEEDED' : 'GOOD'}</p>
            </div>
            <div className="p-2 rounded border bg-gray-50 border-gray-200">
              <p className="text-[9px] uppercase text-gray-500">Max Bank</p>
              <p
                className={`font-bold ${(flight.systemStats?.maxBankAngle || 0) > 30 ? 'text-yellow-600' : 'text-gray-700'}`}
              >
                {Math.round(flight.systemStats?.maxBankAngle || 0)}°
              </p>
            </div>
            <div className="p-2 rounded border bg-gray-50 border-gray-200">
              <p className="text-[9px] uppercase text-gray-500">Max Pitch</p>
              <p className="font-bold text-gray-700">
                {Math.round(flight.systemStats?.maxPitchAngle || 0)}°
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center">
        <button
          onClick={() => navigate('/flight-history')}
          className="btn-classic flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO HISTORY
        </button>
        <button onClick={() => navigate('/')} className="btn-classic flex items-center gap-2">
          <Plane className="w-4 h-4" /> GO TO DASHBOARD
        </button>
      </div>
    </div>
  )
}
