import { Notification, BrowserWindow } from 'electron'
import { open, Protocol } from 'node-simconnect'

export class MsfsService {
  private handle: any = null
  private connected = false
  private interval: NodeJS.Timeout | null = null
  private window: BrowserWindow
  private wasOnGround: boolean = true
  private wasAirborne: boolean = false
  private recentVerticalSpeeds: number[] = []
  private retryCount = 0

  // Use unique IDs to avoid conflicts
  private dataDefinitionId = 111
  private dataRequestId = 222

  constructor(window: BrowserWindow) {
    this.window = window
    this.connect()
  }

  isConnected(): boolean {
    return this.connected
  }

  async connect() {
    if (this.connected) return

    try {
      this.retryCount++

      // use FSX_SP2 for maximum compatibility with Fenix
      const { recvOpen, handle } = await open('Sky Express VA', Protocol.FSX_SP2)

      console.log('[MSFS] ✓ Connected to', recvOpen.applicationName)

      this.connected = true
      this.retryCount = 0
      this.handle = handle
      this.window.webContents.send('msfs-status', true)
      this.window.webContents.send('msfs-error', null)

      // Set up event handlers
      handle.on('exception', (recvException) => {
        console.log('[MSFS] SimConnect exception:', recvException)
      })

      handle.on('quit', () => {
        console.log('[MSFS] Simulator quit')
        this.handleDisconnect()
      })

      handle.on('close', () => {
        console.log('[MSFS] Connection closed')
        this.handleDisconnect()
      })

      // Use a FIXED DEFINITION ID
      const DEF_ID = 100
      this.dataDefinitionId = DEF_ID

      // Structure:
      // 1. IS USER SIM (INT32)
      handle.addToDataDefinition(DEF_ID, 'IS USER SIM', 'bool', 1)

      // 2. POSITION & ATTITUDE (FLOAT64)
      handle.addToDataDefinition(DEF_ID, 'PLANE LATITUDE', 'degrees', 4)
      handle.addToDataDefinition(DEF_ID, 'PLANE LONGITUDE', 'degrees', 4)
      handle.addToDataDefinition(DEF_ID, 'PLANE ALTITUDE', 'feet', 4)
      handle.addToDataDefinition(DEF_ID, 'PLANE HEADING DEGREES TRUE', 'degrees', 4)
      handle.addToDataDefinition(DEF_ID, 'PLANE BANK DEGREES', 'degrees', 4)
      handle.addToDataDefinition(DEF_ID, 'PLANE PITCH DEGREES', 'degrees', 4)

      // 3. SPEED & G-FORCE (FLOAT64)
      handle.addToDataDefinition(DEF_ID, 'AIRSPEED INDICATED', 'knots', 4)
      handle.addToDataDefinition(DEF_ID, 'GROUND VELOCITY', 'knots', 4)
      handle.addToDataDefinition(DEF_ID, 'VERTICAL SPEED', 'feet/minute', 4)
      handle.addToDataDefinition(DEF_ID, 'G FORCE', 'gforce', 4)

      // 4. SYSTEMS & ENGINES (INT32)
      handle.addToDataDefinition(DEF_ID, 'SIM ON GROUND', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'ENG COMBUSTION:1', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'BRAKE PARKING POSITION', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'GEAR HANDLE POSITION', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'FLAPS HANDLE INDEX', 'number', 1)
      // Lights
      handle.addToDataDefinition(DEF_ID, 'LIGHT LANDING', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT TAXI', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT STROBE', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT BEACON', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT NAV', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT CABIN', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT LOGO', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT WING', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT PANEL', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'LIGHT RECOGNITION', 'bool', 1)
      // Autopilot modes
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT MASTER', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT HEADING LOCK', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT ALTITUDE LOCK', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT APPROACH HOLD', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT NAV1 LOCK', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT VERTICAL HOLD', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT FLIGHT LEVEL CHANGE', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT FLIGHT DIRECTOR ACTIVE', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT AIRSPEED HOLD', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT BACKCOURSE HOLD', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AUTOPILOT ATTITUDE HOLD', 'bool', 1)
      // Systems
      handle.addToDataDefinition(DEF_ID, 'PITOT HEAT', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'PANEL ANTI ICE SWITCH', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'ENG ANTI ICE:1', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'STRUCTURAL DEICE SWITCH', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'WINDSHIELD DEICE SWITCH', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'AVIONICS MASTER SWITCH', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'ELECTRICAL MASTER BATTERY', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'GENERAL ENG MASTER ALTERNATOR:1', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'CABIN SEATBELTS ALERT SWITCH', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'CABIN NO SMOKING ALERT SWITCH', 'bool', 1)
      // Spoilers
      handle.addToDataDefinition(DEF_ID, 'SPOILERS ARMED', 'bool', 1)
      handle.addToDataDefinition(DEF_ID, 'SPOILERS HANDLE POSITION', 'percent', 4)

      // 5. FUEL (FLOAT64)
      handle.addToDataDefinition(DEF_ID, 'FUEL TOTAL QUANTITY', 'gallons', 4)

      // Handle incoming data
      handle.on('simObjectData', (recvData) => {
        if (recvData.requestID === this.dataRequestId) {
          try {
            const data = recvData.data

            // READ DATA IN EXACT ORDER OF DEFINITION
            // 1. IS USER SIM
            data.readInt() // Offset 0

            // 2. POSITION & ATTITUDE
            const lat = data.readDouble() // Offset 4
            const lon = data.readDouble() // Offset 12
            const alt = data.readDouble() // Offset 20
            const hdg = data.readDouble() // Offset 28
            const bank = data.readDouble() // Offset 36
            const pitch = data.readDouble() // Offset 44

            // 3. SPEED & G-FORCE
            const speed = data.readDouble() // Offset 52
            const gSpeed = data.readDouble() // Offset 60
            const vSpeed = data.readDouble() // Offset 68
            const gForce = data.readDouble() // Offset 76

            // 4. SYSTEMS & ENGINES
            const onGround = data.readInt() !== 0
            const engineRunning = data.readInt() !== 0
            const parkingBrake = data.readInt() !== 0
            const gearDown = data.readInt() !== 0
            const flaps = data.readInt()
            // Lights
            const landingLights = data.readInt() !== 0
            const taxiLights = data.readInt() !== 0
            const strobeLights = data.readInt() !== 0
            const beaconLights = data.readInt() !== 0
            const navLights = data.readInt() !== 0
            const cabinLights = data.readInt() !== 0
            const logoLights = data.readInt() !== 0
            const wingLights = data.readInt() !== 0
            const panelLights = data.readInt() !== 0
            const recognitionLights = data.readInt() !== 0
            // Autopilot modes
            const autopilot = data.readInt() !== 0
            const apHeading = data.readInt() !== 0
            const apAltitude = data.readInt() !== 0
            const apApproach = data.readInt() !== 0
            const apNav = data.readInt() !== 0
            const apVerticalSpeed = data.readInt() !== 0
            const apFlc = data.readInt() !== 0
            const apFlightDirector = data.readInt() !== 0
            const apSpeedHold = data.readInt() !== 0
            const apBackcourse = data.readInt() !== 0
            const apAttitude = data.readInt() !== 0
            // Systems
            const pitotHeat = data.readInt() !== 0
            const antiIce = data.readInt() !== 0
            const engAntiIce = data.readInt() !== 0
            const structuralDeice = data.readInt() !== 0
            const windshieldDeice = data.readInt() !== 0
            const avionicsMaster = data.readInt() !== 0
            const masterBattery = data.readInt() !== 0
            const masterAlternator = data.readInt() !== 0
            const seatbelts = data.readInt() !== 0
            const noSmoking = data.readInt() !== 0
            // Spoilers
            const spoilersArmed = data.readInt() !== 0
            const spoilersPosition = data.readDouble()

            // 5. FUEL
            const fuel = data.readDouble()

            const telemetry = {
              latitude: lat,
              longitude: lon,
              altitude: alt,
              heading: hdg,
              bankAngle: bank,
              pitchAngle: pitch,

              speed: speed,
              groundspeed: gSpeed,
              vertical_speed: vSpeed,
              gForce: gForce,

              onGround,
              engineRunning,
              parkingBrake,
              fuelQuantity: fuel,
              // Flight Controls
              gearDown,
              flaps,
              spoilersArmed,
              spoilersPosition: Math.round(spoilersPosition),
              // Lights
              landingLights,
              taxiLights,
              strobeLights,
              beaconLights,
              navLights,
              cabinLights,
              logoLights,
              wingLights,
              panelLights,
              recognitionLights,
              // Autopilot
              autopilot,
              apHeading,
              apAltitude,
              apApproach,
              apNav,
              apVerticalSpeed,
              apFlc,
              apFlightDirector,
              apSpeedHold,
              apBackcourse,
              apAttitude,
              // Systems
              pitotHeat,
              antiIce,
              engAntiIce,
              structuralDeice,
              windshieldDeice,
              avionicsMaster,
              masterBattery,
              masterAlternator,
              seatbelts,
              noSmoking
            }

            this.window.webContents.send('msfs-data', telemetry)

            // Run flight detection methods
            this.detectLanding(telemetry)
            this.monitorFlight(telemetry)
            this.detectParking(telemetry)

            // Track airborne state for parking detection
            if (!onGround && gSpeed > 50) {
              this.wasAirborne = true
            }
          } catch (e: any) {
            console.error('[MSFS] Parse Error:', e.message)
          }
        }
      })

      handle.requestDataOnSimObject(
        this.dataRequestId,
        this.dataDefinitionId,
        0,
        4, // SIMCONNECT_PERIOD_SECOND (1Hz)
        0,
        0,
        0,
        0
      )
    } catch (err: any) {
      if (this.retryCount <= 3) {
        const errorMsg = err?.message || 'Unknown error'
        console.log(`[MSFS] Connection failed: ${errorMsg}`)

        if (errorMsg.includes('ECONNREFUSED')) {
          console.log(
            '[MSFS] SimConnect not available. Make sure MSFS is running with a flight loaded.'
          )
          this.window.webContents.send('msfs-error', 'MSFS not running or no flight loaded')
        }
      }

      this.handleDisconnect()
    }
  }

