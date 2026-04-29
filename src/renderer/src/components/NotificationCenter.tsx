import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, MessageSquare, LifeBuoy, X, Users, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataService, FriendRequest, DirectMessage, SupportMessage } from '../services/dataService'
import { supabase } from '../services/supabase'
import { motion, AnimatePresence } from 'framer-motion'

type Notification = {
  id: string
  type: 'dm' | 'support' | 'request'
  title: string
  message: string
  time: string
  link: string
  data?: FriendRequest | DirectMessage | SupportMessage
}

export const NotificationCenter = (): React.ReactElement => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Persistent State for Seen/Dismissed
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sky_express_seen_notifications') || '[]')
    } catch {
      return []
    }
  })
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sky_express_dismissed_notifications') || '[]')
    } catch {
      return []
    }
  })

  // Save to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sky_express_seen_notifications', JSON.stringify(seenIds))
  }, [seenIds])

  useEffect(() => {
    localStorage.setItem('sky_express_dismissed_notifications', JSON.stringify(dismissedIds))
  }, [dismissedIds])

  // Fetch Notifications Function
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const allNotifications: Notification[] = []

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // 1. Fetch DMs
      const unreadDMs = await DataService.getUnreadDirectMessages()
      unreadDMs.forEach((msg) => {
        allNotifications.push({
          id: msg.id,
          type: 'dm',
          title: `Message from ${msg.sender?.callsign || 'Pilot'}`,
          message: msg.message,
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          link: '/social',
          data: msg
        })
      })

      // 2. Fetch Support
      const unreadSupport = await DataService.getUnreadSupportMessages()
      unreadSupport.forEach((msg) => {
        allNotifications.push({
          id: msg.id,
          type: 'support',
          title: `Support: ${msg.ticket?.subject || 'Ticket Update'}`,
          message: msg.message,
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          link: '/support',
          data: msg
        })
      })

      // 3. Fetch Friend Requests
      const requests = await DataService.getPendingRequests()
      requests.forEach((req) => {
        allNotifications.push({
          id: req.id,
          type: 'request',
          title: `Connection Request`,
          message: `${req.sender?.callsign || 'Unknown'} wants to connect.`,
          time: new Date(req.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          link: '/social',
          data: req
        })
      })

      // Sort by newest
      allNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      setNotifications(allNotifications)
      setLoading(false)
    } catch (err) {
      console.error('Fetch Crash:', err)
      setLoading(false)
    }
  }, [])

  // Poll for notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Real-time Subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupRealtime = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return

      console.log('Realtime: Subscribing as user:', user.id)

      channel = supabase
        .channel('notification_center')
        // New DMs for me
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            console.log('New DM!')
            fetchNotifications()
          }
        )
        // New Friend Requests (Broader listener - Relying on RLS)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'friend_requests' },
          (payload) => {
            console.log('Realtime Event: Friend Request', payload)
            if (payload.new && payload.new.receiver_id === user.id) {
              console.log('-> It is for me! Refreshing...')
              fetchNotifications()
            } else {
              console.log('-> Not for me (or I am sender). Ignoring.')
            }
          }
        )
        // New Support Messages
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'support_messages' },
          () => {
            console.log('New Support Msg!')
            fetchNotifications()
          }
        )
        .subscribe((status) => {
          console.log('Realtime Status:', status)
          // If connected, maybe force a fetch just in case we missed something during connect
          if (status === 'SUBSCRIBED') {
            fetchNotifications()
          }
        })
    }
    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchNotifications])

  const handleAcceptRequest = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation() // Prevent navigation
    try {
      await DataService.respondToRequest(notification.id, true)
      // Remove from list immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    } catch (error) {
      console.error('Failed to accept request', error)
    }
  }

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDismissedIds((prev) => [...prev, id])
  }

  const handleClearAll = () => {
    const ids = notifications.map((n) => n.id)
    setDismissedIds((prev) => [...prev, ...ids])
  }

  const handleToggleOpen = () => {
    const newState = !isOpen
    setIsOpen(newState)

    if (newState) {
      // Opening: Mark all *current* visible notifications as seen
      const visibleIds = visibleNotifications.map((n) => n.id)
      setSeenIds((prev) => {
        // Only add ones that aren't already seen
        const newSet = new Set([...prev, ...visibleIds])
        return Array.from(newSet)
      })
      // Force refresh on open to be sure
      fetchNotifications()
    }
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: Notification): void => {
    setIsOpen(false)

    // Deep Linking State
    let state = {}
    if (notification.type === 'dm' && notification.data) {
      // @ts-ignore
      state = { openChatWith: notification.data.sender_id }
    } else if (notification.type === 'support' && notification.data) {
      // @ts-ignore
      state = { openTicketId: notification.data.ticket_id }
    } else if (notification.type === 'request') {
      state = { view: 'connections' }
    }

    navigate(notification.link, { state })
  }

  // Derived State
  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id))
  const unreadCount = visibleNotifications.filter((n) => !seenIds.includes(n.id)).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleOpen}
        data-tutorial="notification-bell"
        className={`btn-classic flex items-center justify-center w-10 h-10 p-0 rounded-full relative active:bg-gray-300 ${isOpen ? 'bg-gray-300' : ''}`}
        title="Notifications"
      >
        <Bell
          className={`w-6 h-6 ${unreadCount > 0 ? 'fill-red-500 text-red-600' : 'text-gray-600'}`}
        />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-80 lg:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-[100] origin-top-right font-sans overflow-hidden text-sm flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-slate-50 text-slate-800 px-5 py-4 font-bold flex justify-between items-center border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <span>NOTIFICATIONS</span>
              </div>
              <div className="flex items-center gap-3">
                {visibleNotifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-slate-400 hover:text-blue-600 font-semibold transition-colors"
                    title="Clear All"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-full shadow-sm border border-slate-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 bg-white relative">
              {loading && visibleNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Checking...
                </div>
              ) : visibleNotifications.length > 0 ? (
                <div className="flex flex-col">
                  <AnimatePresence mode="popLayout">
                    {visibleNotifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-slate-50 cursor-pointer group transition-all relative overflow-hidden ${
                          seenIds.includes(notif.id)
                            ? 'bg-white hover:bg-slate-50/80'
                            : 'bg-blue-50/40 hover:bg-blue-50'
                        }`}
                      >
                        {!seenIds.includes(notif.id) && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                        )}
                        
                        {/* Dismiss Button */}
                        <button
                          onClick={(e) => handleDismiss(e, notif.id)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 z-10"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start gap-4 pr-6">
                          <div
                            className={`p-2.5 rounded-xl shadow-sm border ${
                              notif.type === 'dm'
                                ? 'bg-blue-50 border-blue-100 text-blue-600'
                                : notif.type === 'support'
                                  ? 'bg-red-50 border-red-100 text-red-600'
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}
                          >
                            {notif.type === 'dm' ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : notif.type === 'support' ? (
                              <LifeBuoy className="w-4 h-4" />
                            ) : (
                              <Users className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <span
                                className={`font-bold truncate pr-3 ${seenIds.includes(notif.id) ? 'text-slate-600' : 'text-slate-800'}`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap pt-0.5">
                                {notif.time}
                              </span>
                            </div>
                            <p
                              className={`text-xs ${seenIds.includes(notif.id) ? 'text-slate-500' : 'text-slate-600'} line-clamp-2 leading-relaxed`}
                            >
                              {notif.message}
                            </p>

                            {notif.type === 'request' && (
                              <button
                                onClick={(e) => handleAcceptRequest(e, notif)}
                                className="mt-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold w-full transition-colors shadow-sm flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> ACCEPT REQUEST
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <span className="text-slate-400 font-medium">You&apos;re all caught up!</span>
                  <span className="text-slate-400 text-xs">No new notifications.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-2.5 border-t border-slate-100 text-center flex justify-between px-5 items-center shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Live Updates</span>
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{visibleNotifications.length} items</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
