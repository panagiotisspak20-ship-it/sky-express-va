import { useState, useEffect } from 'react'

import { motion } from 'framer-motion'
import { DataService, ShopItem, InventoryItem, PilotProfile } from '../services/dataService'
import {
  ShoppingBag,
  CreditCard,
  Check,
  AlertCircle,
  Sparkles,
  UserPlus,
  RefreshCw
} from 'lucide-react'
import { SkyLoader } from '../components/ui/SkyLoader'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'
import { toastConfirm } from '../utils/toastConfirm'

export const PilotShop = () => {
  const [items, setItems] = useState<ShopItem[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null) // Item ID being bought
  const [filter, setFilter] = useState<'background' | 'frame' | 'color'>('background')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Preview State
  const [previewBackground, setPreviewBackground] = useState<string | null>(null)
  const [previewFrame, setPreviewFrame] = useState<string | null>(null)
  const [previewColor, setPreviewColor] = useState<string | null>(null)

  const [profile, setProfile] = useState<PilotProfile | null>(null)

  useEffect(() => {
    loadShopData()
  }, [])

  useEffect(() => {
    if (profile) {
      setPreviewBackground(profile.equipped_background || null)
      setPreviewFrame(profile.equipped_frame || null)
      setPreviewColor(profile.equipped_color || null)
    }
  }, [profile])

  const loadShopData = async () => {
    setLoading(true)
    try {
      const shopItems = await DataService.getShopItems()
      const inv = await DataService.getInventory()
      const p = await DataService.getProfile()

      setItems(shopItems)
      setInventory(inv)
      setProfile(p)

      if (p) {
        setBalance(p.balance || 0)
        setIsAdmin(!!p.isAdmin)
      }

      // DataService returns [] on error instead of throwing
    } catch (err) {
      console.error('Failed to load shop data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (item: ShopItem) => {
    setBuying(item.id)
    setMessage(null)

    // Optimistic check
    if (!isAdmin && balance < item.price) {
      setMessage({ type: 'error', text: 'Insufficient funds!' })
      setBuying(null)
      return
    }

    try {
      const result = await DataService.buyItem(item)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        // Refresh data to update balance and inventory
        await loadShopData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Transaction failed.' })
    } finally {
      setBuying(null)
    }
  }
  const [equipping, setEquipping] = useState(false)

  const handleEquip = async (invItem: InventoryItem, type: string) => {
    if (equipping) return
    setEquipping(true)
    try {
      await DataService.equipItem(invItem, type)
      setMessage({ type: 'success', text: 'Item equipped! Check your profile/settings.' })

      const p = await DataService.getProfile()
      setProfile(p)
    } finally {
      setEquipping(false)
    }
  }

  const handleReset = async () => {
    if (!(await toastConfirm('Are you sure you want to reset all customizations to stock?'))) return

    setLoading(true)
    await DataService.unequipAll()

    // Refresh local state
    const p = await DataService.getProfile()
    setProfile(p)
    setPreviewBackground(null)
    setPreviewFrame(null)
    setPreviewColor(null)

    setMessage({ type: 'success', text: 'All customizations reset to stock.' })
    setLoading(false)
  }

  const handlePreview = (item: ShopItem) => {
    if (item.type === 'background') setPreviewBackground(item.css_class || null)
    if (item.type === 'frame') setPreviewFrame(item.css_class || null)
    if (item.type === 'color') setPreviewColor(item.css_class || null)
  }

  const getOwnedItem = (itemId: string) => inventory.find((i) => i.item_id === itemId)

  const filteredItems = items.filter((i) => i.type === filter)

  // Mockup Components

  const DashboardMockup = () => {
    const hasCustomBg = !!previewBackground
    return (
      <div
        className="p-6 rounded-3xl transition-all duration-500 relative overflow-hidden h-48 flex flex-col justify-center border border-slate-200 shadow-lg hover:shadow-xl bg-white"
      >
        {/* Background Layer — mirrors Dashboard.tsx exactly */}
        <div className={`absolute inset-0 overflow-hidden rounded-3xl -z-0 ${previewBackground || 'bg-slate-50'}`}>
          {hasCustomBg && <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>}
          <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12 pointer-events-none">
            <Sparkles className={`w-48 h-48 ${hasCustomBg ? 'text-white' : 'text-slate-200'}`} />
          </div>
        </div>

        <div className={`absolute top-4 left-5 text-[9px] font-black uppercase tracking-widest z-10 px-2.5 py-1 rounded-lg ${hasCustomBg ? 'text-white bg-black/20 backdrop-blur-md' : 'text-slate-400 bg-slate-100'}`}>
          Dashboard Monitor
        </div>

        <div className="flex items-center gap-5 z-10 w-full overflow-hidden mt-4">
          <div
            className={`w-20 h-20 rounded-full shadow-2xl overflow-hidden relative group shrink-0 bg-white transition-all duration-500 flex items-center justify-center ${previewFrame || 'border-4 border-white'}`}
          >
            {profile?.avatar_url && (
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className={`text-2xl font-extrabold tracking-tight leading-none mb-1.5 drop-shadow-md ${hasCustomBg ? 'text-white' : 'text-slate-800'}`}
            >
              Welcome back,
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`text-xl font-extrabold drop-shadow-sm ${previewColor || (hasCustomBg ? 'text-pink-200' : 'text-blue-600')}`}
              >
                {profile?.callsign || 'Pilot'}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${hasCustomBg ? 'text-[#0a1f5c] bg-white/90 backdrop-blur' : 'bg-slate-200 text-slate-700'}`}
              >
                {profile?.rank || 'Cadet'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CommunityMockup = () => {
    const hasCustomBg = !!previewBackground
    return (
      <div
        className="p-6 flex flex-col gap-3 rounded-3xl transition-all duration-500 h-48 relative overflow-hidden border border-slate-200 shadow-lg hover:shadow-xl bg-white"
      >
        {/* Background Layer — mirrors SocialHub.tsx pilot card */}
        <div className={`absolute inset-0 overflow-hidden rounded-3xl -z-0 ${previewBackground || 'bg-white'}`}>
          {hasCustomBg && <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>}
          <div className="absolute -bottom-10 -right-10 opacity-20 -rotate-12 pointer-events-none">
            <Sparkles className={`w-48 h-48 ${hasCustomBg ? 'text-white' : 'text-slate-200'}`} />
          </div>
        </div>

        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 ${hasCustomBg ? 'opacity-50' : 'opacity-100'} z-10`}></div>

        <div className={`absolute top-4 right-5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg z-10 ${hasCustomBg ? 'text-white bg-black/20 backdrop-blur-md' : 'text-slate-400 bg-slate-100'}`}>
          Pilot Card
        </div>

        <div className="flex gap-4 items-start mt-4 z-10">
          <div
            className={`w-16 h-16 shadow-xl rounded-full overflow-hidden relative group shrink-0 bg-white transition-all duration-500 flex items-center justify-center ${previewFrame || 'border-[3px] border-white'}`}
          >
            {profile?.avatar_url && (
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="flex-1 min-w-0 mt-1">
            <div
              className={`text-lg font-black truncate drop-shadow-sm ${previewColor || (hasCustomBg ? 'text-white drop-shadow-sm' : 'text-slate-800')}`}
            >
              {profile?.callsign || 'Pilot'}
            </div>
            <div
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mt-0.5 ${hasCustomBg ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
            >
              {profile?.rank || 'Cadet'}
            </div>
            <div className={`text-[10px] mt-1 font-semibold flex items-center gap-1.5 ${hasCustomBg ? 'text-white/80' : 'text-slate-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasCustomBg ? 'bg-green-400' : 'bg-green-500 animate-pulse'}`}></div>
              <span>
                Base: <span className={`font-bold ${hasCustomBg ? 'text-white' : 'text-slate-700'}`}>{profile?.homeBase || 'LGAV'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-auto z-10">
          <button className={`flex-1 py-2 text-[10px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-not-allowed transition-all ${hasCustomBg ? 'bg-white/10 text-white backdrop-blur-md border border-white/20' : 'border border-slate-200 bg-slate-50 text-slate-400'}`}>
            <UserPlus className="w-4 h-4" /> CONNECT
          </button>
        </div>
      </div>
    )
  }

  const SettingsMockup = () => {
    const hasCustomBg = !!previewBackground
    return (
      <div
        className="flex flex-col justify-center items-center gap-4 p-6 rounded-3xl transition-all duration-500 h-48 relative overflow-hidden border border-slate-200 shadow-lg hover:shadow-xl bg-white"
      >
        {/* Background Layer — mirrors Settings.tsx */}
        <div className={`absolute inset-0 overflow-hidden rounded-3xl -z-0 ${previewBackground || 'bg-slate-50'}`}>
          {hasCustomBg && <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>}
          <div className="absolute top-10 -left-10 opacity-20 rotate-45 pointer-events-none">
            <Sparkles className={`w-48 h-48 ${hasCustomBg ? 'text-white' : 'text-slate-200'}`} />
          </div>
        </div>

        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${hasCustomBg ? 'opacity-50' : 'opacity-100'} z-10`}></div>

        <div className={`absolute top-4 left-5 text-[9px] font-black uppercase tracking-widest z-10 rounded-lg px-2.5 py-1 ${hasCustomBg ? 'text-white bg-black/20 backdrop-blur-md' : 'text-slate-400 bg-slate-100'}`}>
          Settings ID
        </div>

        <div className="relative group z-10 mt-3">
          <div
            className={`w-20 h-20 shadow-2xl rounded-full overflow-hidden relative transition-all duration-500 flex items-center justify-center bg-white ${previewFrame || 'border-4 border-white'}`}
          >
            {profile?.avatar_url && (
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            )}
          </div>
        </div>
        <div className="z-10 text-center">
          <h3 className={`font-black text-xl drop-shadow-md tracking-tight ${previewColor || (hasCustomBg ? 'text-white' : 'text-slate-800')}`}>
            {profile?.callsign || 'SEH0001'}
          </h3>
          <p className={`text-[10px] font-black tracking-widest uppercase mt-0.5 ${hasCustomBg ? 'text-white/80' : 'text-slate-500'}`}>
            {profile?.rank || 'Captain'}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <SkyLoader text="Loading Sky Store..." />
      </div>
    )
  }

  return (
    <motion.div
      className="h-full flex flex-col font-sans bg-slate-50/50 overflow-hidden relative"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Page Header ─── */}
      <motion.div
        variants={slideDown}
        className="px-6 xl:px-8 pt-6 xl:pt-8 pb-5 shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-md z-20"
        data-tutorial="shop-header"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Sky Store
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Unlock custom backgrounds, frames, and titles
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl shadow-slate-900/10 px-6 py-2.5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest">
                  Available Balance
                </span>
                <span className="text-lg font-black text-white font-mono tracking-tight drop-shadow-md">
                  {isAdmin ? 'UNLIMITED' : `€${balance.toLocaleString()}`}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                <CreditCard className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1.5 font-bold uppercase transition-colors px-2"
              title="Reset all customizations to default"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh to Stock
            </button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-auto custom-scrollbar p-6 xl:p-8 space-y-8">
        {/* Workshop Preview Dock */}
        <div className="shrink-0 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Live Preview
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">
            Click any item below to preview it here
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <DashboardMockup />
          <CommunityMockup />
          <SettingsMockup />
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Categories Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
            {(['background', 'frame', 'color'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 uppercase text-xs font-black tracking-widest rounded-xl transition-all ${
                  filter === f
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {f}s
              </button>
            ))}
          </div>
        </div>

        {/* Shop Grid */}
        <div className="pb-8">
          {message && (
            <div
              className={`mb-4 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          <motion.div
            key={filter}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 p-1"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredItems.map((item) => {
              const owned = getOwnedItem(item.id)
              const canAfford = balance >= item.price || isAdmin
              const isPreviewing =
                (item.type === 'background' && previewBackground === item.css_class) ||
                (item.type === 'frame' && previewFrame === item.css_class) ||
                (item.type === 'color' && previewColor === item.css_class)

              return (
                <motion.div
                  variants={fadeInUp}
                  key={item.id}
                  onClick={() => handlePreview(item)}
                  className={`bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-500 border group cursor-pointer relative ${
                    owned
                      ? 'border-emerald-400/60 shadow-md'
                      : 'border-slate-200/80 shadow-md hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5'
                  } ${
                    isPreviewing
                      ? 'ring-4 ring-indigo-500/30 border-indigo-400'
                      : 'hover:border-indigo-300'
                  }`}
                >
                  {/* Preview Area Header */}
                  <div
                    className={`h-40 relative flex items-center justify-center overflow-hidden transition-colors border-b ${
                      owned
                        ? 'border-slate-100 bg-gradient-to-br from-white to-slate-50'
                        : 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-100 group-hover:from-indigo-50/50 group-hover:to-purple-50/50'
                    }`}
                  >
                    {item.type === 'color' && (
                      <span className={`text-3xl font-black tracking-tight drop-shadow-sm ${item.css_class}`}>
                        Pilot Name
                      </span>
                    )}

                    {item.type === 'frame' && (
                      <div
                        className={`w-24 h-24 bg-white flex items-center justify-center rounded-full shadow-lg relative ${item.css_class}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent rounded-full pointer-events-none"></div>
                        <div className="text-[10px] text-slate-400 font-black tracking-widest opacity-60">
                          AVATAR
                        </div>
                      </div>
                    )}

                    {item.type === 'background' && (
                      <div
                        className={`absolute inset-0 ${item.css_class} opacity-90 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center`}
                      >
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>
                        <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-slate-800 text-[10px] font-black tracking-widest uppercase shadow-xl transform group-hover:scale-105 transition-transform">
                          Background Cover
                        </span>
                      </div>
                    )}

                    {owned && (
                      <div className="absolute top-4 right-4 bg-green-500/10 backdrop-blur-md text-green-700 border border-green-500/20 text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 z-10 transition-transform hover:scale-105">
                        <Check className="w-3.5 h-3.5" /> OWNED
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div
                    className={`p-5 flex-1 flex flex-col relative z-10 ${
                      owned ? 'bg-gradient-to-b from-green-50/30 to-white' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 min-h-10">
                      <h3 className="font-bold text-sm text-slate-800 leading-tight pr-2">
                        {item.name}
                      </h3>
                      <span className="text-[9px] px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase font-black tracking-wider shrink-0">
                        {item.type === 'background' ? 'BG' : item.type}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-auto flex flex-col gap-2">
                      {/* Preview indicator */}
                      {isPreviewing && (
                        <div className="w-full py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 bg-purple-100 text-purple-700 border border-purple-200">
                          <Sparkles className="w-3.5 h-3.5" /> Previewing
                        </div>
                      )}

                      {/* Buy / Equip Button */}
                      {owned ? (
                        (() => {
                          let isEquipped = false
                          if (profile) {
                            if (
                              item.type === 'frame' &&
                              profile.equipped_frame === item.css_class
                            )
                              isEquipped = true
                            if (
                              item.type === 'background' &&
                              profile.equipped_background === item.css_class
                            )
                              isEquipped = true
                            if (
                              item.type === 'color' &&
                              profile.equipped_color === item.css_class
                            )
                              isEquipped = true
                          }

                          if (isEquipped) {
                            return (
                              <button
                                disabled
                                className="px-5 py-3 mt-1 text-[11px] bg-green-50 text-green-700 border border-green-200 font-black rounded-xl cursor-default w-full shadow-sm flex items-center justify-center gap-2 tracking-widest"
                              >
                                <Check className="w-4 h-4" /> EQUIPPED
                              </button>
                            )
                          }
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEquip(owned, item.type)
                              }}
                              className="w-full mt-1 px-5 py-3 text-[11px] font-black tracking-widest rounded-xl flex items-center justify-center gap-2 outline-none transition-all shadow-sm border border-slate-200 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-slate-700 hover:scale-[1.02] active:scale-95"
                              disabled={equipping}
                            >
                              EQUIP NOW
                            </button>
                          )
                        })()
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBuy(item)
                          }}
                          disabled={!canAfford || buying === item.id}
                          className={`px-5 mt-1 py-3 rounded-xl text-[11px] font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md w-full border ${
                            canAfford
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-indigo-700/50 hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-95'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                          }`}
                        >
                          {buying === item.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              {isAdmin
                                ? 'FREE (ADMIN)'
                                : `€${item.price.toLocaleString()}`}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>
  )
}
