import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DataService, PilotProfile, DirectMessage } from '../services/dataService'
import { supabase } from '../services/supabase'
import { Users, Search, MessageCircle, Heart, UserPlus, X, Clock, Check } from 'lucide-react'
import { SkyLoader } from '../components/ui/SkyLoader'

// Helper Component for the Connection Button
const ConnectButton = ({ pilot, currentUser, onAction, refreshKey }: { pilot: PilotProfile, currentUser: PilotProfile | null, onAction: (id: string) => void, refreshKey: number }): React.ReactElement | null => {
  const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'connected'>('none')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const checkStatus = async (): Promise<void> => {
      const s = await DataService.getConnectionStatus(pilot.id)
      if (mounted) setStatus(s)
    }
    checkStatus()
    return () => { mounted = false }
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
        if (confirm(`Cancel connection request to ${pilot.callsign}?`)) {
          await DataService.removeConnection(pilot.id)
          setStatus('none')
          onAction(pilot.id)
        }
      } else if (status === 'connected') {
        if (confirm(`Are you sure you want to remove ${pilot.callsign} from your connections?`)) {
          await DataService.removeConnection(pilot.id)
          setStatus('none')
          onAction(pilot.id)
        }
      }
    } catch (e) {
      console.error(e)
      alert('Failed to connect. Please check if the database is set up correctly (friend_requests table).')
    }
    setLoading(false)
  }

  if (pilot.id === currentUser?.id) return null

  if (status === 'connected') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex-1 py-1 text-[10px] font-bold border border-blue-400 bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-600 hover:border-red-400 flex items-center justify-center gap-1 transition-colors group"
      >
        <Heart className="w-3 h-3 fill-current group-hover:hidden" />
        <X className="w-3 h-3 hidden group-hover:block" />
        <span className="group-hover:hidden">CONNECTED</span>
        <span className="hidden group-hover:inline">UNFRIEND</span>
      </button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex-1 py-1 text-[10px] font-bold border border-gray-300 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center gap-1 transition-colors group cursor-pointer"
      >
        <Clock className="w-3 h-3 group-hover:hidden" />
        <X className="w-3 h-3 hidden group-hover:block" />
        <span className="group-hover:hidden">PENDING</span>
        <span className="hidden group-hover:inline">CANCEL</span>
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <button onClick={handleClick} disabled={loading} className="flex-1 py-1 text-[10px] font-bold border border-green-500 bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center gap-1 transition-colors">
        <Check className="w-3 h-3" /> ACCEPT
      </button>
    )
  }

  return (
    <button onClick={handleClick} disabled={loading} className="flex-1 py-1 text-[10px] font-bold border border-gray-300 bg-gray-100 hover:bg-white text-gray-600 flex items-center justify-center gap-1 transition-colors">
      <UserPlus className="w-3 h-3" /> CONNECT
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
    DataService.getProfile().then(p => {
      if (mounted) setCurrentUser(p)
    })

    // Subscribe to changes in friend_requests and social_connections
    const channel = supabase
      .channel('social_hub_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => {
          loadData(false) // Silent refresh
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_connections' },
        () => {
          loadData(false) // Silent refresh
        }
      )
      .subscribe()

    // Fallback: poll every 15 seconds in case realtime is not enabled
    const interval = setInterval(() => loadData(false), 15 * 1000)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

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
    DataService.markDMsAsRead(pilot.id)
  }

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedPilot) return

    try {
      await DataService.sendDirectMessage(selectedPilot.id, newMessage)
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
    <div className="flex h-full font-tahoma bg-[#f0f0f0]">
      {/* LEFT: PILOT DIRECTORY */}
      <div
        className={`flex-1 flex flex-col p-4 overflow-hidden duration-300 ${chatOpen ? 'w-1/2' : 'w-full'}`}
      >
        <div className="flex justify-between items-end border-b-2 border-white pb-2 mb-4">
          <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter flex items-center gap-2">
            <Users className="w-6 h-6" /> Flight Crew Directory
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConnected(!showConnected)}
              data-tutorial="connections-filter"
              className={`px-3 py-1 text-xs font-bold border flex items-center gap-1 transition-colors ${showConnected
                ? 'bg-blue-100 border-blue-400 text-blue-800'
                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-white'
                }`}
            >
              <Heart className={`w-3 h-3 ${showConnected ? 'fill-current' : ''}`} />
              MY CONNECTIONS
            </button>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Callsign / Base..."
                className="pl-8 p-1 inset-box text-xs w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <SkyLoader text="Scanning Pilot Network..." />
          </div>
        ) : (
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto"
            data-tutorial="pilot-directory"
          >
            {filteredPilots.map((pilot) => (
              <motion.div
                layoutId={pilot.id}
                key={pilot.id}
                className={`legacy-panel p-2 flex flex-col gap-2 ${pilot.id === currentUser?.id ? 'border-blue-300 bg-blue-50' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-gray-300 border border-gray-400 shadow-inner flex shrink-0 items-center justify-center overflow-hidden">
                    {pilot.avatar_url ? (
                      <img src={pilot.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-gray-500 opacity-50" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-bold text-blue-900 truncate">
                        {pilot.callsign}
                      </div>
                      <div className="text-[10px] text-gray-600 font-bold uppercase">
                        {pilot.rank}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Base: <span className="font-mono text-black">{pilot.homeBase}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-green-700 font-bold">
                      {pilot.flightHours.toFixed(1)} HRS
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-1">
                  <ConnectButton
                    pilot={pilot}
                    currentUser={currentUser}
                    refreshKey={refreshKey}
                    onAction={() => {
                      // Refresh data immediately without showing full loading spinner if possible, 
                      // or just quick refresh to update 'following' list.
                      loadData(false)
                    }}
                  />
                  <button
                    onClick={() => handleOpenChat(pilot)}
                    data-tutorial="chat-button"
                    className="p-1 px-3 bg-gray-100 border border-gray-300 hover:bg-white text-gray-600"
                    title="Send Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: CHAT PANE (SLIDE IN) */}
      {
        chatOpen && selectedPilot && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-96 border-l-2 border-white bg-[#e6e6e6] shadow-xl flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-3 bg-blue-900 text-white font-bold flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded-full overflow-hidden">
                  {selectedPilot.avatar_url ? (
                    <img src={selectedPilot.avatar_url} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs uppercase opacity-75">Chat with</span>
                  <span>{selectedPilot.callsign}</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="hover:bg-blue-800 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 inset-box bg-white m-2 mb-0">
              {messages.length === 0 && (
                <div className="text-center text-xs text-gray-400 mt-10 italic">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser?.id
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-2 rounded max-w-[80%] text-xs shadow-sm text-balance
                       ${isMe
                          ? 'bg-blue-100 border border-blue-200 text-blue-900 rounded-br-none'
                          : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-none'
                        }
                     `}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-2 flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-400 text-xs shadow-inner"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="btn-classic px-4 font-bold disabled:opacity-50"
              >
                SEND
              </button>
            </form>
          </motion.div>
        )
      }
    </div >
  )
}
