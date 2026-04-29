import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { History, LayoutList, Trophy, TrendingUp, AlertTriangle, Trash2, Calendar, Plane, MapPin, X } from 'lucide-react'
import { DataService } from '../services/dataService'
import { supabase } from '../services/supabase'
import { SkyLoader } from '../components/ui/SkyLoader'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'

export const PirepLog = () => {
  const navigate = useNavigate()
  const [pireps, setPireps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPirepForDelete, setSelectedPirepForDelete] = useState<any>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPireps = useCallback(async () => {
    setLoading(true)
    try {
      const user = await DataService.getProfile()
      if (user) {
        const myPireps = await DataService.getPireps(user.id)
        setPireps(myPireps || [])
      }
    } catch (err) {
      console.error('Failed to load PIREPs:', err)
      toast.error('Failed to load flight history.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRequestDeletion = async () => {
    if (!selectedPirepForDelete || !deleteReason.trim()) return
    setIsDeleting(true)
    try {
      await DataService.requestFlightDeletion(selectedPirepForDelete.id, deleteReason)
      setShowDeleteModal(false)
      setDeleteReason('')
      toast.success('✅ Deletion request submitted. An admin will review it.')
      await loadPireps()
    } catch (error: any) {
      console.error('Failed to request deletion:', error)
      toast.error('Failed to submit deletion request.')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    loadPireps()
  }, [loadPireps])

  // Realtime: auto-refresh when completed_flights changes
  useEffect(() => {
    const channel = supabase
      .channel('pirep_flight_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completed_flights' }, () => {
        console.log('✈️ Flight change detected, refreshing PIREPs...')
        loadPireps()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPireps])

  const getGradeStyle = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-emerald-500/20'
    if (grade === 'B') return 'text-blue-700 bg-blue-50 border-blue-200 shadow-blue-500/20'
    if (grade === 'C') return 'text-amber-700 bg-amber-50 border-amber-200 shadow-amber-500/20'
    return 'text-rose-700 bg-rose-50 border-rose-200 shadow-rose-500/20'
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 xl:p-8 h-full flex flex-col gap-6 font-sans bg-slate-50/50 overflow-hidden"
    >
      {/* Header */}
      <motion.div
        variants={slideDown}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <LayoutList className="w-6 h-6" />
            </div>
            Pilot Reports
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium ml-1">
            Review your completed flights, grades, and performance history.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <History className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total Logs</span>
               <span className="text-sm font-black text-slate-800 leading-none mt-1">{pireps.length}</span>
            </div>
          </div>
          <button 
            onClick={loadPireps} 
            className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-800/20 hover:bg-slate-700 transition-colors"
          >
            Refresh Logs
          </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <SkyLoader text="Loading your flight history..." />
          </div>
        ) : pireps.length === 0 ? (
          <motion.div 
            key="empty-state"
            variants={fadeInUp} 
            initial="hidden" 
            animate="visible" 
            className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed m-1 py-12"
          >
            <History className="w-16 h-16 mb-4 text-slate-300" />
            <h3 className="text-xl font-black text-slate-700 mb-1">No PIREPs Found</h3>
            <p className="font-medium text-slate-500">You haven't completed any flights yet.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4 pb-8"
            data-tutorial="pirep-list"
          >
            {pireps.map((p) => (
              <motion.div
                variants={fadeInUp}
                key={p.id}
                onClick={() => navigate(`/pirep/${p.id}`)}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left Side: Grade & Main Info */}
                <div className="flex items-center gap-5">
                  {/* Grade Badge */}
                  <div
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-2xl border-2 shadow-sm ${getGradeStyle(p.grade || 'A')}`}
                  >
                    {p.grade || 'A'}
                  </div>

                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-black text-xl text-slate-800 tracking-tight leading-none">{p.flight_number}</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-slate-700">{p.departure_icao}</span>
                        <span className="text-slate-300">➝</span>
                        <span className="font-bold text-slate-700">{p.arrival_icao}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <div className="flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-slate-400" />
                        <span>{p.aircraft_type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Stats & Actions */}
                <div className="flex items-center gap-6 lg:gap-8 bg-slate-50 p-3 lg:bg-transparent lg:p-0 rounded-xl">
                  {/* Landing Rate */}
                  <div className="flex flex-col lg:items-end">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" /> Landing Rate
                    </span>
                    <span
                      className={`font-mono font-bold text-lg leading-none ${Math.abs(p.landing_rate) < 200 ? 'text-emerald-600' : Math.abs(p.landing_rate) > 500 ? 'text-rose-600' : 'text-amber-600'}`}
                    >
                      {p.landing_rate} <span className="text-xs text-slate-500 font-sans font-bold">fpm</span>
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col lg:items-end w-16">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <Trophy className="w-3 h-3 text-amber-500" /> Score
                    </span>
                    <span className="text-xl font-black text-indigo-600 leading-none">{p.score}</span>
                  </div>

                  <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    {/* Warning Icon if penalties */}
                    {p.flight_events?.length > 0 && (
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-200" title="Penalties applied">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}

                    {/* Request Deletion */}
                    {p.delete_requested ? (
                      <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center transition-all shadow-sm" title={`Deletion Requested: ${p.delete_reason || 'Pending Admin Approval'}`}>
                        <Trash2 className="w-4 h-4 opacity-50" />
                      </div>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          setSelectedPirepForDelete(p)
                          setDeleteReason('')
                          setShowDeleteModal(true)
                        }}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        title="Request Flight Deletion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Deletion Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedPirepForDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-sky-navy/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="bg-rose-600 text-white p-5 flex justify-between items-center shrink-0">
                <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm">
                  <Trash2 className="w-5 h-5" /> Request Deletion
                </h3>
                <button onClick={() => setShowDeleteModal(false)} className="hover:text-rose-200 transition-colors bg-rose-700 p-1.5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  You are requesting to permanently delete flight{' '}
                  <strong className="text-sky-navy font-black">{selectedPirepForDelete.flight_number}</strong> (
                  {selectedPirepForDelete.departure_icao} ➔ {selectedPirepForDelete.arrival_icao}).
                </p>
                <div className="bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 rounded-2xl flex gap-3 shadow-inner">
                  <span className="text-xl">⚠️</span>
                  <p>
                    <strong>Note:</strong> Deletions must be verified by an Administrator. If
                    approved, hours and balance earned from this flight will be reversed off your profile.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black tracking-widest text-slate-500 mb-2 uppercase">
                    Provide a reason for deletion:
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Simulator crashed mid-flight, imported wrong plan..."
                    className="w-full text-sm font-medium border border-slate-200 bg-slate-50 rounded-2xl p-4 h-28 focus:outline-none focus:ring-4 focus:ring-sky-cyan/20 focus:border-sky-cyan resize-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 flex justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3.5 text-xs font-black tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all uppercase border border-slate-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestDeletion}
                  disabled={!deleteReason.trim() || isDeleting}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black tracking-widest rounded-xl text-xs shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-2 uppercase"
                >
                  {isDeleting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
