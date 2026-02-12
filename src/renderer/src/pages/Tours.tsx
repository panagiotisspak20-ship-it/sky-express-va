import React, { useEffect, useState } from 'react'
import { DataService, Tour, PilotTour } from '../services/dataService'
import { Trophy, Plane, ArrowRight, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

export const Tours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([])
  const [pilotTours, setPilotTours] = useState<PilotTour[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const [allTours, myTours] = await Promise.all([
        DataService.getTours(),
        DataService.getPilotTours()
      ])
      setTours(allTours)
      setPilotTours(myTours)
    } catch (err) {
      console.error('Failed to load tours', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleJoinTour = async (tourId: string) => {
    try {
      await DataService.joinTour(tourId)
      await fetchData() // Refresh to show progress
    } catch {
      alert('Failed to join tour. You may already be in it.')
    }
  }

  const getPilotProgress = (tourId: string) => {
    return pilotTours.find((pt) => pt.tour_id === tourId)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading Tours...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Tours & Expeditions
          </h1>
          <p className="text-slate-500 mt-1">
            Complete sequential flights to earn exclusive badges and rewards.
          </p>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {tours.map((tour) => {
            const progress = getPilotProgress(tour.id)
            const isJoined = !!progress
            const isCompleted = progress?.status === 'completed'
            const currentLegIndex = progress ? progress.current_leg_order - 1 : 0
            const totalLegs = tour.legs?.length || 0
            const progressPercent =
              totalLegs > 0 ? (Math.min(currentLegIndex, totalLegs) / totalLegs) * 100 : 0

            // Adjust percentage for completed
            const displayPercent = isCompleted ? 100 : progressPercent

            return (
              <div
                key={tour.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      {/* Badge Preview */}
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 flex-shrink-0">
                        {tour.badge_image_url && !imageError[tour.id] ? (
                          <img
                            src={tour.badge_image_url}
                            alt="Badge"
                            className="w-16 h-16 object-contain drop-shadow-sm"
                            onError={() => setImageError((prev) => ({ ...prev, [tour.id]: true }))}
                          />
                        ) : (
                          <Trophy className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">{tour.title}</h2>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {tour.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium border border-blue-100">
                            {totalLegs} Legs
                          </span>
                          {isCompleted && (
                            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-medium border border-green-100 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (if joined) */}
                  {isJoined && (
                    <div className="mt-4 mb-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                        <span>Progress</span>
                        <span>
                          {isCompleted
                            ? 'All Legs Flown'
                            : `Leg ${progress.current_leg_order} of ${totalLegs}`}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full transition-all duration-500',
                            isCompleted ? 'bg-green-500' : 'bg-blue-600'
                          )}
                          style={{ width: `${displayPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Legs List (Expandable) */}
                <div className="border-t border-gray-100 bg-slate-50/50">
                  <button
                    onClick={() => setExpandedTourId(expandedTourId === tour.id ? null : tour.id)}
                    className="w-full px-6 py-3 text-sm text-slate-600 font-medium hover:bg-slate-100 flex justify-between items-center"
                  >
                    <span>View Route Details</span>
                    <span className="text-xs text-slate-400">
                      {expandedTourId === tour.id ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {expandedTourId === tour.id && (
                    <div className="px-6 pb-6 pt-2 space-y-3">
                      {tour.legs?.map((leg) => {
                        const isFlown =
                          isJoined &&
                          (progress.current_leg_order > leg.sequence_order || isCompleted)
                        const isCurrent =
                          isJoined &&
                          !isCompleted &&
                          progress.current_leg_order === leg.sequence_order

                        return (
                          <div
                            key={leg.id}
                            className={clsx(
                              'flex items-center justify-between p-3 rounded border text-sm',
                              isFlown
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : isCurrent
                                  ? 'bg-blue-50 border-blue-200 text-blue-800 ring-1 ring-blue-200'
                                  : 'bg-white border-gray-200 text-slate-600'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={clsx(
                                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                  isFlown
                                    ? 'bg-green-200 text-green-700'
                                    : isCurrent
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-200 text-slate-500'
                                )}
                              >
                                {leg.sequence_order}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1 font-bold">
                                  <span>{leg.departure_icao}</span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                  <span>{leg.arrival_icao}</span>
                                </div>
                                {leg.leg_name && (
                                  <span className="text-xs opacity-75">{leg.leg_name}</span>
                                )}
                              </div>
                            </div>

                            {isFlown && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                            {isCurrent && <Plane className="w-4 h-4 text-blue-600 animate-pulse" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  {!isJoined ? (
                    <button
                      onClick={() => handleJoinTour(tour.id)}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Start Tour
                    </button>
                  ) : isCompleted ? (
                    <span className="text-sm font-bold text-green-600 flex items-center gap-1 px-3 py-2">
                      Badge Earned
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium px-2">
                        Fly Leg {progress.current_leg_order} to advance
                      </span>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm opacity-50 cursor-not-allowed"
                        disabled
                        title="Go to 'Booked Flights' or 'Free Roam' and fly the route!"
                      >
                        In Progress
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
