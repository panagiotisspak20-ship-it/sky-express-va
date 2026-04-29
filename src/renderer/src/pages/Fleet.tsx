import { useState, useEffect } from 'react'
import { DataService, Aircraft } from '../services/dataService'
import toast from 'react-hot-toast'
import { toastConfirm } from '../utils/toastConfirm'
import { SkyLoader } from '../components/ui/SkyLoader'
import { MapContainer, TileLayer } from 'react-leaflet'
import {
  Plus,
  Plane,
  Map as MapIcon,
  List,
  Wrench,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown, popIn } from '../utils/animations'

// Fix Leaflet Icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

export const Fleet = () => {
  const [fleet, setFleet] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  // Form State
  const [newAircraft, setNewAircraft] = useState({
    registration: '',
    type: 'A20N',
    hub: 'LGAV',
    current_location: 'LGAV',
    status: 'Available' as const
  })

  const loadFleet = async (): Promise<void> => {
    setLoading(true)
    const data = await DataService.getFleet()
    setFleet(data)
    setLoading(false)
  }

  const checkAdmin = async (): Promise<void> => {
    const profile = await DataService.getProfile()
    if (profile?.isAdmin) setIsAdmin(true)
  }

  useEffect(() => {
    loadFleet()
    checkAdmin()
  }, [])

  const handleAddAircraft = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await DataService.addAircraft({
        ...newAircraft,
        status: newAircraft.status as 'Available' | 'In Flight' | 'Maintenance'
      })
      setShowAddModal(false)
      loadFleet()
      // Reset form
      setNewAircraft({
        registration: '',
        type: 'A20N',
        hub: 'LGAV',
        current_location: 'LGAV',
        status: 'Available'
      })
    } catch (err) {
      console.error('Error adding aircraft:', err)
    }
  }

  const handleStatusChange = async (
    ac: Aircraft,
    newStatus: 'Available' | 'Maintenance'
  ): Promise<void> => {
    try {
      await DataService.updateAircraft(ac.id, { status: newStatus })
      toast.success(`${ac.registration} set to ${newStatus}`)
      setActionMenuId(null)
      loadFleet()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDeleteAircraft = async (ac: Aircraft): Promise<void> => {
    setActionMenuId(null)
    if (await toastConfirm(`Delete ${ac.registration} from the fleet permanently?`)) {
      try {
        await DataService.deleteAircraft(ac.id)
        toast.success(`${ac.registration} removed from fleet`)
        loadFleet()
      } catch (err) {
        console.error('Failed to delete aircraft:', err)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'In Flight':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200'
    }
  }

  if (loading)
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/50">
        <SkyLoader text="Loading Fleet..." />
      </div>
    )

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
        data-tutorial="fleet-header"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Plane className="w-6 h-6" />
            </div>
            Fleet Management
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium ml-1 flex items-center gap-2">
            Total Aircraft: {fleet.length} <span className="text-slate-300">•</span> Serviceability:{' '}
            {fleet.length > 0 ? Math.round(
              (fleet.filter((a) => a.status !== 'Maintenance').length / fleet.length) * 100
            ) : 0}%
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex items-center">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('map')}
              className={`p-2 rounded-lg transition-all ${view === 'map' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
              title="Map View"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> ADD AIRCRAFT
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        variants={fadeInUp}
        className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0"
      >
        {view === 'list' ? (
          <div className="overflow-y-auto flex-1 no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10 text-[11px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="px-6 py-4 border-none">Registration</th>
                  <th className="px-6 py-4 border-none">Type</th>
                  <th className="px-6 py-4 border-none">Hub</th>
                  <th className="px-6 py-4 border-none">Location</th>
                  <th className="px-6 py-4 border-none">Hours</th>
                  <th className="px-6 py-4 border-none">Condition</th>
                  <th className="px-6 py-4 border-none">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right border-none">Actions</th>}
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="text-sm divide-y divide-slate-100"
              >
                {fleet.length > 0 ? (
                  fleet.map((ac) => (
                    <motion.tr variants={fadeInUp} key={ac.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-extrabold text-blue-700 border-none">{ac.registration}</td>
                      <td className="px-6 py-4 text-slate-800 font-bold border-none">{ac.type}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 font-medium border-none">{ac.hub}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 border-none">{ac.current_location}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium border-none">{ac.total_hours.toFixed(1)}</td>
                      <td className="px-6 py-4 border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                            <div
                              className={`h-full transition-all ${ac.condition > 80 ? 'bg-emerald-500' : ac.condition > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${ac.condition}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500">{ac.condition}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-none">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-sm ${getStatusColor(ac.status)}`}
                        >
                          {ac.status.toUpperCase()}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right relative border-none">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === ac.id ? null : ac.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:bg-slate-100"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          {actionMenuId === ac.id && (
                            <div className="absolute right-12 top-10 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-48 text-xs font-bold p-1 overflow-hidden" onMouseLeave={() => setActionMenuId(null)}>
                              {ac.status !== 'Available' && (
                                <button
                                  onClick={() => handleStatusChange(ac, 'Available')}
                                  className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg flex items-center gap-3 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Set Available
                                </button>
                              )}
                              {ac.status !== 'Maintenance' && (
                                <button
                                  onClick={() => handleStatusChange(ac, 'Maintenance')}
                                  className="w-full text-left px-3 py-2.5 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg flex items-center gap-3 transition-colors"
                                >
                                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Set Maintenance
                                </button>
                              )}
                              <div className="h-px bg-slate-100 my-1 mx-2" />
                              <button
                                onClick={() => handleDeleteAircraft(ac)}
                                className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" /> Delete Aircraft
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center border-none">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-inner border border-slate-100">
                          <Plane className="w-8 h-8 text-slate-300" />
                        </div>
                        <span className="text-slate-500 font-bold text-sm">No aircraft in fleet.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 w-full z-0 relative">
            <MapContainer
              center={[38, 24]} // Greece center roughly
              zoom={5}
              className="h-full w-full z-0"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              {/* Placeholder for fleet markers - requires airport DB for coordinates */}
              <div className="absolute bottom-6 left-6 z-[999] bg-white/90 backdrop-blur-md px-5 py-4 text-xs font-medium text-slate-600 rounded-2xl shadow-xl border border-slate-200 max-w-sm">
                <p className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><MapIcon className="w-4 h-4 text-blue-600"/> Map Visualization</p>
                Map visualization currently requires Airport Database integration for coordinate mapping.<br/><br/>
                Switch back to List view to manage the fleet.
              </div>
            </MapContainer>
          </div>
        )}
      </motion.div>

      {/* Add Aircraft Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          >
            <motion.div
              variants={popIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="bg-slate-50 text-slate-800 border-b border-slate-200 px-6 py-4 font-black flex justify-between items-center text-xs uppercase tracking-widest">
                <span className="flex items-center gap-2"><Plane className="w-4 h-4 text-blue-600"/> Add New Aircraft</span>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddAircraft} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Registration</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl font-mono font-bold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    placeholder="SX-..."
                    value={newAircraft.registration}
                    onChange={(e) =>
                      setNewAircraft({ ...newAircraft, registration: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Aircraft Type</label>
                    <select
                      className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={newAircraft.type}
                      onChange={(e) => setNewAircraft({ ...newAircraft, type: e.target.value })}
                    >
                      <option value="A20N">A20N</option>
                      <option value="A320">A320</option>
                      <option value="AT46">AT46</option>
                      <option value="AT76">AT76</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Base Hub</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl font-mono font-bold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                      value={newAircraft.hub}
                      onChange={(e) => setNewAircraft({ ...newAircraft, hub: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3.5 px-6 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all w-full"
                  >
                    <Plus className="w-4 h-4" /> ADD AIRCRAFT TO FLEET
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
