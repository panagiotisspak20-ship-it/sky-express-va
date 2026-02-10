import { useState, useEffect, useCallback } from 'react'
import { DataService } from '../services/dataService'
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
  Trash2
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

  useEffect(() => {
    checkAdmin()
    fetchTickets()
  }, [checkAdmin, fetchTickets])

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

  return (
    <div className="flex h-screen bg-[#f0f0f0] text-[#333] font-tahoma overflow-hidden">
      <Sidebar activePage="admin" onLogout={handleLogout} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <div className="p-4 pb-2 border-b-2 border-white shadow-sm mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tighter text-[#333] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-800" />
              Administrator Control Panel
            </h1>
            <p className="text-xs text-gray-600">Authorized Personnel Only • IP Logged</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 pt-0 overflow-y-auto z-10 flex gap-4">
          {/* Ticket List */}
          <div className="w-1/3 flex flex-col gap-2">
            <div className="bg-[#ddd] text-[#333] px-2 py-1 text-xs font-bold border-b border-white flex justify-between items-center shadow-sm">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                INBOX ({tickets.filter((t) => t.status !== 'resolved').length})
              </span>
              <button onClick={fetchTickets} className="text-[10px] text-blue-800 hover:underline">
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
              <div className="flex flex-col gap-1 overflow-y-auto pr-1">
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
                      <span className="font-mono">{ticket.profiles?.callsign || 'Unknown'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Chat View */}
          <div className="flex-1 legacy-panel flex flex-col overflow-hidden bg-white">
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span className="font-bold bg-blue-100 text-blue-800 px-1 border border-blue-200 rounded-sm">
                        {selectedTicket.profiles?.callsign}
                      </span>
                      <span>reported:</span>
                    </div>
                    <h2 className="text-lg font-bold text-blue-900">{selectedTicket.subject}</h2>
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
                <div className="p-3 bg-white border-t border-gray-200">
                  {selectedTicket.status === 'resolved' ? (
                    <div className="bg-gray-100 border border-gray-300 p-2 text-center text-xs text-gray-500 italic flex items-center justify-center gap-2">
                      <Lock className="w-3 h-3" /> This ticket is resolved. Re-open functionality
                      not yet implemented.
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
            <div className={`mt-2 p-2 rounded text-[10px] font-mono ${syncResult.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
              {syncResult}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
