import { useState, useEffect, useCallback, useRef } from 'react'
import { DataService, PilotProfile, SystemAnnouncement } from '../services/dataService'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import {
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  User,
  Send,
  X,
  RefreshCw,
  Lock,
  Trash2,
  Users,
  Megaphone,
  Edit,
  Ban,
  CheckCircle2
} from 'lucide-react'

interface SupportTicket {
  id: string
  created_at: string
  subject: string
  message: string // Initial message
  status: 'open' | 'resolved' | 'pending' | 'closed'
  profiles?: {
    callsign: string
  }
}

export default function AdminDashboard(): React.ReactElement {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [responseText, setResponseText] = useState('')
  const [sending, setSending] = useState(false)

  // Chat state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Sync State
  const [syncing, setSyncing] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [syncResult, setSyncResult] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<'support' | 'users' | 'announcements'>('support')

  // User Management State
  const [pilots, setPilots] = useState<PilotProfile[]>([])
  const [filteredPilots, setFilteredPilots] = useState<PilotProfile[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [editingPilot, setEditingPilot] = useState<PilotProfile | null>(null)
  const [editForm, setEditForm] = useState<Partial<PilotProfile>>({})

  // Announcements State
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [newAnnouncement, setNewAnnouncement] = useState('')

  // Check admin status
  const checkAdmin = useCallback(async (): Promise<void> => {
    const profile = await DataService.getProfile()
    if (!profile.isAdmin) {
      navigate('/')
    }
  }, [navigate])

  const handleLogout = async (): Promise<void> => {
    await DataService.logout()
    navigate('/login')
  }

  const fetchTickets = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await DataService.getSupportTickets(true)
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPilots = useCallback(async (): Promise<void> => {
    try {
      const data = await DataService.getAllPilots()
      setPilots(data)
      setFilteredPilots(data)
    } catch (error) {
      console.error('Error fetching pilots:', error)
    }
  }, [])

  const fetchAnnouncements = useCallback(async (): Promise<void> => {
    try {
      const data = await DataService.getActiveAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }, [])

  // Refs for stable access in callbacks
  const selectedTicketRef = useRef<SupportTicket | null>(null)

  useEffect(() => {
    selectedTicketRef.current = selectedTicket
  }, [selectedTicket])

  useEffect(() => {
    checkAdmin()
    fetchTickets()
    fetchPilots()
    fetchAnnouncements()
  }, [checkAdmin, fetchTickets, fetchPilots, fetchAnnouncements])

  // Realtime Subscriptions (Stable)
  useEffect(() => {
    console.log('🔌 Initializing Admin Realtime Subscription...')
    const channel = supabase
      .channel('admin_support_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        (payload) => {
          console.log('🎫 Ticket Update:', payload)
          fetchTickets()
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          console.log('💬 Message Update:', payload)
          // Check if we are viewing this ticket using the Ref
          const currentTicket = selectedTicketRef.current
          // @ts-ignore
          if (currentTicket?.id === payload.new.ticket_id) {
            console.log('  -> Refreshing chat for active ticket')
            // @ts-ignore
            fetchMessages(payload.new.ticket_id)
          }
          fetchTickets()
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription Status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up subscription...')
      supabase.removeChannel(channel)
    }
  }, [fetchTickets]) // Removed selectedTicket from dependency

  const fetchMessages = async (ticketId: string): Promise<void> => {
    setLoadingMessages(true)
    try {
      const msgs = await DataService.getTicketMessages(ticketId)
      setTicketMessages(msgs)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleTicketClick = (ticket: SupportTicket): void => {
    setSelectedTicket(ticket)
    setResponseText('')
  }

  const handleSendResponse = async (): Promise<void> => {
    if (!selectedTicket || !responseText.trim()) return

    setSending(true)
    try {
      await DataService.sendTicketMessage(selectedTicket.id, responseText)
      setResponseText('')
      fetchMessages(selectedTicket.id)
    } catch (error) {
      console.error('Error sending response:', error)
      alert('Failed to send response. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleResolveTicket = async (): Promise<void> => {
    if (!selectedTicket) return
    if (!confirm('Are you sure you want to mark this ticket as RESOLVED?')) return

    try {
      await DataService.resolveTicket(selectedTicket.id)
      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'resolved' } : t))
      )
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null))
    } catch (error) {
      console.error('Error resolving ticket:', error)
      alert('Failed to resolve ticket.')
    }
  }

  const handleDeleteTicket = async (): Promise<void> => {
    if (!selectedTicket) return
    if (!confirm('Are you sure you want to DELETE this ticket? This action cannot be undone.'))
      return

    try {
      await DataService.deleteSupportTicket(selectedTicket.id)
      // Remove from list
      setTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id))
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Failed to delete ticket.')
    }
  }

  const handleSyncFlights = async (): Promise<void> => {
    if (!apiKey) {
      alert('Please enter your AirLabs API Key')
      return
    }
    setSyncing(true)
    setSyncResult(null)

    try {
      // Use the new DataService method
      const data = await DataService.syncFlightSchedules('GQ', apiKey)

      setSyncResult('Import successful. Cleaning up duplicates...')
      // Explicitly run the aggressive cleanup
      await DataService.cleanupFlightDuplicates()

      const successMsg = data.message + ' (Cleanup Complete)'
      setSyncResult(successMsg)
      alert('Sync Complete: ' + successMsg)
    } catch (err: any) {
      console.error('Sync failed:', err)
      setSyncResult('Error: ' + err.message)
      alert('Sync Failed: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  // --- USER MANAGEMENT HANDLERS ---

  useEffect(() => {
    if (!userSearch) {
      setFilteredPilots(pilots)
    } else {
      const lower = userSearch.toLowerCase()
      setFilteredPilots(
        pilots.filter(
          (p) =>
            p.callsign.toLowerCase().includes(lower) ||
            p.simBriefUsername?.toLowerCase().includes(lower) ||
            p.id.toLowerCase().includes(lower)
        )
      )
    }
  }, [userSearch, pilots])

  const handleEditClick = (pilot: PilotProfile) => {
    setEditingPilot(pilot)
    setEditForm({
      flightHours: pilot.flightHours,
      balance: pilot.balance,
      homeBase: pilot.homeBase,
      currentLocation: pilot.currentLocation,
      rank: pilot.rank,
      status: pilot.status
    })
  }

  const handleSavePilot = async () => {
    if (!editingPilot) return
    try {
      await DataService.adminUpdatePilot(editingPilot.id, editForm)
      alert('Pilot updated successfully')
      setEditingPilot(null)
      fetchPilots()
    } catch (error: any) {
      console.error('Update failed:', error)
      alert('Update failed: ' + error.message)
    }
  }

  const handleBanUser = async (pilot: PilotProfile) => {
    if (
      !confirm(`Are you sure you want to BAN ${pilot.callsign}? They will not be able to log in.`)
    )
      return
    try {
      await DataService.adminUpdatePilot(pilot.id, { status: 'banned' })
      alert(`${pilot.callsign} has been BANNED.`)
      fetchPilots()
    } catch (error: any) {
      console.error('Ban failed:', error)
      alert('Ban failed: ' + error.message)
    }
  }

  const handleActivateUser = async (pilot: PilotProfile) => {
    try {
      await DataService.adminUpdatePilot(pilot.id, { status: 'active' })
      alert(`${pilot.callsign} is now ACTIVE.`)
      fetchPilots()
    } catch (error: any) {
      console.error('Activation failed:', error)
      alert('Activation failed: ' + error.message)
    }
  }

  // --- ANNOUNCEMENT HANDLERS ---

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim()) return
    try {
      await DataService.createAnnouncement(newAnnouncement)
      setNewAnnouncement('')
      fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to create announcement:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await DataService.deleteAnnouncement(id)
      fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to delete announcement:', error)
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="flex h-full bg-[#f0f0f0] text-[#333] font-tahoma overflow-hidden">
      <Sidebar activePage="admin" onLogout={handleLogout} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="p-4 pb-2 border-b-2 border-white shadow-sm mb-2 flex items-center justify-between bg-white">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tighter text-[#333] flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-800" />
              Administrator Control Panel
            </h1>
            <p className="text-xs text-gray-600">Authorized Personnel Only • IP Logged</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded transition-colors flex items-center gap-2 ${activeTab === 'support'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
            >
              <MessageSquare className="w-4 h-4" /> Support
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded transition-colors flex items-center gap-2 ${activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
            >
              <Users className="w-4 h-4" /> User Mgmt
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded transition-colors flex items-center gap-2 ${activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
            >
              <Megaphone className="w-4 h-4" /> Announcements
            </button>
          </div>
        </div>

        {/* Content */}
        {/* Content Area based on Tab */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'support' && (
            <div className="absolute inset-0 p-4 pt-0 overflow-hidden flex gap-4">
              {/* Ticket List */}
              <div className="w-1/3 flex flex-col gap-2 h-full overflow-hidden">
                <div className="bg-[#ddd] text-[#333] px-2 py-1 text-xs font-bold border-b border-white flex justify-between items-center shadow-sm shrink-0">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    INBOX ({tickets.filter((t) => t.status !== 'resolved').length})
                  </span>
                  <button
                    onClick={fetchTickets}
                    className="text-[10px] text-blue-800 hover:underline"
                  >
                    [REFRESH]
                  </button>
                </div>

                {loading ? (
                  <div className="legacy-panel p-4 flex justify-center">
                    <span className="animate-pulse text-xs text-gray-500">Loading tickets...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="legacy-panel p-8 text-center border-dashed">
                    <p className="text-gray-500 text-xs italic">No tickets found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket)}
                        className={`legacy-panel text-left p-2 transition-all flex flex-col gap-1 group ${selectedTicket?.id === ticket.id
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-1 rounded border uppercase ${ticket.status === 'resolved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                          >
                            {ticket.status === 'resolved' ? 'Resolved' : 'Pending'}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-[#333] truncate w-full">
                          {ticket.subject}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <User className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                          <span className="font-mono">
                            {ticket.profiles?.callsign || 'Unknown'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket Chat View */}
              <div className="flex-1 legacy-panel flex flex-col overflow-hidden bg-white h-full">
                {selectedTicket ? (
                  <>
                    {/* Ticket Header */}
                    <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-start shrink-0">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          <span className="font-bold bg-blue-100 text-blue-800 px-1 border border-blue-200 rounded-sm">
                            {selectedTicket.profiles?.callsign}
                          </span>
                          <span>reported:</span>
                        </div>
                        <h2 className="text-lg font-bold text-blue-900">
                          {selectedTicket.subject}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTicket.status !== 'resolved' && (
                          <button
                            onClick={handleResolveTicket}
                            className="btn-classic px-2 py-1 text-xs flex items-center gap-1 text-green-700"
                          >
                            <CheckCircle className="w-3 h-3" /> Mark Resolved
                          </button>
                        )}
                        <button
                          onClick={handleDeleteTicket}
                          className="btn-classic px-2 py-1 text-xs flex items-center gap-1 text-red-600 hover:bg-red-50 border-red-200"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-3 bg-[#e5e5e5] overflow-y-auto space-y-3">
                      {loadingMessages ? (
                        <div className="text-center text-xs text-gray-500 italic mt-4">
                          Loading conversation...
                        </div>
                      ) : ticketMessages.length === 0 ? (
                        <div className="text-center text-xs text-gray-500 italic mt-4">
                          No messages found.
                        </div>
                      ) : (
                        ticketMessages.map((msg) => {
                          const isAdmin = msg.profiles?.is_admin
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] border px-3 py-2 shadow-sm ${isAdmin
                                  ? 'bg-blue-100 border-blue-300 rounded-tl-lg rounded-bl-lg rounded-br-lg'
                                  : 'bg-white border-gray-300 rounded-tr-lg rounded-br-lg rounded-bl-lg'
                                  }`}
                              >
                                <div className="text-[10px] font-bold opacity-70 mb-1 flex items-center gap-1 justify-between border-b border-black/10 pb-1">
                                  <span className="flex items-center gap-1">
                                    {isAdmin ? (
                                      <ShieldCheck className="w-3 h-3 text-blue-700" />
                                    ) : (
                                      <User className="w-3 h-3 text-gray-500" />
                                    )}
                                    {msg.profiles?.callsign || 'Unknown'}
                                  </span>
                                  <span className="font-mono text-[9px] opacity-60 ml-2">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-[#333] font-sans whitespace-pre-wrap leading-relaxed">
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Reply Input */}
                    <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                      {selectedTicket.status === 'resolved' ? (
                        <div className="bg-gray-100 border border-gray-300 p-2 text-center text-xs text-gray-500 italic flex items-center justify-center gap-2">
                          <Lock className="w-3 h-3" /> This ticket is resolved. Re-open
                          functionality not yet implemented.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="bg-blue-50 px-2 py-1 text-[10px] text-blue-800 border border-blue-100 font-bold">
                            REPLYING AS ADMINISTRATOR
                          </div>
                          <div className="flex gap-2 items-end">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Type your response here..."
                              className="flex-1 h-20 border border-gray-300 p-2 text-sm focus:outline-none focus:border-blue-500 resize-none font-sans"
                            />
                            <button
                              onClick={handleSendResponse}
                              disabled={sending || !responseText.trim()}
                              className="btn-navy h-20 px-4 flex flex-col items-center justify-center gap-1"
                            >
                              {sending ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-xs">Select a ticket from the list to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="absolute inset-0 p-4 pt-0 overflow-y-auto">
              <div className="mb-4 flex gap-4">
                <input
                  type="text"
                  placeholder="Search Pilots (Use ID, Callsign, or Username)..."
                  className="w-1/3 p-2 border border-gray-300 rounded text-sm font-sans"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <button
                  onClick={fetchPilots}
                  className="btn-classic px-4 py-2 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh List
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
                {filteredPilots.map((pilot) => (
                  <div
                    key={pilot.id}
                    className={`bg-white border rounded shadow-sm p-3 relative ${pilot.status === 'banned' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-blue-900">{pilot.callsign}</h3>
                          {pilot.isAdmin && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded border border-purple-200">
                              ADMIN
                            </span>
                          )}
                          {pilot.status === 'banned' && (
                            <span className="text-[9px] bg-red-600 text-white px-1 rounded font-bold">
                              BANNED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono text-[9px]">{pilot.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold">{pilot.rank}</div>
                        <div className="text-[10px] text-gray-500">{pilot.homeBase}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded mb-3 border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">Balance</span>
                        <span className="font-mono font-bold text-green-700">
                          €{pilot.balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">Hours</span>
                        <span className="font-mono font-bold">{pilot.flightHours.toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">Location</span>
                        <span className="font-mono">{pilot.currentLocation}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">SB User</span>
                        <span className="font-mono text-[10px] truncate w-full block">
                          {pilot.simBriefUsername || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between gap-2 border-t pt-2">
                      <button
                        onClick={() => handleEditClick(pilot)}
                        className="flex-1 btn-classic py-1 text-[10px] flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit Stats
                      </button>

                      {pilot.status === 'banned' ? (
                        <button
                          onClick={() => handleActivateUser(pilot)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(pilot)}
                          disabled={pilot.isAdmin}
                          className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${pilot.isAdmin
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                            }`}
                        >
                          <Ban className="w-3 h-3" /> Ban User
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="absolute inset-0 p-4 pt-0 overflow-y-auto">
              <div className="flex gap-4">
                {/* Create Form */}
                <div className="w-1/3 legacy-panel p-4 h-fit bg-blue-50 border-blue-200">
                  <h3 className="font-bold text-blue-900 border-b border-blue-200 mb-3 pb-2 flex items-center gap-2">
                    <Megaphone className="w-4 h-4" /> New Announcement
                  </h3>
                  <textarea
                    className="w-full h-32 border border-blue-200 p-2 text-sm rounded mb-2 font-sans focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Type your system-wide announcement here..."
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                  />
                  <div className="text-[10px] text-gray-500 mb-3">
                    This message will be visible to ALL pilots immediately.
                  </div>
                  <button
                    onClick={handleCreateAnnouncement}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm shadow-sm transition-all"
                  >
                    Broadcast Now
                  </button>
                </div>

                {/* List */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-700 mb-3 ml-1">Active Announcements</h3>
                  <div className="space-y-2">
                    {announcements.length === 0 ? (
                      <div className="text-gray-400 text-sm italic p-4 text-center border-dashed border-2 rounded">
                        No active announcements.
                      </div>
                    ) : (
                      announcements.map((a) => (
                        <div
                          key={a.id}
                          className="bg-white border border-l-4 border-l-blue-500 shadow-sm p-4 rounded flex justify-between items-start"
                        >
                          <div>
                            <p className="text-gray-800 font-medium whitespace-pre-wrap">
                              {a.message}
                            </p>
                            <div className="text-[10px] text-gray-400 mt-2 flex gap-3">
                              <span>
                                Posted by:{' '}
                                <span className="font-bold text-gray-600">
                                  {a.author?.callsign}
                                </span>
                              </span>
                              <span>{new Date(a.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Remove Announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Pilot Modal */}
        {editingPilot && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-tahoma">
            <div className="bg-white rounded shadow-2xl w-full max-w-md p-6 border-2 border-white">
              <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5" /> Edit Pilot: {editingPilot.callsign}
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Flight Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2 border rounded font-mono"
                    value={editForm.flightHours}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, flightHours: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Balance (€)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded font-mono"
                    value={editForm.balance}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, balance: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Home Base
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono uppercase"
                      value={editForm.homeBase}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, homeBase: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono uppercase"
                      value={editForm.currentLocation}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, currentLocation: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Rank
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={editForm.rank}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rank: e.target.value }))}
                  >
                    <option value="Cadet">Cadet</option>
                    <option value="First Officer">First Officer</option>
                    <option value="Senior First Officer">Senior First Officer</option>
                    <option value="Captain">Captain</option>
                    <option value="Senior Captain">Senior Captain</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                <button
                  onClick={() => setEditingPilot(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePilot}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Section */}
        <div className="p-4 border-t border-white bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            AirLabs Schedule Sync
          </h3>
          <div className="flex gap-2 items-center">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter AirLabs API Key"
              className="flex-1 p-2 border border-gray-300 rounded text-xs font-mono"
            />
            <button
              onClick={handleSyncFlights}
              disabled={syncing || !apiKey}
              className={`px-3 py-2 rounded text-xs font-bold text-white transition-colors ${syncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          {syncResult && (
            <div
              className={`mt-2 p-2 rounded text-[10px] font-mono ${syncResult.includes('Error')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
                }`}
            >
              {syncResult}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
