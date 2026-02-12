import { useState, useEffect } from 'react'
import { DataService, ShopItem, InventoryItem, PilotProfile } from '../services/dataService'
import { ShoppingBag, CreditCard, Check, AlertCircle, Sparkles, UserPlus, MessageCircle, RefreshCw } from 'lucide-react'
import { SkyLoader } from '../components/ui/SkyLoader'

export const PilotShop = () => {
    const [items, setItems] = useState<ShopItem[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [balance, setBalance] = useState<number>(0)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [buying, setBuying] = useState<string | null>(null) // Item ID being bought
    const [filter, setFilter] = useState<'background' | 'frame' | 'color'>('background')
    const [activeTab, setActiveTab] = useState<'shop' | 'workshop'>('shop')
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

    const handleEquip = async (invItem: InventoryItem, type: string) => {
        await DataService.equipItem(invItem, type)
        setMessage({ type: 'success', text: 'Item equipped! Check your profile/settings.' })

        const p = await DataService.getProfile()
        setProfile(p)
    }

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset all customizations to stock?')) return

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
        if (item.type === 'background') setPreviewBackground(item.css_class)
        if (item.type === 'frame') setPreviewFrame(item.css_class)
        if (item.type === 'color') setPreviewColor(item.css_class)
    }

    const getOwnedItem = (itemId: string) => inventory.find((i) => i.item_id === itemId)

    const filteredItems = items.filter((i) => i.type === filter)

    // Mockup Components

    const DashboardMockup = () => (
        <div className={`p-4 rounded-xl shadow-md transition-all duration-300 relative overflow-hidden h-40 flex flex-col justify-center ${previewBackground || 'bg-white/50 border-b-2 border-white'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${previewBackground ? 'opacity-50' : 'opacity-100'}`} />

            <div className="flex items-center gap-4 z-10 w-full overflow-hidden">
                <div className={`w-16 h-16 rounded-xl shadow-md overflow-hidden relative group shrink-0 bg-slate-200 transition-all duration-300 ${previewFrame || 'border-2 border-white'}`}>
                    {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className={`text-xl font-bold uppercase tracking-tighter leading-none mb-1 drop-shadow-md ${previewBackground ? 'text-white' : 'text-[#333]'}`}>
                        Pilot Dashboard
                    </h1>
                    <p className={`text-xs font-medium flex items-center gap-1 drop-shadow-sm ${previewBackground ? 'text-white/80' : 'text-gray-600'}`}>
                        Welcome, <span className={`font-bold text-lg ${previewColor || (previewBackground ? 'text-white' : 'text-blue-800')}`}>
                            {profile?.callsign || 'Pilot'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase ml-2 border ${previewBackground ? 'bg-white/20 border-white/30 text-white' : 'bg-gray-200 border-gray-300 text-gray-600'}`}>
                            {profile?.rank || 'Cadet'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12">
                <Sparkles className={`w-32 h-32 ${previewBackground ? 'text-white' : 'text-blue-900'}`} />
            </div>
        </div>
    )

    const CommunityMockup = () => (
        <div className={`p-4 flex flex-col gap-2 rounded-xl transition-all duration-300 h-40 relative overflow-hidden ${previewBackground ? `${previewBackground} bg-cover border-none shadow-lg text-white` : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${previewBackground ? 'opacity-50' : 'opacity-100'}`} />
            <div className="absolute top-2 right-2 text-[8px] font-bold opacity-50 uppercase tracking-widest px-1 rounded bg-black/10 backdrop-blur-sm">Pilot Card</div>

            <div className="flex gap-3 items-start mt-2">
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-xl shadow-md overflow-hidden relative group shrink-0 bg-slate-200 transition-all duration-300 ${previewFrame || 'border-2 border-white'}`}>
                    {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${previewColor || 'text-blue-900'} drop-shadow-sm`}>
                        {profile?.callsign || 'Pilot'}
                    </div>
                    <div className={`text-[10px] font-bold uppercase ${previewBackground ? 'opacity-90' : 'text-gray-600'}`}>
                        {profile?.rank || 'Cadet'}
                    </div>
                    <div className={`text-[10px] ${previewBackground ? 'opacity-80' : 'text-gray-500'}`}>
                        Base: <span className={`font-mono ${previewBackground ? 'font-bold' : 'text-black'}`}>{profile?.homeBase || 'LGAV'}</span>
                    </div>
                    <div className="text-[10px] text-green-600 font-bold mt-1">
                        {profile?.flightHours?.toFixed(1) || '0.0'} HRS
                    </div>
                </div>
            </div>

            {/* Mock Actions */}
            <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-1 text-[10px] font-bold border border-blue-400 bg-blue-100 text-blue-800 flex items-center justify-center gap-1 opacity-80 cursor-not-allowed">
                    <UserPlus className="w-3 h-3" /> CONNECT
                </button>
                <button className="p-1 px-3 bg-gray-100 border border-gray-300 text-gray-600 opacity-80 cursor-not-allowed">
                    <MessageCircle className="w-3 h-3" />
                </button>
            </div>

            <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12">
                <Sparkles className={`w-32 h-32 ${previewBackground ? 'text-white' : 'text-blue-900'}`} />
            </div>
        </div>
    )

    const SettingsMockup = () => (
        <div className={`flex flex-col justify-center items-center gap-3 p-4 rounded-lg shadow-inner transition-all duration-300 h-40 relative overflow-hidden ${previewBackground || 'bg-gray-100'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${previewBackground ? 'opacity-50' : 'opacity-100'}`} />
            <div className="absolute top-2 left-2 text-[9px] font-bold opacity-30 uppercase tracking-widest">Settings Profile</div>
            <div className="relative group z-10">
                <div className={`w-20 h-20 rounded-xl shadow-lg overflow-hidden relative transition-all duration-300 ${previewFrame || 'border-4 border-white'} bg-slate-200`}>
                    {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
                </div>
            </div>
            <div className="z-10 text-center">
                <h3 className={`font-bold text-sm ${previewColor ? previewColor : 'text-gray-800'}`}>{profile?.callsign || 'SEH0001'}</h3>
                <p className="text-[10px] text-gray-500">{profile?.rank || 'Captain'}</p>
            </div>

            <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12">
                <Sparkles className={`w-32 h-32 ${previewBackground ? 'text-white' : 'text-blue-900'}`} />
            </div>
        </div>
    )


    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#f0f0f0]">
                <SkyLoader text="Loading Sky Store..." />
            </div>
        )
    }

    return (
        <div className="p-4 h-full flex flex-col gap-4 font-tahoma bg-[#f0f0f0]">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-white pb-2 shadow-sm shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-blue-800" />
                        Sky Store
                    </h1>
                    <div className="flex gap-4 mt-1">
                        <button
                            onClick={() => setActiveTab('shop')}
                            className={`text-xs font-bold uppercase pb-1 border-b-2 transition-all ${activeTab === 'shop' ? 'border-blue-600 text-blue-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Browsing
                        </button>
                        <button
                            onClick={() => setActiveTab('workshop')}
                            className={`text-xs font-bold uppercase pb-1 border-b-2 transition-all flex items-center gap-1 ${activeTab === 'workshop' ? 'border-purple-600 text-purple-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Sparkles className="w-3 h-3" /> Workshop
                        </button>
                    </div>

                    {activeTab === 'workshop' && (
                        <button
                            onClick={handleReset}
                            className="mt-2 text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 font-bold uppercase transition-colors"
                            title="Reset all customizations to default"
                        >
                            <RefreshCw className="w-3 h-3" /> Reset to Stock
                        </button>
                    )}
                </div>
                <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] px-4 py-2 rounded text-white shadow-md flex items-center gap-2">
                    <span className="text-[10px] uppercase opacity-80">Balance</span>
                    <span className={`text-xl font-mono font-bold ${isAdmin ? 'text-green-300' : 'text-yellow-300'}`}>
                        {isAdmin ? 'ADMIN' : `€${balance.toLocaleString()}`}
                    </span>
                </div>
            </div>

            {/* Workshop Preview Area */}
            {activeTab === 'workshop' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 mb-2">
                    <DashboardMockup />
                    <CommunityMockup />
                    <SettingsMockup />
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* Categories Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 shrink-0">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2 shrink-0">
                        {activeTab === 'workshop' ? 'Try on:' : 'Filter:'}
                    </div>
                    {(['background', 'frame', 'color'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn-classic px-4 py-1.5 uppercase text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${filter === f
                                ? activeTab === 'workshop'
                                    ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-sm ring-1 ring-purple-200'
                                    : 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm ring-1 ring-blue-200'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {f}s
                            {filter === f && <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'workshop' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>}
                        </button>
                    ))}
                </div>

                {/* Shop Grid */}
                <div className="flex-1 overflow-y-auto pr-2 pb-4">
                    {message && (
                        <div
                            className={`mb-4 p-3 rounded text-xs font-bold flex items-center gap-2 shadow-sm ${message.type === 'success'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map((item) => {
                            const owned = getOwnedItem(item.id)
                            const canAfford = balance >= item.price || isAdmin
                            // Check active preview state
                            const isPreviewing = (item.type === 'background' && previewBackground === item.css_class) ||
                                (item.type === 'frame' && previewFrame === item.css_class) ||
                                (item.type === 'color' && previewColor === item.css_class)

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => activeTab === 'workshop' && handlePreview(item)}
                                    className={`legacy-panel overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${owned ? 'border-green-300 bg-green-50/10' : ''} ${activeTab === 'workshop' ? 'cursor-pointer hover:ring-2 hover:ring-purple-400' : ''} ${isPreviewing && activeTab === 'workshop' ? 'ring-2 ring-purple-600' : ''}`}
                                >
                                    {/* Preview Area */}
                                    <div className="h-32 bg-slate-100 border-b border-gray-200 relative flex items-center justify-center overflow-hidden group">
                                        {/* Item Visuals */}
                                        {item.type === 'color' && (
                                            <span className={`text-xl font-bold ${item.css_class}`}>Pilot Name</span>
                                        )}

                                        {item.type === 'frame' && (
                                            <div className={`w-20 h-20 bg-gray-200 flex items-center justify-center rounded-xl ${item.css_class}`}>
                                                <div className="text-[10px] text-gray-500 font-bold opacity-50">AVATAR</div>
                                            </div>
                                        )}

                                        {item.type === 'background' && (
                                            <div
                                                className={`absolute inset-0 ${item.css_class} opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
                                            >
                                                <span className="bg-white/80 px-2 py-1 rounded text-gray-800 text-[10px] font-bold shadow-sm backdrop-blur-sm">
                                                    Background
                                                </span>
                                            </div>
                                        )}

                                        {owned && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 z-10">
                                                <Check className="w-3 h-3" /> OWNED
                                            </div>
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="p-3 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-1 h-10">
                                            <h3 className="font-bold text-xs text-[#333] leading-tight">{item.name}</h3>
                                            <span
                                                className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${item.type === 'background'
                                                    ? 'border-blue-200 text-blue-600 bg-blue-50'
                                                    : item.type === 'frame'
                                                        ? 'border-purple-200 text-purple-600 bg-purple-50'
                                                        : 'border-orange-200 text-orange-600 bg-orange-50'
                                                    }`}
                                            >
                                                {item.type === 'background' ? 'BG' : item.type}
                                            </span>
                                        </div>

                                        <p className="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-relaxed h-8">
                                            {item.description}
                                        </p>

                                        {/* Action Button Logic */}
                                        {activeTab === 'workshop' ? (
                                            <button
                                                className={`w-full py-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${isPreviewing ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}
                                            >
                                                {isPreviewing ? <Sparkles className="w-3 h-3" /> : 'Try On'}
                                                {isPreviewing ? 'Previewing' : 'Click to Preview'}
                                            </button>
                                        ) : (
                                            owned ? (
                                                (() => {
                                                    let isEquipped = false
                                                    if (profile) {
                                                        if (item.type === 'frame' && profile.equipped_frame === item.css_class) isEquipped = true
                                                        if (item.type === 'background' && profile.equipped_background === item.css_class) isEquipped = true
                                                        if (item.type === 'color' && profile.equipped_color === item.css_class) isEquipped = true
                                                    }

                                                    if (isEquipped) {
                                                        return (
                                                            <button disabled className="px-2 py-1 text-[10px] bg-green-100 text-green-800 border border-green-300 font-bold rounded cursor-default w-full">
                                                                EQUIPPED
                                                            </button>
                                                        )
                                                    }
                                                    return (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEquip(owned, item.type) }}
                                                            className="btn-classic px-2 py-1 text-[10px] hover:bg-green-50 hover:text-green-700 hover:border-green-300 w-full"
                                                        >
                                                            Equip
                                                        </button>
                                                    )
                                                })()
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBuy(item) }}
                                                    disabled={!canAfford || buying === item.id}
                                                    className={`px-3 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm w-full ${canAfford
                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {buying === item.id ? '...' : (
                                                        <>
                                                            <CreditCard className="w-3 h-3" />
                                                            {isAdmin ? 'Free' : `Buy €${item.price.toLocaleString()}`}
                                                        </>
                                                    )}
                                                </button>
                                            )
                                        )}

                                        {/* Workshop Quick Buy for non-owned */}
                                        {activeTab === 'workshop' && !owned && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBuy(item) }}
                                                disabled={!canAfford || buying === item.id}
                                                className={`mt-2 w-full py-1 text-[10px] font-bold border rounded transition-all ${canAfford ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'border-gray-200 text-gray-300'}`}
                                            >
                                                {buying === item.id ? 'Buying...' : `Buy for €${item.price.toLocaleString()}`}
                                            </button>
                                        )}
                                        {/* Workshop Quick Equip for owned */}
                                        {activeTab === 'workshop' && owned && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEquip(owned, item.type) }}
                                                className="mt-2 w-full py-1 text-[10px] font-bold border border-green-200 text-green-600 hover:bg-green-50 rounded"
                                            >
                                                Equip Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
