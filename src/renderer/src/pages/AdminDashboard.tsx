import { useState, useEffect, useCallback, useRef } from 'react'
import { DataService, PilotProfile, SystemAnnouncement } from '../services/dataService'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageVariants, slideDown, staggerContainer, fadeInUp } from '../utils/animations'
import { toastConfirm } from '../utils/toastConfirm'
import toast from 'react-hot-toast'
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
  const [activeTab, setActiveTab] = useState<'support' | 'users' | 'announcements' | 'deletions'>(
    'support'
  )

  // Deletion Requests State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deletionRequests, setDeletionRequests] = useState<any[]>([])

  // User Management State
  const [pilots, setPilots] = useState<PilotProfile[]>([])
  const [filteredPilots, setFilteredPilots] = useState<PilotProfile[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [editingPilot, setEditingPilot] = useState<PilotProfile | null>(null)
  const [editForm, setEditForm] = useState<Partial<PilotProfile>>({})

  // Announcements State
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [editAnnouncementText, setEditAnnouncementText] = useState('')

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
      console.log('📢 Admin: Fetching announcements...')
      const data = await DataService.getActiveAnnouncements()
      console.log('📢 Admin: Got announcements:', data)
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

  const fetchDeletionRequests = useCallback(async (): Promise<void> => {
    try {
      const data = await DataService.getPendingDeletions()
      setDeletionRequests(data)
    } catch (error) {
      console.error('Error fetching deletion requests:', error)
    }
  }, [])

  useEffect(() => {
    checkAdmin()
    fetchTickets()
    fetchPilots()
    fetchAnnouncements()
    fetchDeletionRequests()
  }, [checkAdmin, fetchTickets, fetchPilots, fetchAnnouncements, fetchDeletionRequests])

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completed_flights' },
        (payload) => {
          console.log('✈️ Flight Update (deletion):', payload)
          fetchDeletionRequests()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_announcements' },
        (payload) => {
          console.log('📢 Announcement Update:', payload)
          fetchAnnouncements()
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription Status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up subscription...')
      supabase.removeChannel(channel)
    }
  }, [fetchTickets, fetchDeletionRequests, fetchAnnouncements]) // Removed selectedTicket from dependency

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
    fetchMessages(ticket.id)
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
      toast.error('Failed to send response. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleResolveTicket = async (): Promise<void> => {
    if (!selectedTicket) return
    const confirmed = await toastConfirm('Are you sure you want to mark this ticket as RESOLVED?')
    if (!confirmed) return

    try {
      await DataService.resolveTicket(selectedTicket.id)
      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'resolved' } : t))
      )
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null))
    } catch (error) {
      console.error('Error resolving ticket:', error)
      toast.error('Failed to resolve ticket.')
    }
  }

  const handleDeleteTicket = async (): Promise<void> => {
    if (!selectedTicket) return
    const confirmed = await toastConfirm(
      'Are you sure you want to DELETE this ticket? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      await DataService.deleteSupportTicket(selectedTicket.id)
      // Remove from list
      setTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id))
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast.error('Failed to delete ticket.')
    }
  }

  const handleSyncFlights = async (): Promise<void> => {
    if (!apiKey) {
      toast.error('Please enter your AirLabs API Key')
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
      toast.success('Sync Complete: ' + successMsg)
    } catch (err: any) {
      console.error('Sync failed:', err)
      setSyncResult('Error: ' + err.message)
      toast.error('Sync Failed: ' + err.message)
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
      toast.success('Pilot updated successfully')
      setEditingPilot(null)
      fetchPilots()
    } catch (error: any) {
      console.error('Update failed:', error)
      toast.error('Update failed: ' + error.message)
    }
  }

  const handleBanUser = async (pilot: PilotProfile) => {
    const confirmed = await toastConfirm(
      `Are you sure you want to BAN ${pilot.callsign}? They will not be able to log in.`
    )
    if (!confirmed) return
    try {
      await DataService.adminUpdatePilot(pilot.id, { status: 'banned' })
      toast.success(`${pilot.callsign} has been BANNED.`)
      fetchPilots()
    } catch (error: any) {
      console.error('Ban failed:', error)
      toast.error('Ban failed: ' + error.message)
    }
  }

  const handleActivateUser = async (pilot: PilotProfile) => {
    try {
      await DataService.adminUpdatePilot(pilot.id, { status: 'active' })
      toast.success(`${pilot.callsign} is now ACTIVE.`)
      fetchPilots()
    } catch (error: any) {
      console.error('Activation failed:', error)
      toast.error('Activation failed: ' + error.message)
    }
  }

  // --- ANNOUNCEMENT HANDLERS ---

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim()) return
    try {
      await DataService.createAnnouncement(newAnnouncement)
      setNewAnnouncement('')
      await fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to create announcement:', error)
      toast.error('Error: ' + error.message)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    const confirmed = await toastConfirm('Delete this announcement?')
    if (!confirmed) return
    try {
      await DataService.deleteAnnouncement(id)
      await fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to delete announcement:', error)
      toast.error('Error: ' + error.message)
    }
  }

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar activePage="admin" onLogout={handleLogout} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <motion.div
          variants={slideDown}
          initial="hidden"
          animate="visible"
          className="p-6 pb-4 flex flex-col gap-4 border-b-2 border-sky-500/20"
        >
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-sky-500" />
              Admin Control Panel
            </h1>
            <p className="text-xs text-slate-500 mt-1 ml-11 font-medium">Authorized Personnel Only</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('support')}
              className={`px-5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'support'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200 shadow-sm'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Support
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200 shadow-sm'
              }`}
            >
              <Users className="w-4 h-4" /> User Mgmt
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200 shadow-sm'
              }`}
            >
              <Megaphone className="w-4 h-4" /> Announcements
            </button>
            <button
              onClick={() => setActiveTab('deletions')}
              className={`px-5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'deletions'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200 shadow-sm'
              }`}
            >
              <Trash2 className="w-4 h-4" /> Deletions
              {deletionRequests.length > 0 && (
                <span className="bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded-full font-bold">
                  {deletionRequests.length}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {/* Content Area based on Tab */}
        <motion.div
          className="flex-1 overflow-hidden relative"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          key={activeTab} // Retrigger animation on tab change
        >
          {activeTab === 'support' && (
            <div className="absolute inset-0 p-6 pt-4 overflow-hidden flex gap-4">
              {/* Ticket List */}
              <div className="w-1/3 flex flex-col h-full overflow-hidden">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-500" />
                      Inbox
                      <span className="bg-sky-100 text-sky-500 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                        {tickets.filter((t) => t.status !== 'resolved').length}
                      </span>
                    </span>
                    <button
                      onClick={fetchTickets}
                      className="text-xs text-sky-500 hover:text-sky-600 font-bold hover:bg-sky-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {loading ? (
                    <div className="p-8 flex justify-center">
                      <span className="animate-pulse text-sm text-slate-400 font-medium">Loading tickets...</span>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="p-12 text-center">
                      <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">No tickets found.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-col overflow-y-auto flex-1"
                    >
                      {tickets.map((ticket) => (
                        <motion.button
                          variants={fadeInUp}
                          key={ticket.id}
                          onClick={() => handleTicketClick(ticket)}
                          className={`text-left px-4 py-3 transition-all flex flex-col gap-1.5 border-b border-slate-100 last:border-0 group ${
                            selectedTicket?.id === ticket.id
                              ? 'bg-sky-50/80 border-l-2 border-l-sky-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                ticket.status === 'resolved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {ticket.status === 'resolved' ? 'Resolved' : 'Pending'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="font-bold text-sm text-slate-800 truncate w-full">
                            {ticket.subject}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="w-3 h-3 text-slate-400 group-hover:text-sky-500 transition-colors" />
                            <span className="font-medium">
                              {ticket.profiles?.callsign || 'Unknown'}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Ticket Chat View */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
                {selectedTicket ? (
                  <>
                    {/* Ticket Header */}
                    <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-4 flex justify-between items-start shrink-0">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                          <span className="font-bold bg-blue-100 text-[#0a1f5c] px-2 py-0.5 rounded-full text-[10px]">
                            {selectedTicket.profiles?.callsign}
                          </span>
                          <span className="font-medium">reported:</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                          {selectedTicket.subject}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTicket.status !== 'resolved' && (
                          <button
                            onClick={handleResolveTicket}
                            className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all hover:-translate-y-0.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                          </button>
                        )}
                        <button
                          onClick={handleDeleteTicket}
                          className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all hover:-translate-y-0.5"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 px-5 py-4 bg-slate-50/50 overflow-y-auto space-y-4">
                      {loadingMessages ? (
                        <div className="text-center text-sm text-slate-400 font-medium mt-8">
                          Loading conversation...
                        </div>
                      ) : ticketMessages.length === 0 ? (
                        <div className="text-center text-sm text-slate-400 font-medium mt-8">
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
                                className={`max-w-[80%] px-4 py-3 shadow-sm ${
                                  isAdmin
                                    ? 'bg-sky-500 text-white rounded-2xl rounded-br-md'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md'
                                }`}
                              >
                                <div
                                  className={`text-[10px] font-bold mb-1.5 flex items-center gap-1.5 justify-between pb-1.5 ${
                                    isAdmin
                                      ? 'border-b border-white/20 text-white/80'
                                      : 'border-b border-slate-100 text-slate-400'
                                  }`}
                                >
                                  <span className="flex items-center gap-1">
                                    {isAdmin ? (
                                      <ShieldCheck className="w-3 h-3" />
                                    ) : (
                                      <User className="w-3 h-3" />
                                    )}
                                    {msg.profiles?.callsign || 'Unknown'}
                                  </span>
                                  <span className="text-[9px] opacity-70 ml-2">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm whitespace-pre-wrap leading-relaxed ${
                                    isAdmin ? '' : 'text-slate-700'
                                  }`}
                                >
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Reply Input */}
                    <div className="px-5 py-4 bg-white border-t border-slate-100 shrink-0">
                      {selectedTicket.status === 'resolved' ? (
                        <div className="bg-slate-50 border border-slate-200 p-3 text-center text-sm text-slate-500 font-medium rounded-xl flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400" /> This ticket is resolved.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="bg-sky-50 px-3 py-1.5 text-[10px] text-sky-500 border border-sky-200 font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Replying as Administrator
                          </div>
                          <div className="flex gap-3 items-end">
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Type your response here..."
                              className="flex-1 h-20 border border-slate-200 p-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none rounded-xl bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                            <button
                              onClick={handleSendResponse}
                              disabled={sending || !responseText.trim()}
                              className="h-20 px-5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl flex flex-col items-center justify-center gap-1 text-sm font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
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
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Select a ticket to view the conversation</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="absolute inset-0 p-6 pt-4 overflow-y-auto">
              <div className="mb-5 flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Search by Callsign, Username, or ID..."
                  className="flex-1 max-w-md p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <button
                  onClick={fetchPilots}
                  className="px-4 py-3 text-xs font-bold flex items-center gap-1.5 text-sky-500 bg-white hover:bg-sky-50 border border-slate-200 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <span className="text-xs text-slate-400 font-medium ml-auto">
                  {filteredPilots.length} pilot{filteredPilots.length !== 1 ? 's' : ''}
                </span>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8"
              >
                {filteredPilots.map((pilot) => (
                  <motion.div
                    variants={fadeInUp}
                    key={pilot.id}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      pilot.status === 'banned'
                        ? 'border-2 border-red-300 ring-1 ring-red-100'
                        : 'border border-slate-200'
                    }`}
                  >
                    {/* Card Header */}
                    <div className={`px-4 py-3 flex justify-between items-start ${
                      pilot.status === 'banned' ? 'bg-red-50' : 'bg-slate-50/80'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-[#0a1f5c] text-lg tracking-tight">{pilot.callsign}</h3>
                          {pilot.isAdmin && (
                            <span className="text-[9px] bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded-full font-bold border border-sky-500/20">
                              ADMIN
                            </span>
                          )}
                          {pilot.status === 'banned' && (
                            <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                              BANNED
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">{pilot.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-700">{pilot.rank}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{pilot.homeBase}</div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs p-4">
                      <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Balance</span>
                        <span className="font-mono font-bold text-emerald-700">
                          €{pilot.balance.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Hours</span>
                        <span className="font-mono font-bold text-[#0a1f5c]">{pilot.flightHours.toFixed(1)}h</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Location</span>
                        <span className="font-mono font-bold text-slate-700">{pilot.currentLocation}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">SimBrief</span>
                        <span className="font-mono text-[10px] truncate w-full block text-slate-600">
                          {pilot.simBriefUsername || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        onClick={() => handleEditClick(pilot)}
                        className="flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 text-[#0a1f5c] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all hover:-translate-y-0.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Stats
                      </button>

                      {pilot.status === 'banned' ? (
                        <button
                          onClick={() => handleActivateUser(pilot)}
                          className="flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all hover:-translate-y-0.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(pilot)}
                          disabled={pilot.isAdmin}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            pilot.isAdmin
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:-translate-y-0.5'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" /> Ban User
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="absolute inset-0 p-6 pt-4 overflow-y-auto">
              <div className="flex gap-5">
                {/* Create Form */}
                <div className="w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit">
                  <h3 className="font-black text-[#0a1f5c] text-sm uppercase tracking-widest border-b border-slate-100 mb-4 pb-3 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-sky-500" /> New Announcement
                  </h3>
                  <textarea
                    className="w-full h-32 border border-slate-200 p-3 text-sm rounded-xl font-sans bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm mb-3 resize-none placeholder:text-slate-400"
                    placeholder="Type your system-wide announcement here..."
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                  />
                  <div className="text-[10px] text-slate-400 font-medium mb-4 flex items-center gap-1.5">
                    <span className="text-amber-500">⚠️</span> This message will be visible to ALL pilots immediately.
                  </div>
                  <button
                    onClick={handleCreateAnnouncement}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    Broadcast Now
                  </button>
                </div>

                {/* List */}
                <div className="flex-1">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    Active Announcements
                  </h3>
                  <div className="space-y-3">
                    {announcements.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                        <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-medium">No active announcements.</p>
                      </div>
                    ) : (
                      announcements.map((a) => {
                        const isEditing = editingAnnouncementId === a.id

                        const handleSaveEdit = async () => {
                          if (!editAnnouncementText.trim() || editAnnouncementText === a.message) {
                            setEditingAnnouncementId(null)
                            return
                          }
                          try {
                            await DataService.updateAnnouncement(a.id, editAnnouncementText)
                            setEditingAnnouncementId(null)
                            await fetchAnnouncements()
                          } catch (error: any) {
                            console.error('Failed to update announcement:', error)
                            toast.error('Error updating announcement: ' + error.message)
                          }
                        }

                        return (
                          <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            key={a.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                          >
                            <div className="border-l-4 border-l-sky-500 p-4 flex flex-col gap-2">
                              {isEditing ? (
                                <div className="flex flex-col gap-3 w-full">
                                  <textarea
                                    className="w-full min-h-[80px] border border-slate-200 p-3 text-sm rounded-xl font-sans bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm resize-none"
                                    value={editAnnouncementText}
                                    onChange={(e) => setEditAnnouncementText(e.target.value)}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setEditingAnnouncementId(null)}
                                      className="px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-4 py-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                      <CheckCircle className="w-3 h-3" /> Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start w-full">
                                  <div className="flex-1">
                                    <p className="text-slate-800 font-medium whitespace-pre-wrap text-sm leading-relaxed">
                                      {a.message}
                                    </p>
                                    <div className="text-[10px] text-slate-400 mt-3 flex gap-3 font-medium">
                                      <span>
                                        By{' '}
                                        <span className="font-bold text-[#0a1f5c]">
                                          {a.author?.callsign}
                                        </span>
                                      </span>
                                      <span>{new Date(a.created_at).toLocaleString()}</span>
                                      {a.updated_at && a.updated_at !== a.created_at && (
                                        <span className="italic text-slate-300">(Edited)</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 ml-4 shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditingAnnouncementId(a.id)
                                        setEditAnnouncementText(a.message)
                                      }}
                                      className="text-slate-400 hover:text-sky-500 p-1.5 hover:bg-sky-50 rounded-lg transition-colors group"
                                      title="Edit Announcement"
                                    >
                                      <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAnnouncement(a.id)}
                                      className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                                      title="Remove Announcement"
                                    >
                                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deletions' && (
            <div className="absolute inset-0 p-6 pt-4 overflow-y-auto">
              <div className="mb-5 flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-500" /> Flight Deletion Requests
                </h3>
                <button
                  onClick={fetchDeletionRequests}
                  className="px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 text-sky-500 bg-white hover:bg-sky-50 border border-slate-200 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {deletionRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <Trash2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No deletion requests found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deletionRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="border-l-4 border-l-amber-400 p-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-[#0a1f5c] text-xl tracking-tight">
                                {req.flightNumber}
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-700 border border-amber-200">
                                PENDING
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                              <div className="text-slate-500">
                                <span className="font-bold text-slate-700">Pilot:</span> {req.pilotCallsign}
                              </div>
                              <div className="text-slate-500">
                                <span className="font-bold text-slate-700">Route:</span> {req.departure} ➔{' '}
                                {req.arrival} ({req.aircraft})
                              </div>
                              <div className="text-slate-500">
                                <span className="font-bold text-slate-700">Revert:</span> €{req.earnings} | -
                                {req.duration.toFixed(1)}m
                              </div>
                              <div className="text-slate-500">
                                <span className="font-bold text-slate-700">Reason:</span> {req.deleteReason}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Requested: {new Date(req.date).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0 ml-4">
                            <button
                              onClick={async () => {
                                const confirmed = await toastConfirm(
                                  `APPROVE deletion of flight ${req.flightNumber}?\n\nThis will safely deduct the flight earnings and hours from the pilot, and permanently delete the record.`
                                )
                                if (!confirmed) return
                                try {
                                  await DataService.approveFlightDeletion(req.id)
                                  toast.success(
                                    'Flight deleted successfully. Stats have been safely negated.'
                                  )
                                  fetchDeletionRequests()
                                } catch (err) {
                                  console.error(err)
                                  toast.error('Failed to approve deletion.')
                                }
                              }}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await DataService.rejectFlightDeletion(req.id)
                                  toast.success('Deletion Request rejected. Flight kept in history.')
                                  fetchDeletionRequests()
                                } catch (err) {
                                  console.error(err)
                                  toast.error('Failed to reject request.')
                                }
                              }}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Edit Pilot Modal */}
        {editingPilot && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center font-sans">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
                <h2 className="text-xl font-black text-[#0a1f5c] tracking-tight flex items-center gap-2">
                  <Edit className="w-5 h-5 text-sky-500" /> Edit Pilot: {editingPilot.callsign}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Flight Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                    value={editForm.flightHours}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, flightHours: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Balance (€)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                    value={editForm.balance}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, balance: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Home Base
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-200 rounded-xl font-mono uppercase text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                      value={editForm.homeBase}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, homeBase: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-200 rounded-xl font-mono uppercase text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                      value={editForm.currentLocation}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, currentLocation: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Rank
                  </label>
                  <select
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
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

              <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                <button
                  onClick={() => setEditingPilot(null)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePilot}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Section */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-sky-500" />
            AirLabs Schedule Sync
          </h3>
          <div className="flex gap-3 items-center">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter AirLabs API Key"
              className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm placeholder:text-slate-400"
            />
            <button
              onClick={handleSyncFlights}
              disabled={syncing || !apiKey}
              className={`px-5 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                syncing
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          {syncResult && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-mono font-medium ${
                syncResult.includes('Error')
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
