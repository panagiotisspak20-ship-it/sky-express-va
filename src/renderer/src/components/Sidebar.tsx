import { DataService } from '../services/dataService'
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { sidebarItem } from '../utils/animations'
import { WhoIsOnline } from './WhoIsOnline'
import {
  LayoutDashboard, Plane, ClipboardList, Globe, History, Medal, Compass,
  Users, ShoppingBag, PlaneTakeoff, Map, FileText, LifeBuoy, Settings, ShieldCheck, LogOut
} from 'lucide-react'

import logo from '../assets/logo.png'

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', iconColor: 'text-blue-500' },
  { name: 'Schedule', icon: Plane, path: '/flights', iconColor: 'text-emerald-500' },
  { name: 'My Flights', icon: ClipboardList, path: '/booked-flights', iconColor: 'text-amber-500' },
  { name: 'Free Roam', icon: Globe, path: '/free-roam', iconColor: 'text-cyan-500' },
  { name: 'History', icon: History, path: '/flight-history', iconColor: 'text-indigo-500' },
  { name: 'Career', icon: Medal, path: '/career', iconColor: 'text-yellow-500' },
  { name: 'Tours', icon: Compass, path: '/tours', iconColor: 'text-rose-500' },
  { name: 'Community', icon: Users, path: '/social', iconColor: 'text-violet-500' },
  { name: 'Sky Store', icon: ShoppingBag, path: '/shop', iconColor: 'text-fuchsia-500' },
  { name: 'Fleet', icon: PlaneTakeoff, path: '/fleet', iconColor: 'text-teal-500' },
  { name: 'Live Map', icon: Map, path: '/map', iconColor: 'text-lime-500' },
  { name: 'PIREP', icon: FileText, path: '/pireps', iconColor: 'text-sky-400' },
  { name: 'Support', icon: LifeBuoy, path: '/support', iconColor: 'text-orange-500' },
  { name: 'Settings', icon: Settings, path: '/settings', iconColor: 'text-slate-400' }
]

interface SidebarProps {
  onLogout: () => void
  activePage?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()

  useEffect(() => {
    DataService.getProfile()
      .then((profile) => {
        if (profile?.isAdmin) setIsAdmin(true)
      })
      .catch(console.error)
  }, [])

  const finalNavItems = isAdmin
    ? [...navItems, { name: 'Admin', icon: ShieldCheck, path: '/admin', iconColor: 'text-red-500' }]
    : navItems

  return (
    <aside className="w-[240px] h-full bg-white flex flex-col border-r border-slate-200/60 z-10 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-50/50 to-transparent pointer-events-none -z-10" />

      {/* Logo Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center pt-8 pb-8 relative"
      >
        <img src={logo} alt="Sky Express" className="w-28 h-auto drop-shadow-md mb-3" />
        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          Virtual Airline
        </span>
      </motion.div>

      {/* Navigation Stack */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1.5 pt-2 px-4 pb-4 custom-scrollbar relative">
        {finalNavItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <motion.div key={item.path} variants={sidebarItem} custom={index} className="relative group">
              <NavLink
                to={item.path}
                data-tutorial={`sidebar - link - ${item.name.toLowerCase().replace(' ', '-')} `}
                className={clsx(
                  'flex items-center gap-3.5 py-3 px-4 transition-all duration-300 text-left rounded-2xl outline-none relative z-10',
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-500 hover:text-sky-600'
                )}
              >
                {/* Active Indicator Background */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      className="absolute inset-0 bg-gradient-to-r from-sky-500 to-sky-400 rounded-2xl shadow-md shadow-sky-500/30 -z-10"
                    />
                  )}
                </AnimatePresence>
                
                {/* Hover Background (non-active only) */}
                {!isActive && (
                  <div className="absolute inset-0 bg-sky-50/0 rounded-2xl group-hover:bg-sky-50/80 transition-colors duration-300 -z-10" />
                )}

                <div
                  className={clsx(
                    'flex items-center justify-center transition-transform duration-300',
                    isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'
                  )}
                >
                  <Icon
                    strokeWidth={isActive ? 2.5 : 2}
                    className={clsx(
                      'w-[18px] h-[18px] transition-colors duration-300',
                      isActive ? 'text-white' : item.iconColor || 'text-slate-400'
                    )}
                  />
                </div>
                
                <span className="text-[13.5px] tracking-wide relative z-10 truncate">
                  {item.name}
                </span>

                {/* Subtle right-side glowing dot when active */}
                {isActive && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full opacity-60 drop-shadow-sm"
                  />
                )}
              </NavLink>
            </motion.div>
          )
        })}
        
        <div className="mt-2 mb-2 px-2">
          <WhoIsOnline />
        </div>
      </nav>

      <div className="mt-auto flex flex-col bg-slate-50/50">
        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="px-6 py-4"
        >
          <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
            We are <span className="font-bold text-slate-500">NOT</span> affiliated with, endorsed by, or connected
            to the real-world Sky Express airline. All content is virtual.
          </p>
        </motion.div>

        {/* Logout Button */}
        <div className="p-4 pt-1 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-[13px] shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
          >
            <LogOut className="w-[18px] h-[18px] text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
