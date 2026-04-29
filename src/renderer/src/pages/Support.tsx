import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Mail,
  ChevronDown,
  Send,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Info,
  LifeBuoy,
  Plane,
  Plus,
  ArrowLeft,
  Clock,
  Search,
  Headphones,
  BookOpen,
  Sparkles,
  X
} from 'lucide-react'
import { DataService } from '../services/dataService'
import { supabase } from '../services/supabase'
import { SkyLoader } from '../components/ui/SkyLoader'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, fadeInUp, slideDown } from '../utils/animations'
import { toastConfirm } from '../utils/toastConfirm'

// --- Types ---
interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
  message?: string
  profiles?: { callsign: string }
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

// --- FAQ Data ---
const FAQS = [
  {
    q: 'How do I book a flight?',
    a: "Go to the 'Schedule' page to find a flight. Click 'BOOK' to generate your flight plan on SimBrief. This saves the flight to your 'My Flights' page.",
    icon: Plane
  },
  {
    q: 'How are my flight hours tracked?',
    a: "Tracking starts when you click the green 'START' button on your booked flight in 'My Flights'. Ensure your simulator is connected via SimConnect *before* clicking Start.",
    icon: Clock
  },
  {
    q: 'How is my income calculated?',
    a: 'Base pay is $2 per NM. You earn a 1.2x bonus for a score above 60, and a 1.5x bonus for a score above 80 (e.g., a "Butter" landing).',
    icon: Sparkles
  },
  {
    q: 'How do I increase my Rank?',
    a: 'Currently, all pilots hold the rank of Cadet. We are introducing a rank progression system in a future update that will be based on flight hours and reputation.',
    icon: Info
  },
  {
    q: 'How is my landing scored?',
    a: 'Landings are graded by vertical speed at touchdown. PERFECT BUTTER (< 50 fpm), BUTTER (< 100 fpm), GOOD (< 250 fpm), FIRM (< 500 fpm), HARD (> 500 fpm).',
    icon: Info
  },
  {
    q: "Why isn't my SimBrief import working?",
    a: 'Ensure you entered your SimBrief Pilot ID (Number) in Settings, NOT your username. You can find this ID in your SimBrief account details.',
    icon: HelpCircle
  },
  {
    q: 'How do I delete my account?',
    a: "You can permanently delete your account and all associated data (logs, flights) by going to Settings and clicking the 'DELETE ACCOUNT' button.",
    icon: Info
  },
  {
    q: 'Can I close my own support ticket?',
    a: "Yes. If you find a solution, open your ticket in the Support chat and click 'I Found a Solution (Delete Ticket)' to close and remove it.",
    icon: CheckCircle
  },
  {
    q: 'Where can I see my Flight Plan (OFP)?',
    a: "After booking, go to 'My Flights' and click the 'OFP' button on your flight card. This opens the Dispatch view with your SimBrief data.",
    icon: BookOpen
  },
  {
    q: 'Do I get penalized for pausing the simulator?',
    a: 'Yes. If you pause the simulator for more than a few minutes during a live flight, your flight score will be heavily penalized and the flight may be marked as invalid.',
    icon: Info
  },
  {
    q: 'Can I speed up (slew) time during cruise?',
    a: 'No, Sky Express VA requires 1x simulation rate from block-to-block. Accelerating time will cause the smart ACARS system to instantly flag and reject your flight as invalid.',
    icon: Info
  },
  {
    q: 'How does the Rank system work?',
    a: 'As you accumulate valid flight hours, you will automatically be promoted. Promotions unlock access to larger, more complex airframes in the Fleet page.',
    icon: Info
  },
  {
    q: 'What is the "Sky Store" used for?',
    a: 'You earn Sky Coins for every successful flight. You can spend these coins in the Sky Store to customize your Pilot Profile with unique backgrounds, frames, and titles!',
    icon: Sparkles
  },
  {
    q: 'How do I add friends?',
    a: "Head to the 'Social Hub' to browse all active pilots. Click 'Connect' on a pilot's card to send them a friend request. Once they accept, you can message them directly!",
    icon: Info
  },
  {
    q: 'What are Expeditions (Tours)?',
    a: "Expeditions are multi-leg grand tours across real-world routes. Join one from the Expeditions page, then fly each leg in order. Your progress is tracked automatically — complete all legs to earn an exclusive badge! You can only cancel a tour before flying the first leg.",
    icon: Plane
  },
  {
    q: 'What is Free Roam mode?',
    a: "Free Roam lets you fly any route worldwide, not just Sky Express network routes. Enter any departure and arrival ICAO, pick your aircraft, and generate a SimBrief OFP. The flight is fully tracked with scoring and PIREP generation, just like a scheduled flight.",
    icon: HelpCircle
  },
  {
    q: 'How does the Live Map work?',
    a: "The Live Map shows all Sky Express pilots currently flying in real-time. Your position updates automatically via the ACARS system while you are on an active flight. Other pilots can see your callsign, aircraft, altitude, and route.",
    icon: Info
  },
  {
    q: 'What aircraft can I fly?',
    a: "Sky Express operates the Airbus A320-200, Airbus A320neo, ATR 42-600, and ATR 72-600. Aircraft availability depends on your rank — higher ranks unlock larger airframes. Check the Fleet page to see what you have access to.",
    icon: Plane
  },
  {
    q: 'How do I connect my simulator (SimConnect)?',
    a: "Make sure Microsoft Flight Simulator (2020 or 2024) is running before you click START on a booked flight. The app connects automatically via SimConnect. If connection fails, restart the app and ensure no other ACARS tool is running simultaneously.",
    icon: HelpCircle
  },
  {
    q: 'Can I have multiple flights booked at once?',
    a: "Yes, you can book multiple flights from the Schedule page. They all appear in your 'My Flights' tab. However, you can only track and fly one flight at a time — start the flight you want to fly and complete it before starting another.",
    icon: Info
  },
  {
    q: 'What happens if I crash or disconnect mid-flight?',
    a: "If your simulator crashes or you disconnect during an active flight, the ACARS system will detect the interruption. The flight will be marked as invalid and will not count toward your career statistics or earnings. You can rebook the same route.",
    icon: HelpCircle
  },
  {
    q: 'How is my overall flight score calculated?',
    a: "Your flight score (0-100) is based on multiple factors: landing vertical speed (the most important), flight path accuracy, and any penalties incurred (pausing, time acceleration, etc). A score above 80 earns a bonus multiplier on your pay.",
    icon: Sparkles
  },
  {
    q: 'What is the Dossier page?',
    a: "The Dossier is your pilot career overview. It shows your callsign, rank, total flight hours, career balance, earned badges, and recent flight history. Think of it as your personal pilot record and achievement showcase.",
    icon: Info
  },
  {
    q: 'Can I request a flight deletion?',
    a: "Yes. If a PIREP was logged incorrectly (e.g., a test flight), go to the PIREP Log, hover over the flight, and click the trash icon. You must provide a reason — an admin will review and approve or deny the deletion request.",
    icon: HelpCircle
  },
  {
    q: 'What is a PIREP?',
    a: "A PIREP (Pilot Report) is the record generated after you complete a flight. It includes your route, flight time, landing rate, score, grade, and any penalties. All your PIREPs are stored in the PIREP Log and contribute to your career stats.",
    icon: BookOpen
  },
  {
    q: 'Do I need SimBrief to fly?',
    a: "Yes, SimBrief integration is required for all flights (both scheduled and Free Roam). When you book a flight, the app opens SimBrief to generate your OFP (Operational Flight Plan). Make sure your SimBrief Pilot ID is set in Settings.",
    icon: Info
  },
  {
    q: 'How do I change my Home Base or Location?',
    a: "Your current location updates automatically based on your last arrival airport. Your home base is set during registration and represents your airline hub. These are displayed on your Dossier and visible to other pilots.",
    icon: Info
  }
]

