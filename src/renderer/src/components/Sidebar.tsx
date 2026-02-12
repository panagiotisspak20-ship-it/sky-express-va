import { DataService } from '../services/dataService'
import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

import { WhoIsOnline } from './WhoIsOnline'

// Retro-style emoji icons for that Windows XP feel
const navItems = [
  { name: 'Dashboard', icon: '🏠', path: '/' },
  { name: 'Schedule', icon: '✈️', path: '/flights' },
  { name: 'My Flights', icon: '📋', path: '/booked-flights' },
  { name: 'Free Roam', icon: '🌍', path: '/free-roam' },
  { name: 'History', icon: '📜', path: '/flight-history' },
  { name: 'Career', icon: '🎖️', path: '/career' },
  { name: 'Tours', icon: '🧭', path: '/tours' },
  { name: 'Community', icon: '👥', path: '/social' },
  { name: 'Sky Store', icon: '🛍️', path: '/shop' },
  { name: 'Live Map', icon: '🗺️', path: '/map' },
  { name: 'PIREP', icon: '📝', path: '/pireps' },
  { name: 'Support', icon: '❓', path: '/support' },
  { name: 'Settings', icon: '⚙️', path: '/settings' }
]

interface SidebarProps {
  onLogout: () => void
  activePage?: string
}

import logo from '../assets/logo.png'

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    DataService.getProfile().then((profile) => {
      if (profile?.isAdmin) setIsAdmin(true)
    })
  }, [])

  const finalNavItems = isAdmin
    ? [...navItems, { name: 'Admin', icon: '🛡️', path: '/admin' }]
    : navItems

  return (
    <aside className="w-52 h-full bg-white flex flex-col border-r-2 border-[#d63384] text-[#333] shadow-lg">
      {/* Logo Area - White background for visibility */}
      <div className="flex flex-col items-center justify-center py-5 bg-white border-b-2 border-[#d63384]">
        <img src={logo} alt="Sky Express" className="w-24 h-auto drop-shadow-md mb-2" />
        <span className="text-sm font-bold text-[#1a365d] tracking-tight uppercase">
          Virtual Airline
        </span>
      </div>

      {/* Navigation Stack */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1 bg-gradient-to-b from-slate-50 to-white pt-3 px-2">
        {finalNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-tutorial={`sidebar - link - ${item.name.toLowerCase().replace(' ', '-')} `}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 py-2.5 px-3 transition-all text-left rounded',
                isActive
                  ? 'bg-gradient-to-r from-[#1a365d] to-[#2c5282] text-white shadow-md'
                  : 'hover:bg-pink-50 hover:border-l-2 hover:border-[#d63384]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Retro icon container */}
                <div
                  className={clsx(
                    'w-8 h-8 flex items-center justify-center flex-shrink-0 rounded text-lg',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-gradient-to-b from-white to-gray-100 border border-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.1)]'
                  )}
                >
                  <span style={{ filter: isActive ? 'brightness(1.5)' : 'none' }}>{item.icon}</span>
                </div>
                <span
                  className={clsx(
                    'text-sm font-semibold',
                    isActive ? 'text-white' : 'text-gray-700'
                  )}
                >
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <WhoIsOnline />

      {/* Disclaimer */}
      <div className="px-2 py-2 bg-pink-50 border-t border-pink-200">
        <p className="text-[8px] text-gray-500 text-center leading-tight">
          We are <span className="font-bold">NOT</span> affiliated with, endorsed by, or connected
          to the real-world Sky Express airline. All content is for virtual aviation use only.
        </p>
      </div>

      {/* Logout Button */}
      <div className="p-2 bg-gradient-to-r from-[#1a365d] to-[#2c5282] border-t border-[#1a365d]">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/90 border border-[#1a365d] rounded hover:bg-white active:bg-gray-100 shadow-sm transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm font-bold text-[#1a365d]">LOG OUT</span>
        </button>
      </div>
    </aside>
  )
}
