import { useState, useEffect } from 'react'
import { DataService, PilotProfile, FlightLogEntry } from '../services/dataService'

export const Career = () => {
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [logbook, setLogbook] = useState<FlightLogEntry[]>([])

  useEffect(() => {
    DataService.getProfile().then(setProfile)
    DataService.getFlightLog().then(setLogbook)
  }, [])

  if (!profile) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center font-tahoma bg-[#f0f0f0]">
        <div className="text-[#333] font-bold mb-2">PILOT PROFILE NOT FOUND</div>
        <div className="text-xs text-gray-600 mb-4">
          Data may have been reset. Please re-register or login.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0] overflow-y-auto">
      <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter mb-2 px-1">
        Pilot Personnel File
      </h1>

      {/* Top Section: Profile Card */}
      <div className="legacy-panel mb-4 flex gap-4 bg-[#fcfcfc]" data-tutorial="career-profile">
        {/* Photo Placeholder */}
        <div className="w-32 h-32 border border-gray-400 bg-gray-200 flex items-center justify-center shadow-inner overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Pilot" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-500 text-center">
              NO PHOTO
              <br />
              AVAILABLE
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-1 content-start">
          <div className="flex border-b border-gray-300 pb-1 items-end">
            <span className="w-24 text-[10px] font-bold text-gray-500 uppercase">Callsign</span>
            <span className="flex-1 font-bold text-[#333]">{profile.callsign}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1 items-end">
            <span className="w-24 text-[10px] font-bold text-gray-500 uppercase">Rank</span>
            <span className="flex-1 font-bold text-blue-800">{profile.rank}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1 items-end">
            <span className="w-24 text-[10px] font-bold text-gray-500 uppercase">Location</span>
            <span className="flex-1 font-bold text-[#333]">{profile.currentLocation}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1 items-end">
            <span className="w-24 text-[10px] font-bold text-gray-500 uppercase">Home Base</span>
            <span className="flex-1 font-bold text-[#333]">{profile.homeBase}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1 items-end">
            <span className="w-24 text-[10px] font-bold text-gray-500 uppercase">Hours</span>
            <span className="flex-1 font-bold text-[#333]">{profile.flightHours.toFixed(1)}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1 items-end">
            <span className="w-24 text-[10px] font-bold text-gray-500 uppercase">Balance</span>
            <span className="flex-1 font-bold text-green-700">
              € {profile.balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Logbook Section */}
      <div className="legacy-panel flex-1 flex flex-col min-h-0">
        <div className="bg-[#cecece] px-2 py-1 text-xs font-bold text-[#333] border-b border-white mb-2 shadow-sm">
          FLIGHT LOGBOOK
        </div>
        <div className="flex-1 inset-box overflow-y-auto bg-white">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-[#e1e1e1] sticky top-0">
              <tr>
                <th className="p-1 border border-gray-300">CALLSIGN</th>
                <th className="p-1 border border-gray-300">DEP</th>
                <th className="p-1 border border-gray-300">ARR</th>
                <th className="p-1 border border-gray-300">DATE</th>
                <th className="p-1 border border-gray-300">AIRCRAFT</th>
                <th className="p-1 border border-gray-300 text-right">SCORE</th>
                <th className="p-1 border border-gray-300 text-right">INCOME</th>
              </tr>
            </thead>
            <tbody>
              {logbook.map((flight) => (
                <tr key={flight.id} className="hover:bg-blue-50">
                  <td className="p-1 border border-gray-200 font-bold">{flight.flightNumber}</td>
                  <td className="p-1 border border-gray-200">{flight.departure}</td>
                  <td className="p-1 border border-gray-200">{flight.arrival}</td>
                  <td className="p-1 border border-gray-200 text-gray-600">{flight.date}</td>
                  <td className="p-1 border border-gray-200">{flight.aircraft}</td>
                  <td className="p-1 border border-gray-200 text-right font-bold text-green-700">
                    {flight.score}%
                  </td>
                  <td className="p-1 border border-gray-200 text-right font-mono">
                    €{flight.earnings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