// ─── FAQ Accordion ───
const FAQAccordion = ({ searchQuery }: { searchQuery: string }): React.ReactElement => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filtered = searchQuery
    ? FAQS.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQS

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center">
        <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-500">No results found for "{searchQuery}"</p>
        <p className="text-xs text-slate-400 mt-1">Try different keywords or open a ticket</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2.5">
      {filtered.map((faq, i) => {
        const Icon = faq.icon
        return (
          <div
            key={i}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              openIndex === i
                ? 'bg-white border-pink-200 shadow-md shadow-pink-500/5'
                : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center gap-4 p-4 text-left transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  openIndex === i
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-bold text-slate-700">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    openIndex === i ? 'text-pink-500' : 'text-slate-400'
                  }`}
                />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pl-[68px] text-[13px] text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── Ticket Card ───
const TicketCard = ({
  ticket,
  isSelected,
  onClick
}: {
  ticket: SupportTicket
  isSelected: boolean
  onClick: () => void
}): React.ReactElement => (
  <button
    onClick={onClick}
    className={`group text-left w-full p-4 rounded-2xl border transition-all duration-200 ${
      isSelected
        ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200/50 shadow-md'
        : 'bg-white border-slate-200 hover:border-pink-200 hover:shadow-md hover:shadow-pink-500/5'
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <span className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">
        {ticket.subject}
      </span>
      <span
        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shrink-0 ${
          ticket.status === 'resolved'
            ? 'bg-sky-50 text-sky-600 border-sky-200'
            : 'bg-amber-50 text-amber-600 border-amber-200'
        }`}
      >
        {ticket.status}
      </span>
    </div>
    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
        #{ticket.id.split('-')[0]}
      </span>
      <span>
        {new Date(ticket.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        })}
      </span>
    </div>
  </button>
)

// ─── Create Ticket Form (Modal-style overlay) ───
const CreateTicketForm = ({
  onSuccess,
  onCancel
}: {
  onSuccess: () => void
  onCancel: () => void
}): React.ReactElement => {
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
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.form
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">New Support Request</h2>
              <p className="text-xs font-medium text-slate-400">We'll review your inquiry within 24 hours</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Topic
            </label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3.5 pl-4 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 focus:bg-white appearance-none cursor-pointer transition-all"
                required
              >
                <option value="" disabled>
                  -- Select a Topic --
                </option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Tech Support (ACARS)">Tech Support (ACARS)</option>
                <option value="Flight Reporting Issue">Flight Reporting Issue</option>
                <option value="Career/Rank Question">Career/Rank Question</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-40 text-sm p-4 border border-slate-200 rounded-xl bg-slate-50 resize-none focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 focus:bg-white transition-all placeholder:text-slate-400 font-medium leading-relaxed"
              placeholder="Describe your issue in detail..."
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending || !subject || !message}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:from-pink-600 hover:to-pink-700 active:scale-[0.97] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 transition-all"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}

// ─── Chat View (takes over the page) ───
const ChatView = ({
  ticket,
  onDelete,
  onClose
}: {
  ticket: SupportTicket
  onDelete: () => void
  onClose: () => void
}): React.ReactElement => {
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id)
      })
      .catch((err) => {
        console.error('Failed to get user:', err)
      })
  }, [])

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
    const channel = supabase
      .channel(`ticket_messages_${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        () => {
          loadMessages()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticket.id, loadMessages])

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
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (
      await toastConfirm(
        'Found a solution? This will delete the ticket permanently.'
      )
    ) {
      try {
        await DataService.deleteSupportTicket(ticket.id)
        onDelete()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="absolute inset-0 z-40 flex flex-col bg-slate-50/80 backdrop-blur-sm"
    >
      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto min-h-0">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-5 shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
              #{ticket.id.split('-')[0]}
            </div>
            <div className="text-base font-bold text-slate-800 truncate mt-0.5">
              {ticket.subject}
            </div>
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
              ticket.status === 'resolved'
                ? 'bg-sky-50 text-sky-600 border-sky-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            {ticket.status}
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-t-3xl border-x border-t border-slate-200 shadow-sm overflow-y-auto custom-scrollbar p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <SkyLoader size="medium" text="Loading messages..." />
            </div>
          )}

          {!loading && messages.length === 0 && ticket.message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-end"
            >
              <div className="max-w-[80%] bg-gradient-to-br from-sky-500 to-sky-600 text-white px-5 py-4 rounded-2xl rounded-tr-sm shadow-md shadow-sky-500/20">
                <div className="text-[10px] font-bold text-sky-100 mb-1.5 uppercase tracking-wider">
                  You ·{' '}
                  {new Date(ticket.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <p className="text-[14px] font-medium whitespace-pre-wrap leading-relaxed">
                  {ticket.message}
                </p>
              </div>
            </motion.div>
          )}

          {!loading &&
            messages.map((msg, idx) => {
              const isAdmin = msg.profiles?.is_admin
              const isMe = msg.sender_id === currentUserId
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-5 py-4 shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-2xl rounded-tr-sm shadow-sky-500/15'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-black mb-1.5 flex items-center gap-1.5 uppercase tracking-wider ${
                        isMe ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      {isAdmin && (
                        <CheckCircle
                          className={`w-3.5 h-3.5 ${
                            isMe ? 'text-sky-200' : 'text-pink-500'
                          }`}
                        />
                      )}
                      {isMe ? 'You' : msg.profiles?.callsign || 'Admin'}
                      <span
                        className={`font-mono text-[10px] tracking-normal ${
                          isMe ? 'opacity-50' : 'text-slate-300'
                        } ml-1`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-[14px] font-medium whitespace-pre-wrap leading-relaxed ${
                        isMe ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          <div ref={messagesEndRef} className="pb-2" />
        </div>

        {/* Input Area */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-3xl p-4 shrink-0 shadow-sm">
          {ticket.status === 'resolved' ? (
            <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl text-center text-sm font-bold text-sky-700 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              This ticket has been resolved.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex gap-2.5">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="flex-1 min-h-[52px] h-[52px] max-h-[150px] text-sm p-3.5 border border-slate-200 rounded-xl focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 resize-none font-medium bg-slate-50 placeholder:text-slate-400 transition-all"
                  placeholder="Type your reply... (Enter to send)"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !replyText.trim()}
                  className="w-12 h-[52px] bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl font-bold flex items-center justify-center shadow-sm shadow-sky-500/20 hover:shadow-sky-500/40 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 transition-all"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-between items-center px-1">
                <button
                  onClick={handleDelete}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1.5 transition-colors"
                  title="Only click this if you no longer need help!"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  I found a solution (Delete Ticket)
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.8)] animate-pulse" />
                  Staff online
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ───
export const Support = (): React.ReactElement => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [viewMode, setViewMode] = useState<'home' | 'create' | 'chat'>('home')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadTickets = useCallback(async (): Promise<void> => {
    setLoadingTickets(true)
    try {
      const data = await DataService.getSupportTickets(false)
      setTickets(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTickets(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Deep link
  const location = useLocation()
  useEffect(() => {
    const state = location.state as { openTicketId?: string }
    if (state?.openTicketId && tickets.length > 0) {
      const ticket = tickets.find((t) => t.id === state.openTicketId)
      if (ticket) {
        setSelectedTicket(ticket)
        setViewMode('chat')
        window.history.replaceState({}, '')
      }
    }
  }, [location.state, tickets])

  const handleCreateSuccess = (): void => {
    loadTickets()
    setViewMode('home')
  }

  const handleSelectTicket = (t: SupportTicket): void => {
    setSelectedTicket(t)
    setViewMode('chat')
  }

  const openTicketCount = tickets.filter((t) => t.status === 'open').length

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col font-sans bg-slate-50/50 overflow-hidden relative"
    >
      {/* ─── Page Header ─── */}
      <motion.div
        variants={slideDown}
        className="px-6 xl:px-8 pt-6 xl:pt-8 pb-5 shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm z-20"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-400/25">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Support Center
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Get help, browse FAQs, or open a ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Open ticket count badge */}
            {openTicketCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-700">
                  {openTicketCount} open
                </span>
              </div>
            )}

            <button
              onClick={loadTickets}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 flex items-center justify-center transition-all shadow-sm"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setViewMode('create')
                setSelectedTicket(null)
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:from-pink-600 hover:to-pink-700 active:scale-[0.97] transition-all"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="px-6 xl:px-8 py-6 xl:py-8 max-w-5xl mx-auto space-y-8">
          {/* ─── Your Tickets Section ─── */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Your Tickets
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {tickets.length} total
              </span>
            </div>

            {loadingTickets ? (
              <div className="flex items-center justify-center py-6">
                <SkyLoader size="small" text="Loading tickets..." />
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 mb-1">No tickets yet</p>
                <p className="text-xs text-slate-400">
                  Click "New Ticket" above to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tickets.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    isSelected={selectedTicket?.id === t.id && viewMode === 'chat'}
                    onClick={() => handleSelectTicket(t)}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* ─── Knowledge Base Section ─── */}
          <motion.div variants={fadeInUp}>
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-sky-50 to-pink-50/50 rounded-2xl border border-sky-100 p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sky-900 text-sm mb-1.5">
                    About Sky Express VA Support
                  </h3>
                  <p className="text-xs text-sky-700/70 leading-relaxed max-w-2xl">
                    We aim to review all tickets within 24 hours. Before opening a request, please check our knowledge base below.
                    Keep in mind that minor questions or community assistance can often be resolved much faster via our Discord community.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-sky-200/50">
                    {[
                      'MSFS 2020 / 2024',
                      'A320-200 / A320neo',
                      'ATR 42-600 / 72-600'
                    ].map((item) => (
                      <span
                        key={item}
                        className="text-[10px] font-bold text-sky-700/60 flex items-center gap-1.5"
                      >
                        <Plane className="w-3 h-3 text-sky-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Header + Search */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </h2>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/10 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <FAQAccordion searchQuery={searchQuery} />
          </motion.div>
        </div>
      </div>

      {/* ─── Overlays ─── */}
      <AnimatePresence>
        {viewMode === 'create' && (
          <CreateTicketForm
            key="create-form"
            onSuccess={handleCreateSuccess}
            onCancel={() => setViewMode('home')}
          />
        )}
        {viewMode === 'chat' && selectedTicket && (
          <ChatView
            key={`chat-${selectedTicket.id}`}
            ticket={selectedTicket}
            onDelete={() => {
              loadTickets()
              setViewMode('home')
            }}
            onClose={() => setViewMode('home')}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