  handleDisconnect() {
    this.connected = false
    this.handle = null
    this.wasOnGround = true
    this.wasAirborne = false
    this.window.webContents.send('msfs-status', false)
    this.retryConnection()
  }

  detectLanding(data: any) {
    // Keep a small buffer of VS to average out noise
    if (!data.onGround && data.vertical_speed) {
      this.recentVerticalSpeeds.push(data.vertical_speed)
      if (this.recentVerticalSpeeds.length > 5) this.recentVerticalSpeeds.shift()
    }

    // TOUCHDOWN DETECTED
    if (!this.wasOnGround && data.onGround) {
      const landingRate =
        this.recentVerticalSpeeds[this.recentVerticalSpeeds.length - 1] || data.vertical_speed || 0
      console.log(`[MSFS] Touchdown! Rate: ${Math.round(landingRate)} fpm`)

      this.window.webContents.send('landing-report', {
        rate: Math.round(landingRate),
        location:
          data.latitude && data.longitude
            ? `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`
            : 'Unknown',
        timestamp: new Date().toISOString()
      })

      try {
        new Notification({
          title: 'Touchdown!',
          body: `Landing Rate: ${Math.round(landingRate)} fpm`
        }).show()
      } catch (_e) {
        // Notification might fail
      }

      this.recentVerticalSpeeds = []
    }

    this.wasOnGround = !!data.onGround
  }

