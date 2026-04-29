import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'
import { useLocation } from 'react-router-dom'
import { DataService, PilotProfile, DirectMessage } from '../services/dataService'
import { supabase } from '../services/supabase'
import {
  Users,
  Search,
  MessageCircle,
  Heart,
  UserPlus,
  X,
  Clock,
  Check,
  Sparkles,
  Send
} from 'lucide-react'
import { toastConfirm } from '../utils/toastConfirm'

import { SkyLoader } from '../components/ui/SkyLoader'

// Helper Component for the Connection Button
const ConnectButton = ({
  pilot,
  currentUser,
  onAction,
  refreshKey
}: {
  pilot: PilotProfile
  currentUser: PilotProfile | null
  onAction: (id: string) => void
  refreshKey: number
}): React.ReactElement | null => {
  const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'connected'>(
    'none'
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const checkStatus = async (): Promise<void> => {
      const s = await DataService.getConnectionStatus(pilot.id)
      if (mounted) setStatus(s)
    }
    checkStatus()
    return () => {
      mounted = false
    }
  }, [pilot.id, refreshKey])

  const handleClick = async (): Promise<void> => {
    setLoading(true)
    try {
      if (status === 'none') {
        await DataService.sendConnectionRequest(pilot.id)
        setStatus('pending_sent')
        onAction(pilot.id)
      } else if (status === 'pending_received') {
        await DataService.acceptRequestFrom(pilot.id)
        setStatus('connected')
        onAction(pilot.id)
      } else if (status === 'pending_sent') {
        // Cancel pending request
        if (await toastConfirm(`Cancel connection request to ${pilot.callsign}?`)) {
          await DataService.cancelConnectionRequest(pilot.id)
          setStatus('none')
          onAction(pilot.id)
        }
      } else if (status === 'connected') {
        if (
          await toastConfirm(
            `Are you sure you want to remove ${pilot.callsign} from your connections?`
          )
        ) {
          await DataService.removeConnection(pilot.id)
          setStatus('none')
          onAction(pilot.id)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (pilot.id === currentUser?.id) return null

  if (status === 'connected') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm flex items-center justify-center gap-1.5 transition-all group duration-300"
      >
        <Heart className="w-3.5 h-3.5 fill-current group-hover:hidden transition-all" />
        <X className="w-3.5 h-3.5 hidden group-hover:block transition-all" />
        <span className="group-hover:hidden">Connected</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm flex items-center justify-center gap-1.5 transition-all group duration-300"
      >
        <Clock className="w-3.5 h-3.5 group-hover:hidden" />
        <X className="w-3.5 h-3.5 hidden group-hover:block" />
        <span className="group-hover:hidden">Pending</span>
        <span className="hidden group-hover:inline">Cancel</span>
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-600 hover:shadow-md shadow-sm flex items-center justify-center gap-1.5 transition-all duration-300"
      >
        <Check className="w-3.5 h-3.5" /> Accept
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white hover:bg-slate-800 text-slate-600 hover:text-white shadow-sm flex items-center justify-center gap-1.5 transition-all duration-300"
    >
      <UserPlus className="w-3.5 h-3.5" /> Connect
    </button>
  )
}

// --- SOCIAL HUB COMPONENT ---

export const SocialHub = (): React.ReactElement => {
  const [pilots, setPilots] = useState<PilotProfile[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [showConnected, setShowConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<PilotProfile | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Chat State
  const [selectedPilot, setSelectedPilot] = useState<PilotProfile | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  const loadData = async (showLoading = true): Promise<void> => {
    if (showLoading) setLoading(true)
    try {
      const [allPilots, myFollowing] = await Promise.all([
        DataService.getAllPilots(),
        DataService.getFollowing()
      ])
      setPilots(allPilots)
      setFollowing(myFollowing)
      setRefreshKey((prev) => prev + 1)

      // DataService returns [] on error instead of throwing
    } catch (e) {
      console.error('Failed to load social data', e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Initial Load & Realtime Subscription
  useEffect(() => {
    let mounted = true
    loadData()
    DataService.getProfile()
      .then((p) => {
        if (mounted) setCurrentUser(p)
      })
      .catch((err) => {
        console.error('Failed to get profile in Social Hub', err)
      })

    // Subscribe to changes in friend_requests and social_connections
    const channel = supabase
      .channel('social_hub_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        loadData(false) // Silent refresh
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_connections' }, () => {
        loadData(false) // Silent refresh
      })
      .subscribe()

    // Fallback: poll every 15 seconds in case realtime is not enabled
    const interval = setInterval(() => loadData(false), 15 * 1000)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  // Deep Link Handling
  const location = useLocation()
  useEffect(() => {
    const state = location.state as { openChatWith?: string; view?: string }
    if (state?.openChatWith && pilots.length > 0) {
      const pilot = pilots.find((p) => p.id === state.openChatWith)
      if (pilot) {
        handleOpenChat(pilot)
        // Clear state to prevent re-opening on refresh (optional, but good practice)
        window.history.replaceState({}, '')
      }
    }
  }, [location.state, pilots])

  // Chat Logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    const fetchMessages = async (): Promise<void> => {
      if (selectedPilot) {
        const msgs = await DataService.getDirectMessages(selectedPilot.id)
        setMessages(msgs)
      }
    }

    if (chatOpen && selectedPilot) {
      fetchMessages()
      interval = setInterval(fetchMessages, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [chatOpen, selectedPilot])

  const handleOpenChat = (pilot: PilotProfile): void => {
    setSelectedPilot(pilot)
    setChatOpen(true)
    DataService.markDMsAsRead(pilot.id).catch((err) => {
      console.error(err)
    })
  }

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedPilot) return

    // Enforce message length limit
    const trimmedMessage = newMessage.trim().substring(0, 2000)

    try {
      await DataService.sendDirectMessage(selectedPilot.id, trimmedMessage)
      setNewMessage('')
      // Refresh immediately
      const msgs = await DataService.getDirectMessages(selectedPilot.id)
      setMessages(msgs)
    } catch (e) {
      console.error(e)
    }
  }

  const filteredPilots = pilots.filter(
    (p) =>
      (p.callsign.toLowerCase().includes(search.toLowerCase()) ||
        p.homeBase.toLowerCase().includes(search.toLowerCase())) &&
      (!showConnected || following.includes(p.id))
  )

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full bg-slate-50/50"
    >
      {/* LEFT: PILOT DIRECTORY */}
      <div
        className={`relative z-10 flex-1 flex flex-col p-6 xl:p-8 overflow-auto transition-all duration-300 ${chatOpen ? 'pr-2 md:pr-6' : ''}`}
      >
        {/* PREMIUM HERO HEADER */}
        <motion.div
           variants={slideDown}
           className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#1a365d] via-blue-800 to-blue-600 rounded-3xl p-7 mb-6 shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
           {/* Abstract Header Background Pattern */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>

           <div className="relative z-10">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-sm">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-sky-100 border border-white/20 shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                Flight Crew Directory
              </h1>
              <p className="text-blue-100 mt-2.5 max-w-md text-sm leading-relaxed opacity-90 font-medium">
                Connect with active pilots on the Sky Express network. Team up for group flights, swap routes, and build your aviation career together.
              </p>
           </div>

           {/* Quick Stats inside Header */}
           <div className="relative z-10 flex items-center gap-6 bg-black/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
             <div className="flex flex-col items-center">
               <span className="text-2xl font-black text-white">{pilots.length}</span>
               <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-0.5">Total Pilots</span>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="flex flex-col items-center">
               <span className="text-2xl font-black text-white">{pilots.filter(p => following.includes(p.id)).length}</span>
               <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">My Friends</span>
             </div>
           </div>
        </motion.div>

        {/* SEARCH AND FILTERS BAR */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative z-10">
          <button
            onClick={() => setShowConnected(!showConnected)}
            data-tutorial="connections-filter"
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 shadow-sm border ${
              showConnected
                ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 transition-colors ${showConnected ? 'fill-current text-blue-500' : 'text-slate-400'}`} />
            My Connections
          </button>
          
          <div className="relative group w-full sm:w-auto">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by Callsign or Base..."
              className="pl-11 py-2.5 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium w-full sm:w-72 md:w-80 shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <SkyLoader text="Scanning Pilot Network..." />
          </div>
        ) : (
          <motion.div
            key={`grid-${showConnected}-${search}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-6 pb-8 px-1"
            data-tutorial="pilot-directory"
          >
            {filteredPilots.map((pilot) => (
              <motion.div
                variants={fadeInUp}
                key={pilot.id}
                className={`group bg-white rounded-2xl p-5 flex flex-col gap-4 min-h-[140px] h-full transition-all duration-300 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 ${pilot.equipped_background ? `${pilot.equipped_background} bg-cover border-none shadow-lg text-white` : pilot.id === currentUser?.id ? 'border-2 border-blue-400 bg-blue-50 shadow-md outline outline-4 outline-blue-500/10' : 'border border-slate-200 shadow-sm hover:border-blue-200'}`}
              >
                <div
                  className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${pilot.equipped_background ? 'opacity-50' : 'opacity-100'}`}
                />
                
                <div className="flex gap-4 items-center">
                  {/* Avatar section */}
                  <div
                    className={`w-16 h-16 rounded-2xl shadow-md overflow-hidden relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${pilot.equipped_frame || 'border-2 border-white ring-1 ring-slate-100'}`}
                  >
                    {pilot.avatar_url ? (
                      <img src={pilot.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${pilot.equipped_background || 'bg-slate-100'}`}
                      >
                        <Users className={`w-7 h-7 ${pilot.equipped_background ? 'text-white/50' : 'text-slate-300'}`} />
                      </div>
                    )}
                  </div>

                  {/* Info section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div
                        className={`text-lg font-black tracking-tight ${pilot.equipped_color || (pilot.equipped_background ? 'text-white drop-shadow-sm' : 'text-slate-800')}`}
                      >
                        {pilot.callsign}
                      </div>
                      <div
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${pilot.equipped_background ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      >
                        {pilot.rank}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`text-xs font-semibold flex items-center gap-1.5 ${pilot.equipped_background ? 'text-white/80' : 'text-slate-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${pilot.equipped_background ? 'bg-green-400' : 'bg-green-500 animate-pulse'}`}></div>
                        {pilot.homeBase}
                      </div>
                      <span className={`text-xs ${pilot.equipped_background ? 'text-white/30' : 'text-slate-300'}`}>•</span>
                      <div
                        className={`text-[11px] font-bold ${pilot.equipped_background ? 'text-blue-200' : 'text-slate-400'}`}
                      >
                        {pilot.flightHours.toFixed(1)} HRS
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions section */}
                <div className="flex gap-2.5 mt-auto bg-slate-50/20 backdrop-blur-sm -mx-2 -mb-2 p-2 rounded-xl">
                  <ConnectButton
                    pilot={pilot}
                    currentUser={currentUser}
                    refreshKey={refreshKey}
                    onAction={() => {
                      loadData(false)
                    }}
                  />
                  <button
                    onClick={() => handleOpenChat(pilot)}
                    data-tutorial="chat-button"
                    className="p-2 aspect-square rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all duration-300 hover:shadow-md flex items-center justify-center shrink-0 group/chat"
                    title="Send Private Message"
                  >
                    <MessageCircle className="w-4 h-4 group-hover/chat:scale-110 transition-transform" />
                  </button>
                </div>

                {pilot.equipped_background && (
                  <div className="absolute -bottom-6 -right-6 opacity-20 rotate-12 pointer-events-none scale-150 transform transition-transform duration-1000 group-hover:rotate-45">
                    <Sparkles className="w-32 h-32 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {/* Thematic Empty Space Filler (Radar) */}
            <motion.div variants={fadeInUp} className="col-span-full mt-16 flex flex-col items-center justify-center text-slate-400 opacity-60 pb-12 select-none">
              <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 border-[3px] border-blue-400 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-3 border-[3px] border-blue-400 rounded-full animate-ping opacity-40" style={{ animationDuration: '3s', animationDelay: '0.4s' }}></div>
                <div className="absolute inset-6 border-[3px] border-blue-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '3s', animationDelay: '0.8s' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] relative z-10"></div>
              </div>
              <p className="font-bold tracking-widest uppercase text-xs text-slate-500">ATC Radar Scanning Sector...</p>
              <p className="text-[10px] mt-1.5 font-medium text-slate-400 uppercase tracking-wider">Awaiting more Sky Express traffic</p>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* RIGHT: CHAT PANE (SLIDE IN) */}
      <AnimatePresence>
        {chatOpen && selectedPilot && (
          <motion.div
            initial={{ x: 400, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 400, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[360px] md:w-[400px] shrink-0 bg-white shadow-[-15px_0_30px_-15px_rgba(0,0,0,0.1)] flex flex-col border-l border-slate-200 z-10 my-4 mr-4 rounded-3xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex justify-between items-center shadow-md relative overflow-hidden shadow-blue-900/10">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl overflow-hidden shadow-inner backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  {selectedPilot.avatar_url ? (
                    <img src={selectedPilot.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-white/70" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-wide drop-shadow-sm">{selectedPilot.callsign}</span>
                  <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Online Now</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors relative z-10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 mt-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-200" />
                  </div>
                  <span className="text-sm font-bold text-slate-500">Start the conversation!</span>
                  <span className="text-xs mt-1">Say hello to {selectedPilot.callsign}.</span>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser?.id
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-[13px] font-medium shadow-sm leading-relaxed
                         ${
                           isMe
                             ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-600/20'
                             : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-slate-200/50'
                         }
                       `}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-1.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 bg-transparent text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
