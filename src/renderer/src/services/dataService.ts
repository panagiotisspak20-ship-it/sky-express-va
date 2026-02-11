import { supabase } from './supabase'

export interface BookedFlight {
  id: string // Unique ID (confirmation number)
  flightNumber: string // e.g. "SEH1024"
  departure: string // ICAO
  arrival: string // ICAO
  aircraft: string
  aircraftName?: string // Full aircraft name
  registration?: string // Aircraft registration
  scheduledDeparture: string // Local time string
  scheduledArrival: string // Local time string
  scheduledDepartureZulu: string // Zulu time string
  scheduledArrivalZulu: string // Zulu time string
  flightTime?: string // Estimated flight time
  distance?: number // Route distance in NM
  cruiseAlt?: number // Cruise altitude in FL
  blockFuel?: number // Block fuel in kg
  status: 'booked' | 'in-progress' | 'completed'
  ofpData: any // Full SimBrief OFP JSON
  bookedAt: string // ISO timestamp
}

export interface PilotProfile {
  id: string // Now this will be the Supabase User UUID
  callsign: string
  avatar_url?: string // New field for profile photo URL
  rank: string
  homeBase: string
  currentLocation: string
  flightHours: number
  balance: number
  reputation: number
  simBriefUsername?: string
  simBriefId?: string
  tutorialComplete?: boolean
  isAdmin?: boolean
  status?: 'active' | 'suspended' | 'banned'
  // Password is no longer stored locally - handled by Supabase Auth
}

export interface FlightLogEntry {
  id: string
  date: string
  flightNumber: string
  departure: string
  arrival: string
  aircraft: string
  duration: number // in minutes
  landingRate?: number // FPM
  distance?: number
  score: number
  earnings: number
  maxAltitude?: number
  maxSpeed?: number
  fuelUsed?: number
  distanceFlown?: number
  actualDepartureTime?: string
  actualArrivalTime?: string
  blockOffTime?: string // Pushback/Taxi Out
  blockOnTime?: string // Parking/Engine Off
  events?: {
    time: string
    description: string
    penalty?: number
    type?: 'info' | 'warning' | 'penalty' | 'bonus'
  }[]
  otp?: {
    scheduledDeparture: string
    actualDeparture: string
    diffMinutes: number
    status: 'On Time' | 'Delayed' | 'Early'
  }
  systemStats?: {
    landingLightsOffBelow10k?: boolean
    gearExtensionAlt?: number
    maxBankAngle?: number
    maxPitchAngle?: number
    flapOverspeed?: boolean
  }
}

const DEFAULT_PROFILE: PilotProfile = {
  id: 'GUEST',
  callsign: 'GUEST',
  rank: 'Cadet',
  homeBase: 'LGAV',
  currentLocation: 'LGAV',
  flightHours: 0,
  balance: 0,
  reputation: 100
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: PilotProfile // joined
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  is_read: boolean
  created_at: string
  sender?: PilotProfile
}

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'resolved' | 'closed'
  message: string // initial message
  created_at: string
  user?: PilotProfile
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  created_at: string
  sender?: PilotProfile
  ticket?: SupportTicket
}

export interface SystemAnnouncement {
  id: string
  message: string
  author_id: string
  created_at: string
  is_active: boolean
  author?: PilotProfile
}

