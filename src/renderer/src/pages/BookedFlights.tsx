import { useState, useEffect } from 'react'
import {
  Calendar,
  Trash2,
  Eye,
  PlayCircle,
  Plane,
  MapPin,
  Fuel,
  Navigation,
  StopCircle
} from 'lucide-react'
import { DataService, BookedFlight, FlightLogEntry } from '../services/dataService'
import { useNavigate } from 'react-router-dom'

// Helper: Calculate delay indicator
const getDelayStatus = () => {
  return { text: 'ON TIME', color: 'text-green-600 bg-green-100' }
}

export const BookedFlights = () => {
  const navigate = useNavigate()
  const [flights, setFlights] = useState<BookedFlight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFlight, setSelectedFlight] = useState<BookedFlight | null>(null)

  // Live tracking state
  const [liveData, setLiveData] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [flightStartTime, setFlightStartTime] = useState<Date | null>(null)
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null)

  // Flight stats tracking
  const [maxAltitude, setMaxAltitude] = useState(0)
  const [maxSpeed, setMaxSpeed] = useState(0)
  const [startingFuel, setStartingFuel] = useState(0)
  const [landingRate, setLandingRate] = useState<number | null>(null)
  const [isFlightComplete, setIsFlightComplete] = useState(false)

  // Pro Flight Tracking State
  const [flightEvents, setFlightEvents] = useState<NonNullable<FlightLogEntry['events']>>([])
  const [blockOffTime, setBlockOffTime] = useState<Date | null>(null)

  const [systemStats, setSystemStats] = useState({
    landingLightsOffBelow10k: false,
    gearExtensionAlt: 0,
    maxBankAngle: 0,
    maxPitchAngle: 0,
    flapOverspeed: false
  })

  // Tracking flags to prevent duplicate events
  const [hasLoggedLights10k, setHasLoggedLights10k] = useState(false)
  const [hasLoggedGearWarning, setHasLoggedGearWarning] = useState(false)
  const [hasLoggedBank, setHasLoggedBank] = useState(false)

  useEffect(() => {
    loadFlights()

    // MSFS Data Listener for live tracking
    // @ts-ignore
    if (window.api && window.api.msfs) {
      // Get current status immediately
      // @ts-ignore
      window.api.msfs.getStatus().then((status: boolean) => {
        setConnected(status)
      })

      // @ts-ignore
      window.api.msfs.onData((data: any) => {
        if (data.latitude && data.longitude) {
          setLiveData(data)

          // Track max altitude and max speed
          if (data.altitude > maxAltitude) setMaxAltitude(data.altitude)
          if (data.speed > maxSpeed) setMaxSpeed(data.speed)

          // Track max bank/pitch
          if (Math.abs(data.bank) > systemStats.maxBankAngle) {
            setSystemStats((prev) => ({ ...prev, maxBankAngle: Math.abs(data.bank) }))
          }
          if (Math.abs(data.pitch) > systemStats.maxPitchAngle) {
            setSystemStats((prev) => ({ ...prev, maxPitchAngle: Math.abs(data.pitch) }))
          }

          // --- PRO FLIGHT MONITORING ---
          const alt = data.altitude
          const isAirborne = !data.isOnGround

          // 1. Landing Lights below 10,000ft
          if (isAirborne && alt < 10000 && alt > 500) {
            if (data.lights && !data.lights.landing && !hasLoggedLights10k) {
              setFlightEvents((prev) => [
                ...prev,
                {
                  time: new Date().toISOString(),
                  description: 'Landing Lights OFF below 10,000ft',
                  penalty: 5,
                  type: 'penalty'
                }
              ])
              setSystemStats((prev) => ({ ...prev, landingLightsOffBelow10k: true }))
              setHasLoggedLights10k(true)
            }
          }

          // 2. Gear Warning
          if (
            isAirborne &&
            alt < 2000 &&
            data.vertical_speed < -500 &&
            data.gear_handle_position === 0 &&
            !hasLoggedGearWarning
          ) {
            setFlightEvents((prev) => [
              ...prev,
              {
                time: new Date().toISOString(),
                description: 'Gear OFF below 2,000ft on approach',
                penalty: 10,
                type: 'warning'
              }
            ])
            setHasLoggedGearWarning(true)
          }

          // 3. Bank Angle Warning
          if (Math.abs(data.bank) > 35 && !hasLoggedBank) {
            setFlightEvents((prev) => [
              ...prev,
              {
                time: new Date().toISOString(),
                description: `Excessive Bank Angle (${Math.round(data.bank)}°)`,
                penalty: 5,
                type: 'penalty'
              }
            ])
            setHasLoggedBank(true)
          }

          // Calculate distance traveled
          if (lastPosition) {
            const dist = calculateDistance(
              lastPosition.lat,
              lastPosition.lng,
              data.latitude,
              data.longitude
            )
            setDistanceTraveled((prev) => prev + dist)
          }
          setLastPosition({ lat: data.latitude, lng: data.longitude })
        }
      })

      // @ts-ignore
      window.api.msfs.onStatus((status: boolean) => {
        setConnected(status)
      })

      // Listen for landing event
      // @ts-ignore
      window.api.msfs.onLanding((report: any) => {
        setLandingRate(report.rate)
      })

      // Listen for flight complete (parked)
      // @ts-ignore
      if (window.api.msfs.onFlightComplete) {
        // @ts-ignore
        window.api.msfs.onFlightComplete((data: any) => {
          setIsFlightComplete(true)
        })
      }
    }

    return () => {
      // Remove all listeners on unmount
      // @ts-ignore
      if (window.api && window.api.msfs && window.api.msfs.removeListeners) {
        // @ts-ignore
        window.api.msfs.removeListeners()
      }
    }
  }, [])

  // Calculate distance between two coordinates (in NM)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3440.065 // Earth radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const loadFlights = async () => {
    setLoading(true)
    const data = await DataService.getBookedFlights()
    data.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    setFlights(data)
    setLoading(false)
  }

  const handleStartFlight = async (flight: BookedFlight) => {
    await DataService.updateFlightStatus(flight.id, 'in-progress')
    setFlightStartTime(new Date())
    setBlockOffTime(new Date()) // Pushback time
    setDistanceTraveled(0)
    setLastPosition(null)
    // Reset flight stats
    setMaxAltitude(0)
    setMaxSpeed(0)
    setFlightEvents([])
    setSystemStats({
      landingLightsOffBelow10k: false,
      gearExtensionAlt: 0,
      maxBankAngle: 0,
      maxPitchAngle: 0,
      flapOverspeed: false
    })
    setHasLoggedLights10k(false)
    setHasLoggedGearWarning(false)
    setHasLoggedBank(false)
    setLandingRate(null)

    setIsFlightComplete(false)
    // Record starting fuel if connected
    if (liveData?.fuelQuantity) {
      setStartingFuel(liveData.fuelQuantity)
    }
    alert(
      `Starting flight ${flight.flightNumber}. Flight tracking will begin when connected to MSFS!`
    )
    loadFlights()
  }

  const handleEndFlight = async (flight: BookedFlight) => {
    // MSFS must be connected and flight must be complete
    if (!connected) {
      if (
        !confirm(
          'MSFS is not connected!\n\nYou cannot complete a flight without the simulator.\nDo you want to CANCEL this flight? (No rewards will be given)'
        )
      ) {
        return
      }
      // Cancel the flight - delete it without logging
      await DataService.deleteBookedFlight(flight.id)
      alert('Flight cancelled. No rewards given.')
      loadFlights()
      return
    }

    // Connected but flight not complete
    if (!isFlightComplete) {
      alert(
        'Cannot end flight yet!\n\nPlease land the aircraft and shut down engines (or set parking brake) before ending the flight.'
      )
      return
    }

    if (!confirm(`End flight ${flight.flightNumber}? This will log the flight.`)) return

    // Calculate flight duration
    const endTime = new Date()
    const startTime = flightStartTime || new Date(flight.bookedAt)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    // Calculate OTP
    // Assuming flight.scheduledDeparture is "HH:MM" local. We need to parse it relative to the flight date.
    // For simplicity, we just look at the ISO timestamps if available or basic minute diff
    let otpStatus: 'On Time' | 'Delayed' | 'Early' = 'On Time'


    // Use scheduledDepartureZulu if available as it's more reliable
    const schedTimeParts = (flight.scheduledDepartureZulu || flight.scheduledDeparture).split(':')
    const schedDate = new Date(startTime)
    schedDate.setUTCHours(Number(schedTimeParts[0]), Number(schedTimeParts[1]), 0, 0)

    // Diff in minutes (Actual - Scheduled)
    // If Actual > Scheduled, it's +ve (Late)
    const diffMinutes = Math.round((startTime.getTime() - schedDate.getTime()) / 60000)

    if (diffMinutes > 15) otpStatus = 'Delayed'
    else if (diffMinutes < -15) otpStatus = 'Early'
    else otpStatus = 'On Time'

    // Use real landing rate if available, otherwise use 0 (unknown)
    const finalLandingRate = landingRate !== null ? landingRate : 0

    // Calculate score based on landing rate
    const absRate = Math.abs(finalLandingRate)
    let score = 100
    if (absRate > 50) score = Math.max(0, 100 - (absRate - 50) / 5)

    // Deduct penalties from events
    const totalPenalties = flightEvents.reduce((sum, e) => sum + (e.penalty || 0), 0)
    score = Math.max(0, score - totalPenalties)
    score = Math.round(score)

    // Calculate fuel used (in kg, assuming 6.8 lbs/gallon if fuelQuantity is gallons, usually lbs in simconnect)
    // SimConnect usually returns gallons or pounds. Assuming pounds for now based on standard SimConnect
    // If DataService needs correction, we handle it there.
    const fuelUsedGallons =
      startingFuel > 0 ? Math.max(0, startingFuel - (liveData?.fuelQuantity || 0)) : 0
    const fuelUsedKg = Math.round(fuelUsedGallons * 3.08)

    // Calculate earnings based on distance and score
    const distanceNm = distanceTraveled || flight.distance || 100
    const baseEarnings = distanceNm * 2 // $2 per NM
    const bonusMultiplier = score >= 80 ? 1.5 : score >= 60 ? 1.2 : 1.0
    const earnings = Math.round(baseEarnings * bonusMultiplier)

    // Create flight log entry with real data
    const logEntry: any = {
      // Utilizing 'any' temporarily to bypass strict type check for new fields if not yet picked up
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      flightNumber: flight.flightNumber,
      departure: flight.departure,
      arrival: flight.arrival,
      aircraft: flight.aircraft,
      duration: durationMinutes,
      landingRate: Math.round(finalLandingRate),
      score: score,
      earnings: earnings,
      maxAltitude: Math.round(maxAltitude),
      maxSpeed: Math.round(maxSpeed),
      fuelUsed: fuelUsedKg,
      distanceFlown: Math.round(distanceTraveled),
      actualDepartureTime: startTime.toISOString(),
      actualArrivalTime: endTime.toISOString(),
      blockOffTime: blockOffTime?.toISOString(),
      blockOnTime: endTime.toISOString(),
      events: flightEvents,
      otp: {
        scheduledDeparture: flight.scheduledDeparture,
        actualDeparture: startTime.toISOString(),
        diffMinutes: diffMinutes,
        status: otpStatus
      },
      systemStats: systemStats
    }

    // Save to flight log
    await DataService.addFlightLog(logEntry)

    // Delete the booked flight
    await DataService.deleteBookedFlight(flight.id)

    // Navigate to flight summary with the data
    navigate('/flight-summary', { state: { flightData: logEntry } })
  }

  const handleViewOFP = (flight: BookedFlight) => {
    navigate('/ofp-viewer', { state: { ofpData: flight.ofpData } })
  }

  const handleCancel = async (flight: BookedFlight) => {
    if (confirm(`Cancel booking for ${flight.flightNumber}?`)) {
      await DataService.deleteBookedFlight(flight.id)
      loadFlights()
      setSelectedFlight(null)
    }
  }

  const getStatusBadge = (status: BookedFlight['status']) => {
    switch (status) {
      case 'booked':
        return { text: 'SCHEDULED', bg: 'bg-blue-100 text-blue-700 border-blue-300' }
      case 'in-progress':
        return {
          text: 'IN FLIGHT',
          bg: 'bg-green-100 text-green-700 border-green-300 animate-pulse'
        }
      case 'completed':
        return { text: 'COMPLETED', bg: 'bg-gray-100 text-gray-600 border-gray-300' }
    }
  }

  // Calculate progress for in-flight
  const getFlightProgress = (flight: BookedFlight) => {
    if (!flight.distance || flight.distance === 0) return 0
    const progress = Math.min(100, (distanceTraveled / flight.distance) * 100)
    return Math.round(progress)
  }

  // Calculate dynamic ETA based on current position and speed
  const getDynamicETA = (flight: BookedFlight) => {
    if (!liveData?.speed || liveData.speed < 50) return flight.scheduledArrivalZulu
    if (!flight.distance) return flight.scheduledArrivalZulu

    const remainingDistance = flight.distance - distanceTraveled
    if (remainingDistance <= 0) return 'ARRIVING'

    const hoursRemaining = remainingDistance / liveData.speed
    const eta = new Date(Date.now() + hoursRemaining * 3600000)
    return eta.toISOString().substring(11, 16) + 'Z'
  }

  // Get elapsed time
  const getElapsedTime = () => {
    if (!flightStartTime) return '--:--'
    const elapsed = Date.now() - flightStartTime.getTime()
    const h = Math.floor(elapsed / 3600000)
    const m = Math.floor((elapsed % 3600000) / 60000)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  // Get remaining time estimate
  const getRemainingTime = (flight: BookedFlight) => {
    if (!liveData?.speed || liveData.speed < 50) return '--:--'
    if (!flight.distance) return '--:--'

    const remainingDistance = Math.max(0, flight.distance - distanceTraveled)
    const hoursRemaining = remainingDistance / liveData.speed
    const h = Math.floor(hoursRemaining)
    const m = Math.floor((hoursRemaining % 1) * 60)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-1">
        <div>
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter">
            My Booked Flights
          </h1>
          <p className="text-[10px] text-gray-500">
            Manage your upcoming and past flight reservations
          </p>
        </div>
        <div className="flex gap-2">
          {/* Connection Status */}
          <div
            className={`text-xs font-bold border px-2 py-1 flex items-center gap-1 ${connected ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-600'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            ></div>
            {connected ? 'MSFS CONNECTED' : 'MSFS OFFLINE'}
          </div>
          <div className="text-xs font-bold border border-gray-400 bg-white px-3 py-1 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            {flights.filter((f) => f.status === 'booked').length} UPCOMING
          </div>
          <button
            onClick={() => navigate('/flights')}
            className="btn-classic flex items-center gap-1"
          >
            <Plane className="w-3 h-3" /> BOOK NEW FLIGHT
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Flights List */}
        <div
          className="flex-1 legacy-panel bg-white flex flex-col overflow-hidden"
          data-tutorial="booked-list"
        >
          <div className="bg-[#ddd] border-b border-[#999] p-2 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">RESERVATIONS</span>
            <button onClick={loadFlights} className="btn-classic text-[10px] py-0.5">
              REFRESH
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading reservations...
            </div>
          ) : flights.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Calendar className="w-12 h-12" />
              <p className="text-sm">No flight reservations</p>
              <button onClick={() => navigate('/flights')} className="btn-classic mt-2">
                BROWSE FLIGHTS
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {flights.map((flight) => {
                const status = getStatusBadge(flight.status)
                const delay = getDelayStatus()
                const isSelected = selectedFlight?.id === flight.id
                const isInFlight = flight.status === 'in-progress'
                const progress = isInFlight ? getFlightProgress(flight) : 0

                return (
                  <div
                    key={flight.id}
                    onClick={() => setSelectedFlight(flight)}
                    className={`border-b border-gray-200 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'} ${isInFlight ? 'bg-green-50/50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-blue-800">
                            {flight.flightNumber}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded border ${status.bg}`}>
                            {status.text}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded ${delay.color}`}>
                            {delay.text}
                          </span>
                        </div>

                        {/* Progress bar for in-flight */}
                        {isInFlight && (
                          <div className="mb-2">
                            <div className="flex justify-between text-[9px] text-gray-600 mb-1">
                              <span>{flight.departure}</span>
                              <span className="font-bold text-green-700">{progress}% complete</span>
                              <span>{flight.arrival}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 relative"
                                style={{ width: `${progress}%` }}
                              >
                                <div className="absolute right-0 top-0 w-2 h-2 bg-white rounded-full border-2 border-green-600 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="font-bold">{flight.departure}</span>
                            <span>→</span>
                            <span className="font-bold">{flight.arrival}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            <span>{flight.aircraft}</span>
                          </div>
                          {flight.distance && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Navigation className="w-3 h-3" />
                              <span>{flight.distance} NM</span>
                            </div>
                          )}
                        </div>

                        {/* Live data for in-flight */}
                        {isInFlight && connected && liveData && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] bg-green-100 border border-green-300 rounded px-2 py-1">
                            <span className="text-green-800 font-bold">LIVE:</span>
                            <span>
                              ALT: <b>{Math.round(liveData.altitude || 0)}</b> ft
                            </span>
                            <span>
                              GS: <b>{Math.round(liveData.speed || 0)}</b> kts
                            </span>
                            <span>
                              HDG: <b>{Math.round(liveData.heading || 0)}</b>°
                            </span>
                            <span className="text-purple-700">
                              Remaining: <b>{getRemainingTime(flight)}</b>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {flight.status === 'booked' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartFlight(flight)
                              }}
                              className="border border-green-500 bg-green-50 px-2 py-1 text-[10px] hover:bg-green-100 flex items-center gap-1 text-green-700"
                            >
                              <PlayCircle className="w-3 h-3" /> START
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancel(flight)
                              }}
                              className="border border-red-400 bg-red-50 px-2 py-1 text-[10px] hover:bg-red-100 flex items-center gap-1 text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {flight.status === 'in-progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEndFlight(flight)
                            }}
                            className="border border-red-500 bg-red-50 px-2 py-1 text-[10px] hover:bg-red-100 flex items-center gap-1 text-red-700"
                          >
                            <StopCircle className="w-3 h-3" /> END
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewOFP(flight)
                          }}
                          className="border border-gray-400 bg-white px-2 py-1 text-[10px] hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> OFP
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Flight Details Panel */}
        <div className="w-96 legacy-panel bg-white flex flex-col" data-tutorial="flight-details">
          <div className="bg-[#ddd] border-b border-[#999] p-2">
            <span className="text-xs font-bold text-gray-700">FLIGHT DETAILS</span>
          </div>

          {selectedFlight ? (
            <div className="flex-1 p-3 overflow-y-auto text-xs">
              {/* Flight Header */}
              <div className="text-center mb-4 pb-3 border-b border-gray-200">
                <p className="text-2xl font-bold text-blue-800">{selectedFlight.flightNumber}</p>
                <p className="text-gray-500">
                  {selectedFlight.aircraft}{' '}
                  {selectedFlight.aircraftName && `(${selectedFlight.aircraftName})`}
                </p>
                {selectedFlight.registration && (
                  <p className="text-[10px] text-gray-400">Reg: {selectedFlight.registration}</p>
                )}
              </div>

              {/* Live Tracking Panel for In-Flight */}
              {selectedFlight.status === 'in-progress' && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded p-3 mb-3">
                  <p className="text-[10px] text-green-700 uppercase mb-2 font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    LIVE FLIGHT TRACKING
                  </p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[9px] mb-1">
                      <span className="font-bold">{selectedFlight.departure}</span>
                      <span className="text-green-700">{getFlightProgress(selectedFlight)}%</span>
                      <span className="font-bold">{selectedFlight.arrival}</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-300">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600"
                        style={{ width: `${getFlightProgress(selectedFlight)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Live Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-[9px] text-gray-500">ELAPSED</p>
                      <p className="font-mono font-bold text-blue-700">{getElapsedTime()}</p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-[9px] text-gray-500">REMAINING</p>
                      <p className="font-mono font-bold text-purple-700">
                        {getRemainingTime(selectedFlight)}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-[9px] text-gray-500">DISTANCE FLOWN</p>
                      <p className="font-mono font-bold">{Math.round(distanceTraveled)} NM</p>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <p className="text-[9px] text-gray-500">DYNAMIC ETA</p>
                      <p className="font-mono font-bold text-green-700">
                        {getDynamicETA(selectedFlight)}
                      </p>
                    </div>
                  </div>

                  {/* Current Position Data */}
                  {connected && liveData && (
                    <div className="mt-3 pt-2 border-t border-green-200">
                      <p className="text-[9px] text-gray-500 mb-1">CURRENT POSITION</p>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className="text-[9px] text-gray-400">ALT</p>
                          <p className="font-mono font-bold text-sm">
                            {Math.round(liveData.altitude || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400">GS</p>
                          <p className="font-mono font-bold text-sm">
                            {Math.round(liveData.speed || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400">VS</p>
                          <p className="font-mono font-bold text-sm">
                            {Math.round(liveData.vertical_speed || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Route Visual */}
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

              {/* Schedule Info */}
              <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                <p className="text-[10px] text-gray-500 uppercase mb-2 font-bold">
                  Schedule (Zulu / Local)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-[9px] text-blue-600 font-bold">DEPARTURE</p>
                    <p className="font-mono font-bold text-lg">
                      {selectedFlight.scheduledDepartureZulu || '--:--Z'}
                    </p>
                    <p className="font-mono text-gray-500">
                      {selectedFlight.scheduledDeparture} (Local)
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-[9px] text-green-600 font-bold">ARRIVAL</p>
                    <p className="font-mono font-bold text-lg">
                      {selectedFlight.scheduledArrivalZulu || '--:--Z'}
                    </p>
                    <p className="font-mono text-gray-500">
                      {selectedFlight.scheduledArrival} (Local)
                    </p>
                  </div>
                </div>
              </div>

              {/* Flight Stats */}
              <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                <p className="text-[10px] text-gray-500 uppercase mb-2 font-bold">Flight Info</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-bold">{selectedFlight.distance || '---'} NM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Flight Time:</span>
                    <span className="font-bold text-purple-700">
                      {selectedFlight.flightTime || '---'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cruise:</span>
                    <span className="font-bold">FL{selectedFlight.cruiseAlt || '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> Block Fuel:
                    </span>
                    <span className="font-bold text-orange-600">
                      {selectedFlight.blockFuel || '---'} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 mt-4">
                <button
                  onClick={() => handleViewOFP(selectedFlight)}
                  className="w-full btn-classic flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> VIEW FULL OFP
                </button>
                {selectedFlight.status === 'booked' && (
                  <>
                    <button
                      onClick={() => handleStartFlight(selectedFlight)}
                      className="w-full btn-classic bg-green-100 border-green-400 text-green-800 flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4" /> START FLIGHT
                    </button>
                    <button
                      onClick={() => handleCancel(selectedFlight)}
                      className="w-full btn-classic bg-red-50 border-red-300 text-red-700 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> CANCEL RESERVATION
                    </button>
                  </>
                )}
                {selectedFlight.status === 'in-progress' && (
                  <button
                    onClick={() => handleEndFlight(selectedFlight)}
                    className="w-full btn-classic bg-red-100 border-red-400 text-red-800 flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-4 h-4" /> END FLIGHT
                  </button>
                )}
              </div>
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
