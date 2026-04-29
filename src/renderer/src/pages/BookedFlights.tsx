import { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Trash2,
  Eye,
  PlayCircle,
  Plane,
  Fuel,
  Navigation,
  StopCircle,
  Briefcase,
  RefreshCw
} from 'lucide-react'
import { DataService, BookedFlight, FlightLogEntry } from '../services/dataService'
import { getAirportByICAO, findNearestAirport } from '../services/airportDatabase'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, fadeInUp, slideDown } from '../utils/animations'
import toast from 'react-hot-toast'
import { toastConfirm } from '../utils/toastConfirm'

// Helper: Calculate delay indicator
const getDelayStatus = () => {
  return { text: 'ON TIME', color: 'text-green-600 bg-green-100' }
}

export const BookedFlights = () => {
  const navigate = useNavigate()
  const [flights, setFlights] = useState<BookedFlight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFlight, setSelectedFlight] = useState<BookedFlight | null>(null)

  // Refs for Live Data (avoiding closure staleness in listeners)
  const activeFlightRef = useRef<BookedFlight | null>(null)
  const lastReportTime = useRef(0)
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null)

  // Live tracking state
  const [liveData, setLiveData] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [flightStartTime, setFlightStartTime] = useState<Date | null>(null)
  const [distanceTraveled, setDistanceTraveled] = useState(0)

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
    maxG: 0,
    flapOverspeed: false
  })

  // Tracking flags to prevent duplicate events (useRef to avoid stale closure in useEffect)
  const hasLoggedLights10kRef = useRef(false)
  const hasLoggedGearWarningRef = useRef(false)
  const hasLoggedBankRef = useRef(false)

  // Flight path & landing data recording (refs to avoid stale closures)
  const flightPathRef = useRef<{lat: number, lng: number, alt: number}[]>([])
  const landingDataRef = useRef<{alt: number, vs: number, g: number}[]>([])
  const lastPathTimeRef = useRef(0)

  // ATC Diversion Flag
  const [isAtcDiversion, setIsAtcDiversion] = useState(false)

  // --- Load Data ---
  const loadFlights = async () => {
    setLoading(true)
    const data = await DataService.getBookedFlights()
    data.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    setFlights(data)
    setLoading(false)
  }

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

          // Track max altitude and max speed using functional updates to avoid stale closure
          setMaxAltitude(prev => Math.max(prev, data.altitude || 0))
          setMaxSpeed(prev => Math.max(prev, data.speed || 0))

          // Track max bank/pitch/G using functional updates
          // NOTE: msfs.ts sends bankAngle, pitchAngle, gForce (not bank, pitch)
          setSystemStats((prev) => {
            let updated = false
            const nextStats = { ...prev }
            const bankVal = Math.abs(data.bankAngle || 0)
            const pitchVal = Math.abs(data.pitchAngle || 0)
            const gVal = Math.abs(data.gForce || 0)
            
            if (bankVal > prev.maxBankAngle) {
              nextStats.maxBankAngle = bankVal
              updated = true
            }
            if (pitchVal > prev.maxPitchAngle) {
              nextStats.maxPitchAngle = pitchVal
              updated = true
            }
            if (gVal > (prev.maxG || 0)) {
              nextStats.maxG = gVal
              updated = true
            }
            
            return updated ? nextStats : prev
          })

          // --- PRO FLIGHT MONITORING ---
          const alt = data.altitude
          // NOTE: msfs.ts sends onGround (not isOnGround)
          const isAirborne = !data.onGround

          // 1. Landing Lights below 10,000ft
          // NOTE: msfs.ts sends landingLights as a top-level boolean (not data.lights.landing)
          if (isAirborne && alt < 10000 && alt > 500) {
            if (!data.landingLights && !hasLoggedLights10kRef.current) {
              hasLoggedLights10kRef.current = true
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
            }
          }

          // 2. Gear Warning
          // NOTE: msfs.ts sends gearDown as boolean (not gear_handle_position)
          if (
            isAirborne &&
            alt < 2000 &&
            data.vertical_speed < -500 &&
            !data.gearDown &&
            !hasLoggedGearWarningRef.current
          ) {
            hasLoggedGearWarningRef.current = true
            setFlightEvents((prev) => [
              ...prev,
              {
                time: new Date().toISOString(),
                description: 'Gear OFF below 2,000ft on approach',
                penalty: 10,
                type: 'warning'
              }
            ])
          }

          // 3. Bank Angle Warning
          // NOTE: msfs.ts sends bankAngle (not bank)
          if (Math.abs(data.bankAngle || 0) > 35 && !hasLoggedBankRef.current) {
            hasLoggedBankRef.current = true
            setFlightEvents((prev) => [
              ...prev,
              {
                time: new Date().toISOString(),
                description: `Excessive Bank Angle (${Math.round(data.bankAngle)}°)`,
                penalty: 5,
                type: 'penalty'
              }
            ])
          }

          // Calculate distance traveled
          if (lastPositionRef.current) {
            const dist = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              data.latitude,
              data.longitude
            )
            setDistanceTraveled((prev) => prev + dist)
          }
          lastPositionRef.current = { lat: data.latitude, lng: data.longitude }

          // Record flight path for map (every 15 seconds to keep data small)
          const now = Date.now()
          if (now - lastPathTimeRef.current > 15000) {
            lastPathTimeRef.current = now
            flightPathRef.current.push({
              lat: data.latitude,
              lng: data.longitude,
              alt: Math.round(data.altitude || 0)
            })
          }

          // Record landing approach data (below 500ft AGL for landing chart)
          if (!data.onGround && (data.altitude || 0) <= 500 && (data.altitude || 0) > 0) {
            landingDataRef.current.push({
              alt: Math.round(data.altitude),
              vs: Math.round(data.vertical_speed || 0),
              g: parseFloat((data.gForce || 1).toFixed(2))
            })
          }

          // Report Position to Live Map (Throttle: 30s)
          if (Date.now() - lastReportTime.current > 30000 && data.latitude && data.longitude) {
            lastReportTime.current = Date.now()

            const currentFlight = activeFlightRef.current

            DataService.reportPosition({
              latitude: data.latitude,
              longitude: data.longitude,
              altitude: Math.round(data.altitude),
              speed: Math.round(data.speed),
              heading: Math.round(data.heading),
              flight_number: currentFlight?.flightNumber || 'VFR',
              aircraft: currentFlight?.aircraft || 'Unknown',
              departure: currentFlight?.departure || '???',
              arrival: currentFlight?.arrival || '???',
              phase: data.isOnGround ? 'Ground' : 'Enroute'
            })
          }
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

  const handleStartFlight = async (flight: BookedFlight) => {
    await DataService.updateFlightStatus(flight.id, 'in-progress')
    activeFlightRef.current = flight
    setFlightStartTime(new Date())
    setBlockOffTime(new Date()) // Pushback time
    setDistanceTraveled(0)
    lastPositionRef.current = null
    // Reset flight stats
    setMaxAltitude(0)
    setMaxSpeed(0)
    setFlightEvents([])
    setSystemStats({
      landingLightsOffBelow10k: false,
      gearExtensionAlt: 0,
      maxBankAngle: 0,
      maxPitchAngle: 0,
      maxG: 0,
      flapOverspeed: false
    })
    hasLoggedLights10kRef.current = false
    hasLoggedGearWarningRef.current = false
    hasLoggedBankRef.current = false
    flightPathRef.current = []
    landingDataRef.current = []
    lastPathTimeRef.current = 0
    setLandingRate(null)

    setIsFlightComplete(false)
    // Record starting fuel if connected
    if (liveData?.fuelQuantity) {
      setStartingFuel(liveData.fuelQuantity)
    }
    toast.success(
      `Starting flight ${flight.flightNumber}. Flight tracking will begin when connected to MSFS!`,
      { duration: 4000, icon: '✈️' }
    )

    // Update local state immediately so UI turns 'in-progress'
    const updatedFlight = { ...flight, status: 'in-progress' as const }
    setFlights((prev) => prev.map((f) => (f.id === flight.id ? updatedFlight : f)))
    setSelectedFlight((prev) => (prev?.id === flight.id ? updatedFlight : prev))
    
    // Also load from DB to be safe
    loadFlights()
  }

  const handleEndFlight = async (flight: BookedFlight) => {
    // MSFS must be connected and flight must be complete
    if (!connected) {
      const shouldCancel = await toastConfirm(
        'MSFS is not connected!\n\nCancel this flight? (No rewards will be given)'
      )
      if (!shouldCancel) {
        return
      }
      // Cancel the flight - delete it without logging
      await DataService.deleteBookedFlight(flight.id)
      toast.error('Flight cancelled. No rewards given.', { icon: '❌' })
      loadFlights()
      return
    }

    // Connected but flight not complete — allow ending but with zero rewards
    let earlyEnd = false
    if (!isFlightComplete) {
      const shouldEnd = await toastConfirm(
        'Flight is not complete yet!\n\nYou can end now, but you will receive NO rewards or score. Continue?'
      )
      if (!shouldEnd) return
      earlyEnd = true
    }

    if (!(await toastConfirm(`End flight ${flight.flightNumber}? This will log the flight.`))) return

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

    // --- DESTINATION AIRPORT VALIDATION ---
    let landedAtICAO = flight.arrival // Assume correct until proven otherwise
    let diversionPenalty = 0

    // Extract alternate airport from SimBrief OFP (if available)
    const alternateICAO = flight.ofpData?.alternate?.icao_code || null

    // Logic:
    // 1. ATC Diversion active? -> No penalty, land anywhere.
    // 2. OFP Data exists (Scheduled OR Free Roam)? -> Validate Destination & Alternate.
    // 3. No OFP Data? -> Skip validation (fallback for legacy/simple Free Roam).
    const shoudValidate = !isAtcDiversion && flight.ofpData

    if (shoudValidate && liveData?.latitude && liveData?.longitude) {
      const destAirport = getAirportByICAO(flight.arrival)
      const altAirport = alternateICAO ? getAirportByICAO(alternateICAO) : null

      if (destAirport) {
        const nearest = findNearestAirport(liveData.latitude, liveData.longitude, 5)

        if (nearest && nearest.airport.icao === destAirport.icao) {
          // âœ… At correct destination
          landedAtICAO = destAirport.icao
        } else if (altAirport && nearest && nearest.airport.icao === altAirport.icao) {
          // âœ… At planned alternate airport â€” no penalty (ATC directed)
          landedAtICAO = altAirport.icao
          setFlightEvents((prev) => [
            ...prev,
            {
              time: new Date().toISOString(),
              description: `Diverted to alternate ${altAirport.name} (${altAirport.icao}) â€” no penalty`,
              penalty: 0,
              type: 'info' as const
            }
          ])
        } else if (nearest) {
          // âŒ At a different airport (not destination or alternate)
          landedAtICAO = nearest.airport.icao
          diversionPenalty = 15
          setFlightEvents((prev) => [
            ...prev,
            {
              time: new Date().toISOString(),
              description: `Landed at wrong airport: ${nearest.airport.name} (${nearest.airport.icao}) â€” expected ${destAirport.icao}${alternateICAO ? ` or alternate ${alternateICAO}` : ''}`,
              penalty: 15,
              type: 'penalty' as const
            }
          ])
        } else {
          // âŒ Not at any known network airport
          landedAtICAO = 'UNKNOWN'
          diversionPenalty = 25
          setFlightEvents((prev) => [
            ...prev,
            {
              time: new Date().toISOString(),
              description: `Landed at unknown location (not at destination ${destAirport.icao}${alternateICAO ? ` or alternate ${alternateICAO}` : ''})`,
              penalty: 25,
              type: 'penalty' as const
            }
          ])
        }
      }
    }

    // Apply diversion penalty to score
    score = Math.max(0, score - diversionPenalty)

    // Calculate earnings based on distance and score
    const distanceNm = distanceTraveled || flight.distance || 100
    const baseEarnings = distanceNm * 2 // $2 per NM
    const bonusMultiplier = score >= 80 ? 1.5 : score >= 60 ? 1.2 : 1.0
    // Diversion reduces earnings: wrong known airport = half, unknown = zero
    const diversionMultiplier = diversionPenalty === 0 ? 1.0 : diversionPenalty <= 15 ? 0.5 : 0
    let earnings = Math.round(baseEarnings * bonusMultiplier * diversionMultiplier)

    // Early end = no rewards
    if (earlyEnd) {
      score = 0
      earnings = 0
    }

    // Create flight log entry with real data
    const logEntry: any = {
      // Utilizing 'any' temporarily to bypass strict type check for new fields if not yet picked up
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      flightNumber: flight.flightNumber,
      departure: flight.departure,
      arrival: flight.arrival,
      aircraft: flight.aircraft,
      landedAt: landedAtICAO,
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
      systemStats: systemStats,
      flightPath: flightPathRef.current,
      landingData: landingDataRef.current
    }

    // Save to flight log
    await DataService.addFlightLog(logEntry)

    // Delete the booked flight
    await DataService.deleteBookedFlight(flight.id)
    activeFlightRef.current = null

    // Navigate to flight summary with the data
    navigate('/flight-summary', { state: { flightData: logEntry } })
  }

  const handleRefetchSimbrief = async (flight: BookedFlight) => {
    try {
      const pilot = await DataService.getProfile()
      if (!pilot?.simBriefUsername) {
        toast.error('No SimBrief Username linked! Go to Settings first.', { icon: '⚙️' })
        return
      }
      toast.loading('Fetching fresh SimBrief OFP...', { id: 'simbrief' })
      const ofpData = await DataService.getLatestOFP(pilot.simBriefUsername)

      const formatZulu = (ts: number) => {
        if (!ts) return '--:--Z'
        const d = new Date(ts * 1000)
        return d.toISOString().substring(11, 16) + 'Z'
      }

      const formatDuration = (seconds: number) => {
        if (!seconds) return '--:--'
        const totalMins = Math.floor(seconds / 60)
        const h = Math.floor(totalMins / 60)
        const m = totalMins % 60
        return `${h}h ${m.toString().padStart(2, '0')}m`
      }

      const updates: Partial<BookedFlight> = {
        ofpData,
        flightNumber: `${ofpData.general.icao_airline}${ofpData.general.flight_number}`,
        departure: ofpData.origin.icao_code,
        arrival: ofpData.destination.icao_code,
        aircraft: ofpData.aircraft.icaocode,
        aircraftName: ofpData.aircraft.name || '',
        registration: ofpData.aircraft.reg || 'N/A',
        scheduledDeparture: ofpData.times.sched_out 
          ? new Date(ofpData.times.sched_out * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : flight.scheduledDeparture,
        scheduledArrival: ofpData.times.sched_in
          ? new Date(ofpData.times.sched_in * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : flight.scheduledArrival,
        scheduledDepartureZulu: formatZulu(ofpData.times.sched_out),
        scheduledArrivalZulu: formatZulu(ofpData.times.sched_in),
        flightTime: formatDuration(ofpData.times.est_time_enroute),
        distance: ofpData.general.route_distance ? parseInt(ofpData.general.route_distance, 10) : flight.distance,
        cruiseAlt: ofpData.general.initial_altitude ? Math.round(parseInt(ofpData.general.initial_altitude, 10) / 100) : flight.cruiseAlt,
        blockFuel: ofpData.fuel.plan_ramp ? parseInt(ofpData.fuel.plan_ramp, 10) : flight.blockFuel
      }

      await DataService.updateBookedFlight(flight.id, updates)

      // Update local state immediately
      const refreshed = { ...flight, ...updates }
      setFlights((prev) => prev.map((f) => (f.id === flight.id ? refreshed : f)))
      
      // Update the detail panel if this flight is the one currently selected
      setSelectedFlight((prev) => (prev?.id === flight.id ? refreshed : prev))

      toast.success('Flight Plan Fully Updated!', { id: 'simbrief', icon: '✅' })
    } catch (error: any) {
      toast.error(`Error fetching plan: ${error.message}`, { id: 'simbrief' })
    }
  }

  const handleViewOFP = (flight: BookedFlight) => {
    navigate('/ofp-viewer', { state: { ofpData: flight.ofpData } })
  }

  const handleCancel = async (flight: BookedFlight) => {
    if (await toastConfirm(`Cancel booking for ${flight.flightNumber}?`)) {
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

  // --- Dynamic Stats Fallback Logic (Re-implemented post-rollback) ---
  const getDisplayDistance = (flight: BookedFlight) => {
    if (flight.distance) return flight.distance

    let depLat = getAirportByICAO(flight.departure)?.lat
    let depLng = getAirportByICAO(flight.departure)?.lng
    let arrLat = getAirportByICAO(flight.arrival)?.lat
    let arrLng = getAirportByICAO(flight.arrival)?.lng
    
    if (!arrLat && flight.ofpData?.destination?.pos_lat) {
      arrLat = parseFloat(flight.ofpData.destination.pos_lat)
      arrLng = parseFloat(flight.ofpData.destination.pos_long)
    }
    if (!depLat && flight.ofpData?.origin?.pos_lat) {
      depLat = parseFloat(flight.ofpData.origin.pos_lat)
      depLng = parseFloat(flight.ofpData.origin.pos_long)
    }

    if (depLat !== undefined && arrLat !== undefined && depLng !== undefined && arrLng !== undefined) {
      return Math.round(calculateDistance(depLat, depLng, arrLat, arrLng))
    }
    return 0
  }

  const getDisplayEET = (flight: BookedFlight) => {
    if (flight.flightTime) return flight.flightTime

    const dist = getDisplayDistance(flight)
    if (dist > 0) {
      const hours = dist / 420
      const h = Math.floor(hours)
      const m = Math.floor((hours % 1) * 60)
      return `${h}h ${m.toString().padStart(2, '0')}m`
    }
    return '---'
  }

  // Calculate progress for in-flight
  const getFlightProgress = (flight: BookedFlight) => {
    let totalDist = flight.distance || 0
    let destLat = getAirportByICAO(flight.arrival)?.lat
    let destLng = getAirportByICAO(flight.arrival)?.lng
    let depLat = getAirportByICAO(flight.departure)?.lat
    let depLng = getAirportByICAO(flight.departure)?.lng

    if (!destLat && flight.ofpData?.destination?.pos_lat) {
      destLat = parseFloat(flight.ofpData.destination.pos_lat)
      destLng = parseFloat(flight.ofpData.destination.pos_long)
    }
    if (!depLat && flight.ofpData?.origin?.pos_lat) {
      depLat = parseFloat(flight.ofpData.origin.pos_lat)
      depLng = parseFloat(flight.ofpData.origin.pos_long)
    }

    if (depLat !== undefined && destLat !== undefined && depLng !== undefined && destLng !== undefined) {
      totalDist = calculateDistance(depLat, depLng, destLat, destLng)
    }

    let progress = 0
    let remaining = 0

    if (destLat !== undefined && destLng !== undefined && liveData?.latitude && liveData?.longitude) {
      remaining = calculateDistance(
        liveData.latitude,
        liveData.longitude,
        destLat,
        destLng
      )
      const safeTotal = Math.max(1, totalDist)
      const completedDist = Math.max(0, safeTotal - remaining)
      progress = Math.min(100, Math.max(0, (completedDist / safeTotal) * 100))
    } else {
      const safeTotal = Math.max(1, totalDist)
      progress = Math.min(100, (distanceTraveled / safeTotal) * 100)
      remaining = Math.max(0, safeTotal - distanceTraveled)
    }

    return { percent: Math.round(progress), remaining: Math.round(remaining) }
  }

  // Calculate dynamic ETA based on current position and speed
  const getDynamicETA = (flight: BookedFlight) => {
    const rawArrival = flight.scheduledArrivalZulu || flight.scheduledArrival || '--:--Z'
    const formatTime = (ts: string) => ts.includes('T') ? ts.substring(11, 16) + 'Z' : ts

    if (!liveData?.speed || liveData.speed < 50) return formatTime(rawArrival)

    let remainingDistance = 0
    let destLat = getAirportByICAO(flight.arrival)?.lat
    let destLng = getAirportByICAO(flight.arrival)?.lng
    
    if (!destLat && flight.ofpData?.destination?.pos_lat) {
      destLat = parseFloat(flight.ofpData.destination.pos_lat)
      destLng = parseFloat(flight.ofpData.destination.pos_long)
    }

    if (destLat !== undefined && destLng !== undefined && liveData?.latitude && liveData?.longitude) {
      remainingDistance = calculateDistance(liveData.latitude, liveData.longitude, destLat, destLng)
    } else {
      if (!flight.distance) return formatTime(rawArrival)
      remainingDistance = Math.max(0, flight.distance - (distanceTraveled || 0))
    }

    if (remainingDistance <= 2) return 'ARRIVING'

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

    let remainingDistance = 0
    let destLat = getAirportByICAO(flight.arrival)?.lat
    let destLng = getAirportByICAO(flight.arrival)?.lng

    if (!destLat && flight.ofpData?.destination?.pos_lat) {
      destLat = parseFloat(flight.ofpData.destination.pos_lat)
      destLng = parseFloat(flight.ofpData.destination.pos_long)
    }

    if (destLat !== undefined && destLng !== undefined && liveData?.latitude && liveData?.longitude) {
      remainingDistance = calculateDistance(liveData.latitude, liveData.longitude, destLat, destLng)
    } else {
      if (!flight.distance) return '--:--'
      remainingDistance = Math.max(0, flight.distance - distanceTraveled)
    }

    const hoursRemaining = remainingDistance / liveData.speed
    const h = Math.floor(hoursRemaining)
    const m = Math.floor((hoursRemaining % 1) * 60)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  return (
    <motion.div
      className="p-6 h-full flex flex-col font-sans bg-slate-50/50"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header section */}
      <motion.div variants={slideDown} className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">
              My Flights
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your upcoming and active flight reservations
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {/* Connection Status */}
          <div
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border ${connected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            ></div>
            {connected ? 'MSFS CONNECTED' : 'MSFS OFFLINE'}
          </div>

          <div className="text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-sm rounded-xl px-4 py-2 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-blue-600">{flights.filter((f) => f.status === 'booked').length} UPCOMING</span>
          </div>

          <button
            onClick={() => navigate('/flights')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            <Plane className="w-3.5 h-3.5" /> NEW BOOKING
          </button>
        </div>
      </motion.div>

      <div className="flex-1 flex gap-5 overflow-hidden">
        {/* Flights List Column */}
        <motion.div
          variants={fadeInUp}
          className="flex-[4] flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100"
          data-tutorial="booked-list"
        >
          <div className="bg-slate-50 border-b border-slate-100 p-3 px-5 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 tracking-wider">RESERVATIONS</span>
            <button
              onClick={loadFlights}
              className="text-blue-600 hover:text-blue-800 text-[10px] font-bold py-1 px-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> REFRESH
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : flights.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-8">
              <div className="bg-slate-50 p-5 rounded-full">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No flight reservations found</p>
              <p className="text-xs text-slate-400">Book a scheduled flight or create a free roam</p>
              <button
                onClick={() => navigate('/flights')}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-5 py-2 rounded-xl text-xs transition-colors mt-2 border border-blue-100"
              >
                BROWSE SCHEDULE
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              <AnimatePresence>
                {flights.map((flight) => {
                  const status = getStatusBadge(flight.status)
                  const delay = getDelayStatus()
                  const isSelected = selectedFlight?.id === flight.id
                  const isInFlight = flight.status === 'in-progress'
                  const progressData = isInFlight ? getFlightProgress(flight) : { percent: 0, remaining: 0 }

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={flight.id}
                      onClick={() => setSelectedFlight(flight)}
                      className={`cursor-pointer border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/30'
                          : isInFlight
                          ? 'border-green-200 bg-green-50/20 hover:border-green-300'
                          : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      <div className="p-4">
                        {/* Top Row: FlightNumber + Status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isInFlight ? 'bg-green-100' : 'bg-slate-50 border border-slate-100'}`}>
                              {isInFlight ? (
                                <Plane className="w-5 h-5 text-green-600 animate-pulse" />
                              ) : (
                                <Briefcase className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-800 text-base">{flight.flightNumber}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">{flight.aircraft}</span>
                                {flight.status === 'booked' && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${delay.color}`}>
                                    {delay.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${status.bg}`}>
                            {status.text}
                          </span>
                        </div>

                        {/* Route visualization */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-center flex-1">
                            <div className="text-2xl font-black text-slate-700 tracking-tight">{flight.departure}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1">
                              {flight.scheduledDeparture}
                            </div>
                          </div>

                          <div className="flex-[2] flex flex-col items-center px-4">
                            <div className="w-full relative flex items-center justify-center h-4">
                              <div className="absolute w-full border-t-2 border-dashed border-slate-200"></div>
                              {isInFlight && (
                                <div
                                  className="absolute left-0 border-t-2 border-solid border-green-500 transition-all duration-1000 z-0"
                                  style={{ width: `${progressData.percent}%` }}
                                ></div>
                              )}
                              <Plane
                                className={`w-4 h-4 z-10 ${isInFlight ? 'text-green-500 fill-green-500' : 'text-slate-300'}`}
                                style={isInFlight ? { position: 'absolute', left: `calc(${Math.min(95, progressData.percent)}% - 8px)`, transition: 'left 1s ease' } : {}}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold mt-1.5">
                              {isInFlight ? `${progressData.remaining} NM REMAINING (${progressData.percent}%)` : `${getDisplayDistance(flight)} NM`}
                            </span>
                          </div>

                          <div className="text-center flex-1">
                            <div className="text-2xl font-black text-slate-700 tracking-tight">{flight.arrival}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1">
                              {flight.scheduledArrival}
                            </div>
                          </div>
                        </div>

                        {/* Live data strip for in-flight */}
                        {isInFlight && connected && liveData && (
                          <div className="flex items-center justify-between mt-3 text-[10px] bg-emerald-50/50 border border-emerald-100 text-slate-700 rounded-lg px-3 py-2 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-600 font-black flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-emerald-200 shadow-sm">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                LIVE
                              </span>
                              <span className="font-medium text-slate-500">ALT: <b className="font-black text-sky-navy text-xs">{Math.round(liveData.altitude || 0)}</b> ft</span>
                              <span className="font-medium text-slate-500">GS: <b className="font-black text-sky-navy text-xs">{Math.round(liveData.speed || 0)}</b> kts</span>
                              <span className="font-medium text-slate-500">HDG: <b className="font-black text-sky-navy text-xs">{Math.round(liveData.heading || 0)}</b>°</span>
                            </div>
                            <div className="text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                              ETA: <b className="font-black">{getDynamicETA(flight)}</b>
                            </div>
                          </div>
                        )}

                        {/* Inline action buttons */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                          {flight.status === 'booked' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStartFlight(flight) }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                              >
                                <PlayCircle className="w-3 h-3" /> START FLIGHT
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(flight) }}
                                className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-500 px-2 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {flight.status === 'in-progress' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setIsAtcDiversion(!isAtcDiversion) }}
                                data-tutorial="atc-diversion-toggle"
                                className={`px-3 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all border ${
                                  isAtcDiversion
                                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <Navigation className="w-3 h-3" />
                                {isAtcDiversion ? 'ATC DIVERT ON' : 'ATC DIVERT'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEndFlight(flight) }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                              >
                                <StopCircle className="w-3 h-3" /> END FLIGHT
                              </button>
                            </>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            {flight.status === 'booked' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRefetchSimbrief(flight) }}
                                className="bg-white hover:bg-sky-50 border border-slate-200 text-sky-600 px-2.5 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all"
                                title="Refetch SimBrief Plan"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewOFP(flight) }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3 h-3" /> OFP
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Selected Flight Details Panel */}
        <motion.div
          variants={fadeInUp}
          className="flex-[3] flex flex-col"
          data-tutorial="flight-details"
        >
          {selectedFlight ? (
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col h-full overflow-hidden">

              {/* Header area with light theme background */}
              <div className="h-36 bg-white border-b border-slate-100 relative flex items-end p-5 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-4 right-4 opacity-5">
                  <Plane className="w-28 h-28 text-sky-navy" />
                </div>
                <div className="relative z-10 w-full flex justify-between items-end">
                  <div>
                    <div className="text-sky-cyan text-[10px] font-black uppercase tracking-widest mb-1.5">SELECTED RESERVATION</div>
                    <h2 className="text-3xl font-black text-sky-navy tracking-tighter">
                      {selectedFlight.flightNumber}
                    </h2>
                    <p className="text-slate-500 font-bold text-xs mt-1">
                      {selectedFlight.aircraft}
                      {selectedFlight.aircraftName && ` — ${selectedFlight.aircraftName}`}
                    </p>
                  </div>
                  <div className="bg-sky-magenta/10 px-3.5 py-2 rounded-xl border border-sky-magenta/20 shadow-sm">
                    <span className="text-sky-magenta font-mono text-sm font-black tracking-widest">
                      {selectedFlight.departure} → {selectedFlight.arrival}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto no-scrollbar">

                {/* Live Tracking Panel */}
                {selectedFlight.status === 'in-progress' && (() => {
                  const prog = getFlightProgress(selectedFlight)
                  return (
                    <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:border-sky-cyan/40 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-cyan/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-sky-cyan/10 transition-all"></div>
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                          <span className="text-emerald-600 font-black tracking-widest text-[10px] uppercase">LIVE TRACKING</span>
                        </div>
                        <span className="text-sky-cyan font-mono text-xs font-black bg-sky-cyan/10 px-2 py-0.5 rounded-md border border-sky-cyan/20">
                          {getElapsedTime()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-5 relative z-10">
                        <div className="flex justify-between text-[10px] mb-2 font-black tracking-widest">
                          <span className="text-sky-navy">{selectedFlight.departure}</span>
                          <span className="text-emerald-500">{prog.percent}%</span>
                          <span className="text-sky-navy">{selectedFlight.arrival}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-1000 relative rounded-full"
                            style={{ width: `${Math.min(100, prog.percent)}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm border-[3px] border-emerald-500"></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Dynamic ETA</div>
                          <div className="text-lg font-mono text-sky-navy tracking-widest font-black">
                            {getDynamicETA(selectedFlight)}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Time Remaining</div>
                          <div className="text-lg font-mono text-sky-cyan tracking-widest font-black">
                            {getRemainingTime(selectedFlight)}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Distance Flown</div>
                          <div className="text-lg font-mono text-slate-700 font-black">{Math.round(distanceTraveled)} <span className="text-xs text-slate-400 ml-0.5">NM</span></div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Remaining</div>
                          <div className="text-lg font-mono text-sky-magenta font-black">{prog.remaining} <span className="text-xs text-slate-400 ml-0.5">NM</span></div>
                        </div>
                      </div>

                      {/* Current Position Data */}
                      {connected && liveData && (
                        <div className="mt-4 pt-4 border-t border-slate-100 relative z-10">
                          <p className="text-[9px] text-slate-400 font-bold mb-2.5 uppercase tracking-widest">CURRENT POSITION telemetry</p>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-sky-cyan/5 rounded-xl p-2.5 border border-sky-cyan/10">
                              <p className="text-[9px] text-sky-cyan font-black tracking-widest mb-0.5">ALT</p>
                              <p className="font-mono font-black text-sm text-sky-navy">{Math.round(liveData.altitude || 0)}<span className="text-[9px] text-slate-400 ml-0.5">ft</span></p>
                            </div>
                            <div className="bg-sky-cyan/5 rounded-xl p-2.5 border border-sky-cyan/10">
                              <p className="text-[9px] text-sky-cyan font-black tracking-widest mb-0.5">GS</p>
                              <p className="font-mono font-black text-sm text-sky-navy">{Math.round(liveData.speed || 0)}<span className="text-[9px] text-slate-400 ml-0.5">kts</span></p>
                            </div>
                            <div className="bg-sky-cyan/5 rounded-xl p-2.5 border border-sky-cyan/10">
                              <p className="text-[9px] text-sky-cyan font-black tracking-widest mb-0.5">VS</p>
                              <p className="font-mono font-black text-sm text-sky-navy">{Math.round(liveData.vertical_speed || 0)}<span className="text-[9px] text-slate-400 ml-0.5">fpm</span></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Schedule Info */}
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Schedule</h4>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[9px] text-blue-500 font-bold uppercase mb-1">Departure</p>
                    <p className="font-mono font-extrabold text-lg text-slate-800">
                      {selectedFlight.scheduledDepartureZulu || '--:--Z'}
                    </p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">
                      {selectedFlight.scheduledDeparture} (Local)
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-[9px] text-green-600 font-bold uppercase mb-1">Arrival</p>
                    <p className="font-mono font-extrabold text-lg text-slate-800">
                      {selectedFlight.scheduledArrivalZulu || '--:--Z'}
                    </p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">
                      {selectedFlight.scheduledArrival} (Local)
                    </p>
                  </div>
                </div>

                {/* Flight Data */}
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Flight Data</h4>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Distance</span>
                    <span className="font-bold text-slate-700">{getDisplayDistance(selectedFlight)} NM</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Est Time</span>
                    <span className="font-bold text-purple-600 bg-purple-50 text-xs px-2 py-0.5 rounded-md border border-purple-100">
                      {getDisplayEET(selectedFlight)}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Cruise</span>
                    <span className="font-bold text-slate-700">
                      {(() => {
                        const alt = selectedFlight.cruiseAlt || selectedFlight.ofpData?.general?.initial_altitude
                        if (!alt) return 'Auto'
                        const s = String(alt)
                        if (s.toUpperCase().startsWith('FL')) return s.toUpperCase()
                        const num = parseInt(s, 10)
                        if (isNaN(num)) return s
                        return num > 1000 ? `FL${Math.round(num / 100)}` : `FL${num}`
                      })()}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> Fuel
                    </span>
                    <span className="font-bold text-orange-600">
                      {(selectedFlight.blockFuel || selectedFlight.ofpData?.fuel?.plan_ramp)
                        ? `${selectedFlight.blockFuel || selectedFlight.ofpData?.fuel?.plan_ramp} kg`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="grid gap-2">
                  {selectedFlight.status === 'booked' && (
                    <button
                      onClick={() => handleStartFlight(selectedFlight)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <PlayCircle className="w-5 h-5" />
                      START FLIGHT TRACKING
                    </button>
                  )}
                  {selectedFlight.status === 'in-progress' && (
                    <button
                      onClick={() => handleEndFlight(selectedFlight)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <StopCircle className="w-5 h-5" />
                      COMPLETE & LOG FLIGHT
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOFP(selectedFlight)}
                      className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 text-xs"
                    >
                      <Eye className="w-4 h-4" /> View OFP Docs
                    </button>
                    {selectedFlight.status === 'booked' && (
                      <button
                        onClick={() => handleCancel(selectedFlight)}
                        className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-500 font-bold py-2.5 px-4 rounded-xl transition-all flex justify-center items-center"
                        title="Cancel Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Navigation className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-semibold text-sm text-slate-500">Select a flight from the list</p>
              <p className="text-xs text-slate-400 mt-1">View details, tracking status, and flight commands</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
