import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { DataService } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'

// --- Types ---
interface Ticket {
  id: string
  subject: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
  message?: string // Initial message
  profiles?: { callsign: string } // Joined data
}

interface Message {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  created_at: string
  profiles?: {
    callsign: string
    is_admin: boolean
  }
}

// --- Components ---

const FAQSection = (): React.ReactElement => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = [
    {
      q: 'How do I book a flight?',
      a: "Go to the 'Schedule' page to find a flight. Click 'BOOK' to generate your flight plan on SimBrief. This saves the flight to your 'My Flights' page."
    },
    {
      q: 'How are my flight hours tracked?',
      a: "Tracking starts when you click the green 'START' button on your booked flight in 'My Flights'. Ensure your simulator is connected via SimConnect *before* clicking Start."
    },
    {
      q: 'How is my income calculated?',
      a: 'Base pay is $2 per NM. You earn a 1.2x bonus for a score above 60, and a 1.5x bonus for a score above 80 (e.g., a "Butter" landing).'
    },
    {
      q: 'How do I increase my Rank?',
      a: 'Currently, all pilots hold the rank of Cadet. We are introducing a rank progression system in a future update that will be based on flight hours and reputation.'
    },
    {
      q: 'How is my landing scored?',
      a: 'Landings are graded by vertical speed. BUTTER (> -100 fpm), GOOD (-100 to -250), FIRM (-250 to -500), HARD (< -500).'
    },
    {
      q: "Why isn't my SimBrief import working?",
      a: 'Ensure you entered your SimBrief Pilot ID (Number) in Settings, NOT your username. You can find this ID in your SimBrief account details.'
    },
    {
      q: 'How do I delete my account?',
      a: "You can permanently delete your account and all associated data (logs, flights) by going to Settings and clicking the 'DELETE ACCOUNT' button."
    },
    {
      q: 'Can I close my own support ticket?',
      a: "Yes. If you find a solution, open your ticket in the Support chat and click 'I Found a Solution (Delete Ticket)' to close and remove it."
    },
    {
      q: 'Where can I see my Flight Plan (OFP)?',
      a: "After booking, go to 'My Flights' and click the 'OFP' button on your flight card. This opens the Dispatch view with your SimBrief data."
    }
  ]

  return (
    <div className="legacy-panel bg-white flex-1 flex flex-col">
      <div className="bg-[#e1e1e1] px-2 py-1 text-xs font-bold text-[#333] border-b border-gray-300 mb-2">
        FAQ KNOWLEDGE BASE
      </div>
      <div className="space-y-2 px-2 pb-2 overflow-y-auto flex-1">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-gray-300 bg-white">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex justify-between items-center p-1 px-2 text-left text-xs font-bold bg-[#f0f0f0] hover:bg-[#e9e9e9]"
            >
              {faq.q}
              {openIndex === i ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {openIndex === i && (
              <div className="p-2 text-xs text-[#333] border-t border-gray-300 bg-white">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CreateTicketForm = ({ onSuccess }: { onSuccess: () => void }): React.ReactElement => {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!subject || !message) return
    setSending(true)
    try {
      await DataService.createSupportTicket(subject, message)
      setSubject('')
      setMessage('')
      onSuccess()
    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to create ticket: ${errorMessage}`)
    } finally {
      setSending(false)
    }
  }

  const handleCancel = (): void => {
    setSubject('')
    setMessage('')
  }

  return (
    <form className="flex flex-col h-full bg-[#fcfcfc] p-2" onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="block text-xs font-bold text-[#333] mb-1">Subject:</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full text-xs p-1 border border-gray-400 bg-white focus:outline-none focus:border-blue-500"
          required
        >
          <option value="">-- Select Topic --</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Tech Support (ACARS)">Tech Support (ACARS)</option>
          <option value="Flight Reporting Issue">Flight Reporting Issue</option>
          <option value="Career/Rank Question">Career/Rank Question</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="flex-1 flex flex-col mb-3">
        <label className="block text-xs font-bold text-[#333] mb-1">Message Body:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 w-full text-xs p-2 border border-gray-400 bg-white resize-none font-sans focus:outline-none focus:border-blue-500"
          placeholder="Describe your issue..."
          required
        />
      </div>
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs text-red-600 hover:underline px-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending}
          className="btn-classic flex items-center gap-1 disabled:opacity-50"
        >
          {sending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Submit Ticket
        </button>
      </div>
    </form>
  )
}

const ChatView = ({ ticket, onDelete }: { ticket: Ticket; onDelete: () => void }): React.ReactElement => {
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const msgs = await DataService.getTicketMessages(ticket.id)
      setMessages(msgs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [ticket.id])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (): Promise<void> => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await DataService.sendTicketMessage(ticket.id, replyText)
      setReplyText('')
      loadMessages()
    } catch (err) {
      console.error(err)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (confirm('Found a solution? This will delete the ticket permanently.')) {
      try {
        await DataService.deleteSupportTicket(ticket.id)
        onDelete()
      } catch (e) {
        console.error(e)
        alert('Failed to delete ticket')
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 bg-white border border-gray-200 m-2 mb-0">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <SkyLoader size="small" text="Loading messages..." />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="space-y-3">
            {/* Show initial ticket message as a pseudo-message if no chat history yet */}
            {ticket.message && (
              <div className="flex flex-col items-end">
                <div className="max-w-[90%] bg-green-50 border border-green-200 px-2 py-1 rounded-tl-lg rounded-bl-lg rounded-br-lg shadow-sm">
                  <div className="text-[9px] font-bold opacity-70 mb-0.5 flex items-center gap-1">
                    You{' '}
                    <span className="font-normal opacity-50">
                      {new Date(ticket.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#333] whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </div>
            )}
            {!ticket.message && (
              <div className="text-center text-gray-400 text-xs italic">No messages yet.</div>
            )}
          </div>
        )}

        {messages.map((msg) => {
          const isAdmin = msg.profiles?.is_admin
          const isMe = !isAdmin
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[90%] px-2 py-1 shadow-sm border ${isMe
                  ? 'bg-green-50 border-green-200 rounded-tl-lg rounded-bl-lg rounded-br-lg'
                  : 'bg-blue-50 border-blue-200 rounded-tr-lg rounded-br-lg rounded-bl-lg'
                  }`}
              >
                <div className="text-[9px] font-bold opacity-70 mb-0.5 flex items-center gap-1">
                  {isAdmin && <CheckCircle className="w-2 h-2" />}
                  {msg.profiles?.callsign || 'Unknown'}
                  <span className="font-normal opacity-50 ml-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#333] whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 bg-[#fcfcfc] border-t border-gray-200">
        {ticket.status === 'resolved' ? (
          <div className="bg-gray-100 border border-gray-300 p-2 text-center text-xs text-gray-500 italic">
            This ticket is resolved.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 h-14 text-xs p-2 border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans bg-white"
                placeholder="Type a reply..."
              />
              <button
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                className="btn-classic px-4 flex flex-col items-center justify-center gap-1 disabled:opacity-50 h-14"
              >
                {sending ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleDelete}
                className="text-[10px] text-green-600 hover:text-green-800 hover:underline flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" /> I found a solution (Delete Ticket)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Page Component ---
export const Support = (): React.ReactElement => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)

  // View State
  const [viewMode, setViewMode] = useState<'create' | 'chat' | 'list'>('create')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const loadTickets = useCallback(async (): Promise<void> => {
    setLoadingTickets(true)
    try {
      const data = await DataService.getSupportTickets(false)
      setTickets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTickets(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Handlers
  const handleCreateSuccess = (): void => {
    loadTickets()
    setViewMode('list') // Or keep at create
  }

  const handleSelectTicket = (t: Ticket): void => {
    setSelectedTicket(t)
    setViewMode('chat')
  }

  return (
    <div className="p-4 font-tahoma bg-[#f0f0f0] h-full flex flex-col">
      <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter mb-4 px-1">
        VA Support Center
      </h1>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left Column */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Top Panel: Dynamic (Create OR Chat) */}
          <div
            className="legacy-panel bg-[#fcfcfc] flex-[1.5] flex flex-col min-h-0 relative overflow-hidden"
            data-tutorial="support-ticket"
          >
            <div className="bg-[#e1e1e1] px-2 py-1 text-xs font-bold text-[#333] border-b border-gray-300 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2">
                {viewMode === 'chat' && selectedTicket ? (
                  <>
                    <MessageSquare className="w-3 h-3" /> TICKET #
                    {selectedTicket.profiles?.callsign} - {selectedTicket.subject}
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3" /> CREATE SUPPORT TICKET
                  </>
                )}
              </span>
              {viewMode === 'chat' && (
                <button
                  onClick={() => setViewMode('create')}
                  className="text-[10px] text-blue-800 hover:underline"
                >
                  Close Chat
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'chat' && selectedTicket ? (
                <ChatView
                  ticket={selectedTicket}
                  onDelete={() => {
                    loadTickets()
                    setViewMode('create')
                  }}
                />
              ) : (
                <CreateTicketForm onSuccess={handleCreateSuccess} />
              )}
            </div>
          </div>

          {/* Bottom Panel: Ticket List */}
          <div className="legacy-panel bg-[#fcfcfc] flex-1 flex flex-col min-h-0">
            <div className="bg-[#e1e1e1] px-2 py-1 text-xs font-bold text-[#333] border-b border-gray-300 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> MY TICKETS
              </span>
              <button onClick={loadTickets} className="text-[10px] text-blue-800 hover:underline">
                Refresh
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loadingTickets && (
                <div className="flex items-center justify-center py-8">
                  <SkyLoader size="medium" text="Loading tickets..." />
                </div>
              )}
              {!loadingTickets && tickets.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-4 italic">
                  No tickets found.
                </div>
              )}
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`border p-2 cursor-pointer transition-colors ${selectedTicket?.id === t.id && viewMode === 'chat'
                    ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-200'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-[#333] truncate pr-2">{t.subject}</span>
                    <span
                      className={`text-[9px] px-1 border uppercase ${t.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-gray-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-blue-600 hover:underline">View &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="legacy-panel bg-white shrink-0">
            <div className="bg-[#e1e1e1] px-2 py-1 text-xs font-bold text-[#333] border-b border-gray-300 mb-2">
              ABOUT SKY EXPRESS VA
            </div>
            <div className="text-xs text-[#333] px-2 pb-2 leading-relaxed">
              <p className="mb-2">Established 2026. Simulating a leading Virtual Airline.</p>
              <p>
                Fleet: <strong>ATR 42/72</strong>, <strong>Airbus A320neo/A321neo</strong>.
              </p>
            </div>
          </div>

          <FAQSection />
        </div>
      </div>
    </div>
  )
}
