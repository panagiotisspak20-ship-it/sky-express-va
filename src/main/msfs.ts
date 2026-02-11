import { Notification } from 'electron'
import { open, Protocol, SimConnectConnection } from 'node-simconnect'

export class MsfsService {
  private handle: SimConnectConnection | null = null
  private connected: boolean = false
  private interval: NodeJS.Timeout | null = null
  private window: Electron.BrowserWindow
  private wasOnGround: boolean = true
  private wasAirborne: boolean = false
  private recentVerticalSpeeds: number[] = []
  private retryCount: number = 0
  private dataDefinitionId: number = 1
  private dataRequestId: number = 1

  constructor(window: Electron.BrowserWindow) {
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

      if (this.retryCount <= 3) {
        console.log(`[MSFS] Attempting connection... (attempt ${this.retryCount})`)
      }

      // Try to connect with MSFS 2024 protocol first, fall back to FSX_SP2
      const { recvOpen, handle } = await open('Sky Express VA', Protocol.KittyHawk)

      console.log('[MSFS] ✓ Connected to', recvOpen.applicationName)
      this.connected = true
      this.retryCount = 0
      this.handle = handle
      this.window.webContents.send('msfs-status', true)
      this.window.webContents.send('msfs-error', null)

      try {
        new Notification({
          title: 'Sky Express VA',
          body: `Connected to ${recvOpen.applicationName}`
        }).show()
      } catch (_e) {
        // Notification might fail in some environments
      }

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

      // Define the data we want to receive
      handle.addToDataDefinition(
        this.dataDefinitionId,
        'PLANE LATITUDE',
        'degrees',
        5 // FLOAT64
      )
      handle.addToDataDefinition(this.dataDefinitionId, 'PLANE LONGITUDE', 'degrees', 5)
      handle.addToDataDefinition(this.dataDefinitionId, 'PLANE ALTITUDE', 'feet', 5)
      handle.addToDataDefinition(this.dataDefinitionId, 'PLANE HEADING DEGREES TRUE', 'degrees', 5)
      handle.addToDataDefinition(this.dataDefinitionId, 'AIRSPEED INDICATED', 'knots', 5)
      handle.addToDataDefinition(this.dataDefinitionId, 'GROUND VELOCITY', 'knots', 5)
      handle.addToDataDefinition(this.dataDefinitionId, 'VERTICAL SPEED', 'feet/minute', 5)
      handle.addToDataDefinition(
        this.dataDefinitionId,
        'SIM ON GROUND',
        'bool',
        4 // INT32
      )
      // Engine and parking brake for parking detection
      handle.addToDataDefinition(
        this.dataDefinitionId,
        'ENG COMBUSTION:1',
        'bool',
        4 // INT32
      )
      handle.addToDataDefinition(
        this.dataDefinitionId,
        'BRAKE PARKING POSITION',
        'bool',
        4 // INT32
      )
      // Fuel for tracking
      handle.addToDataDefinition(this.dataDefinitionId, 'FUEL TOTAL QUANTITY', 'gallons', 5)
      // Bank angle for scoring
      handle.addToDataDefinition(this.dataDefinitionId, 'PLANE BANK DEGREES', 'degrees', 5)
      // G-Force for scoring
      handle.addToDataDefinition(this.dataDefinitionId, 'G FORCE', 'GForce', 5)
      // Landing Lights for scoring
      handle.addToDataDefinition(
        this.dataDefinitionId,
        'LIGHT LANDING',
        'bool',
        4 // INT32
      )
      // Gear position for scoring
      handle.addToDataDefinition(
        this.dataDefinitionId,
        'GEAR HANDLE POSITION',
        'bool',
        4 // INT32
      )

      // Handle incoming data
      handle.on('simObjectData', (recvData) => {
        if (recvData.requestID === this.dataRequestId) {
          try {
            const data = recvData.data
            const telemetry = {
              latitude: data.readFloat64(),
              longitude: data.readFloat64(),
              altitude: data.readFloat64(),
              heading: data.readFloat64(),
              speed: data.readFloat64(),
              groundspeed: data.readFloat64(),
              vertical_speed: data.readFloat64(),
              onGround: data.readInt32() !== 0,
              engineRunning: data.readInt32() !== 0,
              parkingBrake: data.readInt32() !== 0,
              fuelQuantity: data.readFloat64(),
              bankAngle: data.readFloat64(),
              gForce: data.readFloat64(),
              landingLights: data.readInt32() !== 0,
              gearDown: data.readInt32() !== 0
            }

            // Track if aircraft was ever airborne this session
            if (!telemetry.onGround && telemetry.groundspeed > 50) {
              this.wasAirborne = true
            }

            this.detectLanding(telemetry)
            this.monitorFlight(telemetry)
            this.detectParking(telemetry)
            this.window.webContents.send('msfs-data', telemetry)
          } catch (_e) {
            // Ignore data parsing errors
          }
        }
      })

      // Request data every second
      handle.requestDataOnSimObject(
        this.dataRequestId,
        this.dataDefinitionId,
        0, // SIMCONNECT_OBJECT_ID_USER
        4, // SIMCONNECT_PERIOD_SECOND
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
      this.window.webContents.send('flight-penalty', { message, points, totalScore: this.flightScore })
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