  // Flight Tracking State
  private flightLog: { time: string; message: string; penalty: number }[] = []
  private maxBank: number = 0
  private maxG: number = 0
  private flightScore: number = 100
  private totalDistance: number = 0 // NM
  private lastLat: number = 0
  private lastLon: number = 0
  private hasLastPos: boolean = false

  monitorFlight(data: any) {
    // Accumulate distance from GPS
    if (data.latitude && data.longitude) {
      if (this.hasLastPos) {
        const dist = this.haversineNM(this.lastLat, this.lastLon, data.latitude, data.longitude)
        if (dist < 10) this.totalDistance += dist // skip teleport glitches
      }
      this.lastLat = data.latitude
      this.lastLon = data.longitude
      this.hasLastPos = true
    }

    // Only monitor if airborne or taking off
    if (!data.onGround) {
      // Track Max Stats
      if (Math.abs(data.bankAngle) > this.maxBank) this.maxBank = Math.abs(data.bankAngle)
      if (Math.abs(data.gForce) > this.maxG) this.maxG = Math.abs(data.gForce)

      // Penalty: Landing Lights OFF < 10,000 ft
      if (data.altitude < 10000 && data.altitude > 1000 && !data.landingLights) {
        this.logPenalty('Landing Lights OFF below 10,000ft', 5)
      }

      // Penalty: Gear UP < 1,000 ft (Approach/Landing)
      // Logic: Descending, low altitude, gear up
      if (data.altitude < 1000 && data.vertical_speed < -100 && !data.gearDown) {
        this.logPenalty('Landing Gear UP below 1,000ft (Approach)', 10)
      }

      // Penalty: Excessive Bank (> 40)
      if (Math.abs(data.bankAngle) > 40) {
        this.logPenalty('Excessive Bank Angle (> 40°)', 2)
      }
    }
  }