export const DataService = {
  async cleanupFlightDuplicates(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_flight_duplicates')
    if (error) {
      console.error('Cleanup RPC error:', error)
      throw error
    }
  },

  // --- AUTOMATION RPC ---

  // --- PROFILE ---

  async getProfile(): Promise<PilotProfile> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return DEFAULT_PROFILE

    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (error) throw error
      if (data) {
        return {
          id: data.id,
          callsign: data.callsign,
          avatar_url: data.avatar_url, // Map from DB
          rank: 'Cadet', // Could be stored in DB later
          homeBase: data.home_base || 'LGAV',
          currentLocation: (data.current_location as any)?.icao || data.home_base || 'LGAV', // Simplified for now
          flightHours: Number(data.flight_hours) || 0,
          balance: Number(data.balance) || 0,
          reputation: 100,
          simBriefUsername: data.simbrief_username,
          simBriefId: data.simbrief_id,
          isAdmin: data.is_admin || false,
          status: data.status || 'active',
          // Store tutorial complete in local storage for now to avoid DB schema change for MVP
          tutorialComplete: localStorage.getItem(`tutorial_${user.id}`) === 'true'
        }
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    }

    return DEFAULT_PROFILE
  },

  async updateProfile(updates: Partial<PilotProfile>) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    // Map frontend fields to DB columns
    const dbUpdates: Record<string, any> = {}
    if (updates.flightHours !== undefined) dbUpdates.flight_hours = updates.flightHours
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance
    if (updates.simBriefUsername !== undefined)
      dbUpdates.simbrief_username = updates.simBriefUsername
    if (updates.simBriefId !== undefined) dbUpdates.simbrief_id = updates.simBriefId
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url

    // Handle tutorial separately (local for now)
    if (updates.tutorialComplete !== undefined) {
      localStorage.setItem(`tutorial_${user.id}`, String(updates.tutorialComplete))
    }

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', user.id)
      if (error) throw error
    }
  },

  // --- BOOKED FLIGHTS (Local Storage for MVP, could move to DB later) ---
  // Keeping this local means booked flights are per-machine, which is acceptable for v1 Multiplayer

  async getBookedFlights(): Promise<BookedFlight[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []
    const key = `bookedFlights_${user.id}`
    try {
      const api = (window as any).api
      if (api?.store) {
        return (await api.store.get(key)) || []
      }
      const local = localStorage.getItem(key)
      return local ? JSON.parse(local) : []
    } catch (e) {
      return []
    }
  },

  async addBookedFlight(flight: BookedFlight) {
    const flights = await this.getBookedFlights()
    const updated = [...flights, flight]
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const key = `bookedFlights_${user.id}`
    const api = (window as any).api
    if (api?.store) await api.store.set(key, updated)
    else localStorage.setItem(key, JSON.stringify(updated))
  },

  async updateFlightStatus(id: string, status: BookedFlight['status']) {
    const flights = await this.getBookedFlights()
    const updated = flights.map((f) => (f.id === id ? { ...f, status } : f))
    await this.saveBookedFlights(updated)
    return updated
  },

  async updateBookedFlight(id: string, updates: Partial<BookedFlight>) {
    const flights = await this.getBookedFlights()
    const updated = flights.map((f) => (f.id === id ? { ...f, ...updates } : f))
    await this.saveBookedFlights(updated)
    return updated
  },

  async deleteBookedFlight(id: string) {
    const flights = await this.getBookedFlights()
    const updated = flights.filter((f) => f.id !== id)
    await this.saveBookedFlights(updated)
    return updated
  },

  async saveBookedFlights(flights: BookedFlight[]) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return
    const key = `bookedFlights_${user.id}`
    const api = (window as any).api
    if (api?.store) await api.store.set(key, flights)
    else localStorage.setItem(key, JSON.stringify(flights))
  },

  // --- FLIGHT LOGS (Local for MVP) ---

  async getPireps(pilotId?: string): Promise<any[]> {
    const query = supabase
      .from('completed_flights')
      .select('*, profiles(callsign)')
      .order('created_at', { ascending: false })

    if (pilotId) {
      query.eq('pilot_id', pilotId)
    }

    const { data, error } = await query
    if (error) {
       console.error('Error fetching PIREPs:', error)
       return []
    }
    return data
  },

  async getPirep(flightId: string): Promise<any> {
    const { data, error } = await supabase
      .from('completed_flights')
      .select('*, profiles(callsign)')
      .eq('id', flightId)
      .single()

    if (error) {
       console.error('Error fetching PIREP:', error)
       return null
    }
    return data
  },

  async getFlightLog(): Promise<FlightLogEntry[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    // Primary: read from Supabase cloud
    const { data, error } = await supabase
      .from('completed_flights')
      .select('*')
      .eq('pilot_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        date: row.created_at,
        flightNumber: row.flight_number || '',
        departure: row.departure_icao || '',
        arrival: row.arrival_icao || '',
        aircraft: row.aircraft_type || '',
        duration: row.flight_time || 0,
        landingRate: row.landing_rate,
        distance: row.distance,
        score: row.score ?? 100,
        earnings: row.revenue || 0,
        events: row.flight_events || []
      }))
    }

    // Fallback: read from local store if cloud fails
    console.warn('[DataService] Cloud flight log unavailable, falling back to local:', error)
    const key = `flightLog_${user.id}`
    const api = (window as any).api
    if (api?.store) return (await api.store.get(key)) || []
    return []
  },

  async addFlightLog(entry: FlightLogEntry & { score?: number; events?: any[]; flight_data?: any; max_bank?: number; max_g?: number; landing_lights_penalty?: boolean }) {
    const log = await this.getFlightLog()
    const newLog = [entry, ...log]
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const key = `flightLog_${user.id}`
    const api = (window as any).api
    if (api?.store) await api.store.set(key, newLog)

    // Update CLOUD stats (PIREP)
    const { error } = await supabase.from('completed_flights').insert({
        pilot_id: user.id,
        flight_number: entry.flightNumber,
        departure_icao: entry.departure,
        arrival_icao: entry.arrival,
        aircraft_type: entry.aircraft,
        flight_time: entry.duration, // minutes
        distance: entry.distanceFlown || entry.distance,
        landing_rate: entry.landingRate,
        revenue: entry.earnings,
        score: entry.score || 100,
        flight_events: entry.events || [],
        max_bank: entry.max_bank || 0,
        max_g: entry.max_g || 1,
        landing_lights_penalty: entry.landing_lights_penalty || false
    })

    if (error) console.error('Error saving PIREP to cloud:', error)

    // Update Profile Stats
    const profile = await this.getProfile()
    if (profile) {
      await this.updateProfile({
        flightHours: profile.flightHours + entry.duration / 60,
        balance: profile.balance + entry.earnings
      })
    }
    return newLog
  },

  // --- AUTHENTICATION (SUPABASE) ---

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Note: We use Email for Supabase Auth, but user enters Callsign?
    // STRATEGY: We will assume email is callsign@skyexpress.va OR allow user to input email.
    // For simplicity in this Virtual Airline:
    // We will change the Login Form to accept Email.
    // OR we can do a lookup? No, Supabase Auth needs email.
    // Let's assume the user registered with Email.

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async logout() {
    await supabase.auth.signOut()
  },

  async isAuthenticated(): Promise<boolean> {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    return !!session
  },

  async checkCallsignAvailable(callsign: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('callsign')
      .eq('callsign', callsign)
      .single()

    // If we found a row, it's taken.
    // If error code is 'PGRST116' (row not found), it's available.
    if (data) return false
    return true
  },

  async generateCallsign(): Promise<string> {
    let callsign = ''
    let available = false
    while (!available) {
      const num = Math.floor(Math.random() * 9000) + 1000
      callsign = `SEH${num}`
      available = await this.checkCallsignAvailable(callsign)
    }
    return callsign
  },

  async register(data: {
    callsign: string
    name: string
    homeBase: string
    password: string
    email: string
    isAdmin?: boolean
  }) {
    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Registration failed')

    // Check if session was created (implies auto-confirm is ON)
    if (!authData.session) {
      console.warn('User created but no session. Email confirmation likely enabled.')
      throw new Error(
        "Registration successful, but Log In failed. Please DISABLE 'Confirm Email' in Supabase Auth Settings, or verify your email."
      )
    }

    // 2. Create Profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      callsign: data.callsign.toUpperCase(),
      home_base: data.homeBase,
      balance: 0,
      flight_hours: 0,
      is_admin: data.isAdmin || false
    })

    if (profileError) {
      console.error('Profile creation failed', profileError)
      throw new Error(
        `Failed to create pilot profile: ${profileError.message} (${profileError.details || profileError.code})`
      )
    }

    return authData.user
  },

  // --- SUPPORT SYSTEM ---

  async createSupportTicket(subject: string, message: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Create Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        status: 'open',
        message // Kept for legacy/preview
      })
      .select()
      .single()

    if (ticketError) throw ticketError

    // 2. Add as first message
    if (ticket) {
      await this.sendTicketMessage(ticket.id, message)
    }
  },

  async getSupportTickets(all: boolean = false): Promise<SupportTicket[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('support_tickets')
      .select('*, profiles(callsign)')
      .order('created_at', { ascending: false })

    if (!all) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching tickets:', error)
      return []
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])?.map(t => ({
      ...t,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: (t as any).profiles
    })) as unknown as SupportTicket[]
  },

  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*, profiles(callsign, is_admin)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) console.error('Error fetching messages:', error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])?.map(m => ({
      ...m,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sender: (m as any).profiles
    })) as unknown as SupportMessage[]
  },

  async sendTicketMessage(ticketId: string, message: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message: message
    })

    if (error) throw error
  },

  async resolveTicket(ticketId: string) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'resolved' })
      .eq('id', ticketId)

    if (error) throw error
  },

  async deleteSupportTicket(ticketId: string) {
    const { error } = await supabase.from('support_tickets').delete().eq('id', ticketId)

    if (error) throw error
  },

  // --- ACCOUNT MANAGEMENT ---
  async deleteAccount() {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    try {
      // 1. Call the secure RPC function to delete the user from auth.users
      // This works because we created the 'delete_user' function in Supabase
      const { error } = await supabase.rpc('delete_user')

      if (error) {
        console.error('Error deleting user account:', error)
        throw error
      }

      // 2. Clear Local Storage
      localStorage.removeItem(`tutorial_${user.id}`)
      localStorage.removeItem(`bookedFlights_${user.id}`)
      localStorage.removeItem(`flightLog_${user.id}`)

      // 3. Electron Store (attempt to clear specific user keys if possible)
      const api = (window as any).api
      if (api?.store) {
        await api.store.delete(`bookedFlights_${user.id}`)
        await api.store.delete(`flightLog_${user.id}`)
      }

      // 4. Sign Out (client side cleanup, though the session is invalid now)
      await supabase.auth.signOut()
      return true
    } catch (err) {
      console.error('Delete account error:', err)
      throw err
    }
  },

  // --- PROFILE PHOTO ---

  async uploadProfilePhoto(file: File): Promise<string> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Create a unique file path: avatars/USER_ID/timestamp.png
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    // Get Public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  },

  // --- SIMBRIEF INTEGRATION ---

  async getLatestOFP(username: string): Promise<any> {
    try {
      // Fetch JSON from SimBrief
      const response = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?username=${username}&json=1`
      )
      if (!response.ok) {
        throw new Error(`SimBrief API Error: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch SimBrief OFP:', error)
      throw error
    }
  },

  // --- SOCIAL & COMMUNITY ---

  async getAllPilots(): Promise<PilotProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('flight_hours', { ascending: false })

    if (error) {
      console.error('Error fetching pilots:', error)
      return []
    }

    // Map to PilotProfile interface
    return (data || []).map((p) => ({
      id: p.id,
      callsign: p.callsign,
      avatar_url: p.avatar_url,
      rank: 'Cadet', // Logic needed if rank stored in DB
      homeBase: p.home_base,
      currentLocation: (p.current_location as any)?.icao || p.home_base,
      flightHours: Number(p.flight_hours),
      balance: Number(p.balance),
      reputation: 100,
      isAdmin: p.is_admin,
      status: p.status || 'active'
    }))
  },

  async followPilot(targetId: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('social_connections')
      .insert({ follower_id: user.id, following_id: targetId })

    if (error) throw error
  },

  async unfollowPilot(targetId: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetId)

    if (error) throw error
  },

  async getFollowing(): Promise<string[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('social_connections')
      .select('following_id')
      .eq('follower_id', user.id)

    return data ? data.map((d) => d.following_id) : []
  },

  // --- FRIEND REQUESTS ---

  async sendConnectionRequest(targetId: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    // Check if reverse request exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', targetId)
      .eq('receiver_id', user.id)
      .single()

    if (existing) {
      // Auto-accept if they already requested us
      await this.respondToRequest(existing.id, true)
      return
    }

    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: targetId,
      status: 'pending'
    })

    if (error) {
      // Ignore unique constraint error (means request already sent)
      if (error.code !== '23505') throw error
    }
  },

  async getPendingRequests(): Promise<FriendRequest[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*, sender:profiles!sender_id(callsign)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching requests:', error)
      return []
    }
    // We can map the joined sender data effectively if needed, but Supabase returns it nested.
    // The type definition expects it nested.
    return (data as unknown as FriendRequest[]) || []
  },

  async respondToRequest(requestId: string, accept: boolean) {
    if (accept) {
      // 1. Update request status
      const { data: request, error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      // 2. Create mutual social connections (follows)
      if (request) {
        await Promise.all([
          this.followPilot(request.sender_id), // Me follow them
          // They follow me (insert manually/admin-like or just rely on 'friends' concept?
          // For now, we reuse social_connections for "Connected" state if needed,
          // OR purely rely on friend_requests table. 
          // Let's rely on social_connections logic for now to keep SocialHub simple, 
          // or we can insert the reverse connection manually here:
          supabase.from('social_connections').insert({
            follower_id: request.sender_id,
            following_id: request.receiver_id
          })
        ])
      }
      // Reject: delete request
      const { error: deleteError } = await supabase.from('friend_requests').delete().eq('id', requestId)
      if (deleteError) throw deleteError
    }
  },

  // --- ANNOUNCEMENTS ---

  async createAnnouncement(message: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('system_announcements').insert({
      message,
      author_id: user.id
    })

    if (error) throw error
  },

  async getActiveAnnouncements(): Promise<SystemAnnouncement[]> {
    const { data, error } = await supabase
      .from('system_announcements')
      .select('*, author:profiles(callsign)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])?.map((a) => ({
      ...a,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      author: (a as any).author
    })) as unknown as SystemAnnouncement[]
  },

  async deleteAnnouncement(id: string) {
    const { error } = await supabase.from('system_announcements').delete().eq('id', id)
    if (error) throw error
  },

  // --- ADMIN USER MANAGEMENT ---
  async adminUpdatePilot(pilotId: string, updates: Partial<PilotProfile>) {
    // Map frontend field names to database column names
    const dbUpdates: Record<string, any> = {}
    if (updates.flightHours !== undefined) dbUpdates.flight_hours = updates.flightHours
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance
    if (updates.reputation !== undefined) dbUpdates.reputation = updates.reputation
    if (updates.rank !== undefined) dbUpdates.rank = updates.rank
    if (updates.homeBase !== undefined) dbUpdates.home_base = updates.homeBase
    if (updates.currentLocation !== undefined) dbUpdates.current_location = updates.currentLocation
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.callsign !== undefined) dbUpdates.callsign = updates.callsign

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', pilotId)
    if (error) throw error
  },

  async acceptRequestFrom(targetId: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    // Find the request
    const { data: request, error } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', targetId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .single()

    if (error || !request) {
      console.error('Error finding request to accept:', error)
      throw new Error('No pending request found from this pilot.')
    }

    await this.respondToRequest(request.id, true)
  },

  async removeConnection(targetId: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    // Use RPC to securely delete both directions
    const { error } = await supabase.rpc('break_connection', { target_id: targetId })
    
    // Fallback if RPC doesn't exist yet (for older DB state)
    if (error) {
      console.warn('RPC break_connection failed, falling back to manual delete', error)
      // Attempt manual delete (legacy)
      await supabase.from('social_connections').delete().or(`and(follower_id.eq.${user.id},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${user.id})`)
      await supabase.from('friend_requests').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`)
    }
  },

  async getConnectionStatus(targetId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'connected'> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return 'none'

    // Check confirmed connection (social_connections)
    // Note: This relies on "following" logic. If we fully switch to friends, 
    // we should check friend_requests with status='accepted'.
    // Faster check: do I follow them?
    const following = await this.getFollowing()
    if (following.includes(targetId)) return 'connected'

    // Check pending requests
    const { data: sent } = await supabase
      .from('friend_requests')
      .select('status')
      .eq('sender_id', user.id)
      .eq('receiver_id', targetId)
      .single()

    if (sent) {
      return sent.status === 'accepted' ? 'connected' : 'pending_sent'
    }

    const { data: received } = await supabase
      .from('friend_requests')
      .select('status')
      .eq('sender_id', targetId)
      .eq('receiver_id', user.id)
      .single()

    if (received) {
      return received.status === 'accepted' ? 'connected' : 'pending_received'
    }

    return 'none'
  },

  // --- DIRECT MESSAGING ---

  async getDirectMessages(otherUserId: string): Promise<DirectMessage[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch messages where (sender=Me AND receiver=Other) OR (sender=Other AND receiver=Me)
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*, sender:profiles!sender_id(callsign, avatar_url)') // Join sender profile
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching DMs:', error)
      return []
    }
    return (data as unknown as DirectMessage[]) || []
  },

  async sendDirectMessage(receiverId: string, message: string) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      message: message
    })

    if (error) throw error
  },

  async getUnreadMessageCount(): Promise<number> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error counting unread messages:', error)
      return 0
    }
    return count || 0
  },

  async getUnreadDirectMessages(): Promise<DirectMessage[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*, sender:profiles!sender_id(callsign, avatar_url)')
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unread messages:', error)
      return []
    }
    return (data as unknown as DirectMessage[]) || []
  },

  async markDMsAsRead(senderId: string) {
    // Uses RPC function for safety/easier RLS
    const { error } = await supabase.rpc('mark_dms_read', { sender_uuid: senderId })
    if (error) console.error('Error marking DMs read:', error)
  },

  async getUnreadSupportCount(): Promise<number> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('support_messages')
      .select('*, ticket:support_tickets!inner(user_id)', { count: 'exact', head: true })
      .neq('sender_id', user.id) // Not sent by me
      .eq('is_read', false)
    
    if (error) {
      console.error('Error counting unread support:', error)
      return 0
    }
    return count || 0
  },

  async getUnreadSupportMessages(): Promise<any[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('support_messages')
      .select('*, ticket:support_tickets!inner(user_id, subject)')
      .neq('sender_id', user.id) // Not sent by me
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unread support:', error)
      return []
    }
    return data || []
  },

  async markTicketMessagesAsRead(ticketId: string) {
    const { error } = await supabase.rpc('mark_ticket_read', { ticket_uuid: ticketId })
    if (error) console.error('Error marking support read:', error)
  },

  async syncFlightSchedules(airlineIata: string, apiKey: string): Promise<{ message: string }> {
      try {
         // 1. Fetch from Main Process (Bypasses CORS)
         const api = (window as any).api
         if (!api?.airlabs) throw new Error('AirLabs API not available in this environment')
         
         const data = await api.airlabs.getSchedules(airlineIata, apiKey)
         const schedules = data.response || []
         
         if (schedules.length === 0) {
             return { message: 'No schedules found for this airline.' }
         }

         // 2. Process Data (Map AirLabs format to DB format)
         const processedFlights: any[] = []
         
         for (const route of schedules) {
            try {
                if (!route.dep_time || typeof route.dep_time !== 'string') continue;
                
                // Parse Time "HH:MM"
                const parts = route.dep_time.split(':')
                if (parts.length !== 2) continue;
                
                const depH = parseInt(parts[0], 10)
                const depM = parseInt(parts[1], 10)
                
                if (isNaN(depH) || isNaN(depM)) continue;

                // Create Date for TODAY
                const depTime = new Date()
                depTime.setHours(depH, depM, 0, 0)
                
                // Handle invalid date
                if (isNaN(depTime.getTime())) continue;

                // Duration
                const duration = Number(route.duration) || 60
                const arrTime = new Date(depTime.getTime() + duration * 60000)

                processedFlights.push({
                    flight_number: route.flight_iata || `GQ${Math.floor(Math.random()*999)}`,
                    dep_icao: route.dep_icao || 'LGAV',
                    arr_icao: route.arr_icao || 'LGTS',
                    departure_time: depTime.toISOString(),
                    arrival_time: arrTime.toISOString(),
                    aircraft_type: route.aircraft_icao || 'A320',
                    duration: duration,
                    // days: route.days -- Column does not exist in DB
                    airline_icao: route.airline_icao || 'GQE'
                })
            } catch (e) {
                console.warn('Skipping invalid flight route:', route, e)
            }
         }

         // 3. Sync Strategy: Replace 'scheduled' flights for the day
         // (Since we don't have a unique constraint for UPSERT, we clear and re-add)
         
         // 3. Sync Strategy: Replace 'scheduled' flights for the NEXT 30 DAYS
         // (Since we don't have a unique constraint for UPSERT, we clear and re-add)
         
         const now = new Date()
         const start = new Date(now)
         start.setHours(0, 0, 0, 0)
         
         const daysToSync = 30
         const end = new Date(now)
         end.setDate(end.getDate() + daysToSync)
         end.setHours(23, 59, 59, 999)

         // A. Delete existing SCHEDULED flights for this range to prevent duplicates
         const { error: deleteError } = await supabase
            .from('flight_schedules')
            .delete()
            .eq('status', 'scheduled') 
            .gte('departure_time', start.toISOString())
            .lte('departure_time', end.toISOString())
         
         if (deleteError) {
             console.error('Error clearing old schedules:', deleteError)
             throw deleteError
         }

         // B. Generate and Insert New for 30 days
         const allFlightsToInsert: any[] = []

         for (let i = 0; i < daysToSync; i++) {
            const currentDay = new Date(start)
            currentDay.setDate(currentDay.getDate() + i)
            
            // For each route in our processed list (which was based on "today's" schedule or generic schedule)
            // we create a concrete flight for 'currentDay'.
            // Note: 'processedFlights' currently has hardcoded dates for "today".
            // We need to re-generate the timestamp for each day.
            
            for (const route of schedules) {
                try {
                    if (!route.dep_time || typeof route.dep_time !== 'string') continue;

                    const parts = route.dep_time.split(':')
                    if (parts.length !== 2) continue;
                    
                    const depH = parseInt(parts[0], 10)
                    const depM = parseInt(parts[1], 10)
                    
                    if (isNaN(depH) || isNaN(depM)) continue;

                    // Set time for current iteration day
                    const depTime = new Date(currentDay)
                    depTime.setHours(depH, depM, 0, 0)
                    
                    if (isNaN(depTime.getTime())) continue;

                    const duration = Number(route.duration) || 60
                    const arrTime = new Date(depTime.getTime() + duration * 60000)

                    // Basic check: Filter by days running?
                    // route.days is like "1234567" (Mon-Sun). 
                    // JS getDay(): 0=Sun, 1=Mon...6=Sat.
                    // AirLabs usually uses 1=Mon...7=Sun? Or similar.
                    // Let's assume inclusive. If route.days is string of digits.
                    let runDay = depTime.getDay() // 0-6
                    if (runDay === 0) runDay = 7 // Convert Sun 0 to 7 to match typical aviation standard if needed
                    
                    // If route.days exists and doesn't include this day, skip.
                    // If route.days is null/empty, assume daily.
                    if (route.days && !route.days.includes(String(runDay))) {
                         continue;
                    }

                    allFlightsToInsert.push({
                        flight_number: route.flight_iata || `GQ${Math.floor(Math.random()*999)}`,
                        dep_icao: route.dep_icao || 'LGAV',
                        arr_icao: route.arr_icao || 'LGTS',
                        departure_time: depTime.toISOString(),
                        arrival_time: arrTime.toISOString(),
                        aircraft_type: route.aircraft_icao || 'A320',
                        duration: duration,
                        airline_icao: route.airline_icao || 'GQE'
                    })
                } catch (err) {
                   // ignore
                }
            }
         }

         if (allFlightsToInsert.length > 0) {
             // Insert in chunks to avoid payload limit? 30 days * 50 flights = 1500 rows. Should be fine.
             const { error } = await supabase.from('flight_schedules').insert(allFlightsToInsert)
             if (error) throw error
         }

         return { message: `Successfully synced ${allFlightsToInsert.length} flights for the next ${daysToSync} days.` }
      } catch (err: any) {
          console.error('Sync Error:', err)
          throw new Error(err.message || 'Sync Failed')
      }
  }
}
