import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, MessageSquare, LifeBuoy, X, Users } from 'lucide-react'
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
            className="absolute right-0 top-full mt-2 w-80 bg-[#f0f0f0] border-2 border-white shadow-[2px_2px_0px_rgba(0,0,0,0.2)] z-[100] origin-top-right font-tahoma text-xs"
          >
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-3 py-2 font-bold flex justify-between items-center border-b border-blue-900">
              <span>NOTIFICATIONS</span>
              <div className="flex items-center gap-2">
                {visibleNotifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-blue-200 hover:text-white underline mr-2"
                    title="Clear All"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="hover:text-red-300">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto inset-shadow bg-white">
              {loading && visibleNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 italic">Checking...</div>
              ) : visibleNotifications.length > 0 ? (
                <div>
                  <AnimatePresence mode="popLayout">
                    {visibleNotifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 border-b border-gray-100 cursor-pointer group transition-colors relative ${seenIds.includes(notif.id)
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                      >
                        {/* Dismiss Button */}
                        <button
                          onClick={(e) => handleDismiss(e, notif.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <div className="flex items-start gap-3 pr-4">
                          <div
                            className={`mt-0.5 p-1.5 rounded-full ${notif.type === 'dm'
                              ? 'bg-blue-100 text-blue-600'
                              : notif.type === 'support'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                              }`}
                          >
                            {notif.type === 'dm' ? (
                              <MessageSquare className="w-3 h-3" />
                            ) : notif.type === 'support' ? (
                              <LifeBuoy className="w-3 h-3" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                              <span
                                className={`font-bold ${seenIds.includes(notif.id) ? 'text-gray-600' : 'text-gray-900'}`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                                {notif.time}
                              </span>
                            </div>
                            <p
                              className={`${seenIds.includes(notif.id) ? 'text-gray-500' : 'text-gray-700'} line-clamp-2 leading-tight`}
                            >
                              {notif.message}
                            </p>

                            {notif.type === 'request' && (
                              <button
                                onClick={(e) => handleAcceptRequest(e, notif)}
                                className="mt-2 text-[10px] bg-green-600 text-white px-2 py-1 rounded font-bold hover:bg-green-700 w-full shadow-sm"
                              >
                                ACCEPT REQUEST
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Bell className="w-6 h-6 opacity-20" />
                  <span>No new notifications</span>
                </div>
              )}
            </div>

            <div className="bg-[#e0e0e0] p-1 border-t border-white text-center flex justify-between px-2 items-center">
              <span className="text-[9px] text-gray-500">Auto-refreshing</span>
              <span className="text-[9px] text-gray-400">{visibleNotifications.length} items</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