  // Haversine formula: distance between two lat/lon points in NM
  private haversineNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  // Helper to log penalty only once per minute to avoid spamming
  private lastPenaltyTime: Record<string, number> = {}
  logPenalty(message: string, points: number) {
    const now = Date.now()
    if (!this.lastPenaltyTime[message] || now - this.lastPenaltyTime[message] > 60000) {
      this.lastPenaltyTime[message] = now
      this.flightLog.push({
        time: new Date().toLocaleTimeString(),
        message,
        penalty: points
      })
      this.flightScore = Math.max(0, this.flightScore - points)

      // Notify Frontend
      this.window.webContents.send('flight-penalty', {
        message,
        points,
        totalScore: this.flightScore
      })
    }
  }

  // Track if we've already sent a flight-complete event for this flight
  private flightCompleteNotified: boolean = false

  detectParking(data: any) {
    // Parked = on ground + slow speed + (engines off OR parking brake on)
    const isParked =
      data.onGround && data.groundspeed < 5 && (!data.engineRunning || data.parkingBrake)

    if (isParked && !this.flightCompleteNotified && this.wasAirborne) {
      // Only fire if we actually flew (wasAirborne was set to true during flight)

      console.log('[MSFS] Aircraft parked - flight complete')

      // Validate flight duration/distance (simple check: must have been airborne)
      if (this.flightLog.length === 0 && this.flightScore === 100) {
        this.logPenalty('Perfect Flight', 0) // Just to have a log entry
      }

      this.window.webContents.send('flight-complete', {
        timestamp: new Date().toISOString(),
        fuelRemaining: data.fuelQuantity,
        score: this.flightScore,
        grade: this.calculateGrade(this.flightScore),
        events: this.flightLog,
        distanceFlown: Math.round(this.totalDistance),
        stats: {
          maxBank: this.maxBank,
          maxG: this.maxG,
          landingRate: 0 // Will be patched by landing reporter
        }
      })

      try {
        new Notification({
          title: 'Flight Complete!',
          body: `Score: ${this.flightScore} - ${this.calculateGrade(this.flightScore)}`
        }).show()
      } catch (_e) {
        // Notification might fail
      }

      this.flightCompleteNotified = true
    }

    // Reset when aircraft takes off again
    if (!data.onGround && data.groundspeed > 50) {
      if (this.flightCompleteNotified) {
        // New Flight Started - Reset Stats
        this.flightCompleteNotified = false
        this.wasAirborne = false
        this.flightLog = []
        this.flightScore = 100
        this.maxBank = 0
        this.maxG = 0
        this.totalDistance = 0
        this.hasLastPos = false
        this.lastPenaltyTime = {}
        this.window.webContents.send('flight-started', true)
      }
    }
  }

  calculateGrade(score: number): string {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  retryConnection() {
    if (this.interval) clearInterval(this.interval)

    this.interval = setInterval(() => {
      if (!this.connected) {
        this.connect()
      } else {
        if (this.interval) clearInterval(this.interval)
      }
    }, 5000)
  }

  destroy() {
    if (this.interval) clearInterval(this.interval)
    if (this.handle) {
      try {
        this.handle.close()
      } catch (_e) {
        // Ignore
      }
    }
  }
}
