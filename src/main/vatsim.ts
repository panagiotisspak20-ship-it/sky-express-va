// VATSIM live data service

export interface VatsimPilot {
  cid: number
  name: string
  callsign: string
  server: string
  pilot_rating: number
  latitude: number
  longitude: number
  altitude: number
  groundspeed: number
  transponder: string
  heading: number
  qnh_i_hg: number
  qnh_mb: number
  flight_plan?: {
    flight_rules: string
    aircraft: string
    aircraft_faa: string
    aircraft_short: string
    departure: string
    arrival: string
    alternate: string
    cruise_tas: string
    altitude: string
    deptime: string
    enroute_time: string
    fuel_time: string
    remarks: string
    route: string
    revision_id: number
    assigned_transponder: string
  }
  logon_time: string
  last_updated: string
}

export class VatsimService {
  private cachedPilots: VatsimPilot[] = []
  private lastFetchTime: number = 0
  private readonly CACHE_DURATION_MS = 15000 // 15 seconds
  private isFetching = false

  constructor() {
    // Initial fetch
    this.fetchData().catch((e) => console.error('[VATSIM] Initial fetch failed:', e))
  }

  private async fetchData(): Promise<void> {
    if (this.isFetching) return
    const now = Date.now()

    // Use cache if it's fresh
    if (this.cachedPilots.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION_MS) {
      return
    }

    this.isFetching = true
    try {
      // In Electron main process, `net.fetch` is preferred over global `fetch`
      // but standard fetch is available in modern Node.
      const response = await fetch('https://data.vatsim.net/v3/vatsim-data.json', {
        cache: 'no-store',
        headers: {
          'User-Agent': 'SkyExpressVA/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`VATSIM API HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data && Array.isArray(data.pilots)) {
        this.cachedPilots = data.pilots
        this.lastFetchTime = Date.now()
        // console.log(`[VATSIM] Refreshed data. Online pilots: ${this.cachedPilots.length}`)
      } else {
        throw new Error('Invalid VATSIM data format received')
      }
    } catch (error) {
      console.error('[VATSIM] Error fetching live data:', error)
    } finally {
      this.isFetching = false
    }
  }

  /**
   * Retrieves live flight data for a specific VATSIM ID.
   * If the cache is stale, it will transparently refresh before returning.
   */
  public async getPilot(cidString: string): Promise<VatsimPilot | null> {
    if (!cidString || cidString.trim() === '') return null

    const cid = parseInt(cidString, 10)
    if (isNaN(cid)) return null

    // Ensure our data is fresh before looking for the pilot
    await this.fetchData()

    const pilot = this.cachedPilots.find((p) => p.cid === cid)
    return pilot || null
  }

  /**
   * Returns a lightweight array of all currently online pilots specifically formatted for the Live Map
   */
  public async getAllPilots() {
    await this.fetchData()
    return this.cachedPilots.map((p) => ({
      callsign: p.callsign,
      lat: p.latitude,
      lon: p.longitude,
      alt: p.altitude,
      hdg: p.heading,
      dep: p.flight_plan?.departure || '',
      arr: p.flight_plan?.arrival || ''
    }))
  }
}

export const vatsimService = new VatsimService()
