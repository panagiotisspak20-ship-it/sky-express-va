import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { toastConfirm } from '../utils/toastConfirm'
import {
  Settings as SettingsIcon,
  Save,
  Trash2,
  RefreshCw,
  Download,
  Power,
  MessageCircle,
  Globe,
  User,
  Upload,
  Sparkles,
  ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { DataService, PilotProfile } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'
import { pageVariants, staggerContainer, fadeInUp } from '../utils/animations'

export const Settings: React.FC = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [simBriefUser, setSimBriefUser] = useState('')
  const [simBriefId, setSimBriefId] = useState('') // New state
  const [vatsimId, setVatsimId] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  // Updater State
  const [updateStatus, setUpdateStatus] = useState<string>('idle') // idle, checking, available, not-available, downloading, downloaded, error
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [updateError, setUpdateError] = useState<string>('')

  useEffect(() => {
    DataService.getProfile()
      .then((p) => {
        setProfile(p)
        if (p?.simBriefUsername) setSimBriefUser(p.simBriefUsername)
        if (p?.simBriefId) setSimBriefId(p.simBriefId)
        if (p?.vatsimId) setVatsimId(p.vatsimId)
      })
      .catch((err) => {
        console.error('Failed to load profile in Settings', err)
      })

    // Get App Version
    // @ts-ignore Accessing exposed updater API
    if (window.api && window.api.updater && window.api.updater.getAppVersion) {
      // @ts-ignore Accessing exposed updater API
      window.api.updater
        .getAppVersion()
        .then((version: string) => setAppVersion(version))
        .catch((err: unknown) => console.error('Failed to get app version:', err))
    }

    // Register Updater Listeners
    // @ts-ignore Accessing exposed updater API
    if (window.api && window.api.updater) {
      // @ts-ignore Accessing exposed updater API
      const cleanup1 = window.api.updater.onChecking(() => {
        setUpdateStatus('checking')
      })
      // @ts-ignore Accessing exposed updater API
      const cleanup2 = window.api.updater.onUpdateAvailable(() => {
        setUpdateStatus('available')
      })
      // @ts-ignore Accessing exposed updater API
      const cleanup3 = window.api.updater.onUpdateNotAvailable(() => {
        setUpdateStatus('not-available')
      })
      // @ts-ignore Accessing exposed updater API
      const cleanup4 = window.api.updater.onError((err: string) => {
        console.error('[Settings] Update status: error', err)
        setUpdateStatus('error')
        setUpdateError(err)
      })
      // @ts-ignore Accessing exposed updater API
      const cleanup5 = window.api.updater.onDownloadProgress((prog: { percent: number }) => {
        setUpdateStatus('downloading')
        setDownloadProgress(prog.percent)
      })
      // @ts-ignore Accessing exposed updater API
      const cleanup6 = window.api.updater.onUpdateDownloaded(() => {
        setUpdateStatus('downloaded')
      })

      return () => {
        cleanup1()
        cleanup2()
        cleanup3()
        cleanup4()
        cleanup5()
        cleanup6()
      }
    }
    return () => {}
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    setUpdateStatus('checking')
    setUpdateError('')

    // @ts-ignore Accessing exposed updater API
    if (!window.api || !window.api.updater) {
      console.error('[Settings] Updater API not found')
      setUpdateStatus('error')
      setUpdateError('Updater API not available')
      return
    }

    try {
      // @ts-ignore Accessing exposed updater API
      await window.api.updater.checkForUpdates()
    } catch (e: unknown) {
      console.error('[Settings] Check for updates invocation error:', e)
      setUpdateStatus('error')
      setUpdateError((e as Error).message || 'Invocation failed')
    }
  }

  const handleDownloadUpdate = (): void => {
    // @ts-ignore Accessing exposed updater API
    window.api.updater.downloadUpdate()
  }

  const handleQuitAndInstall = (): void => {
    // @ts-ignore Accessing exposed updater API
    window.api.updater.quitAndInstall()
  }

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (profile) {
      // Validation: Ensure either BOTH SimBrief fields are filled, or BOTH are empty
      if (
        (simBriefUser.trim() && !simBriefId.trim()) ||
        (!simBriefUser.trim() && simBriefId.trim())
      ) {
        toast.error(
          '⚠️ Please fill in BOTH SimBrief Username and Pilot ID to enable OFP fetching, or leave both empty.'
        )
        return
      }

      // If user deletes them we want to save null, not undefined so it actually overwrites DB
      const userToSave = simBriefUser.trim() || null
      const idToSave = simBriefId.trim() || null
      const vatsimToSave = vatsimId.trim() || null

      try {
        await DataService.updateProfile({
          simBriefUsername: userToSave as string,
          simBriefId: idToSave as string,
          vatsimId: vatsimToSave as string
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (error: unknown) {
        console.error('Failed to update settings:', error)
      }
    }
  }

  const handleDeleteAccount = async (): Promise<void> => {
    if (
      await toastConfirm(
        'WARNING: This will delete your account and ALL data (Flight hours, career logs, bookings) permanently. This action cannot be undone. Are you sure?'
      )
    ) {
      try {
        await DataService.deleteAccount()
        window.location.reload() // Or navigate to login
      } catch (error: unknown) {
        console.error('Failed to delete account:', error)
      }
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const url = await DataService.uploadProfilePhoto(file)
      await DataService.updateProfile({ avatar_url: url })
      setProfile((prev: PilotProfile | null) => (prev ? { ...prev, avatar_url: url } : null))
      toast.success('Profile photo updated!')
    } catch (error: unknown) {
      console.error('Error uploading photo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReplayTutorial = async (): Promise<void> => {
    await DataService.updateProfile({ tutorialComplete: false })
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <SkyLoader text="Updating Settings..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 h-full flex flex-col font-sans bg-slate-50">
        <h1 className="text-3xl font-black text-sky-900 tracking-tight mb-6 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-sky-600" /> System Settings
        </h1>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 max-w-lg mx-auto p-12 text-center text-slate-500 w-full flex justify-center py-16">
          <SkyLoader text="Loading profile..." />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="p-6 h-full flex flex-col gap-6 font-sans bg-slate-50 overflow-y-auto overflow-x-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 border-b-2 border-slate-200 pb-4">
        <SettingsIcon className="w-8 h-8 text-sky-600" /> System Settings
      </h1>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6 w-full max-w-5xl mx-auto"
      >
        {/* Application Updates */}
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 rounded-3xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden"
        >
          <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest border-b border-indigo-200/60 pb-3 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-500" /> Application Updates
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
              v{appVersion || 'Unknown'}
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {updateStatus === 'idle' && (
                <span className="text-sm font-semibold text-slate-600">
                  Click to check for the latest version.
                </span>
              )}

              {updateStatus === 'not-available' && (
                <span className="text-sm text-emerald-600 font-bold flex items-center gap-2">
                  ✅ You are on the latest version.
                </span>
              )}

              {updateStatus === 'checking' && (
                <span className="text-sm text-indigo-600 font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Checking for updates...
                </span>
              )}

              {updateStatus === 'available' && (
                <span className="text-sm text-emerald-600 font-bold flex items-center gap-2">
                  🎉 New version available!
                </span>
              )}

              {updateStatus === 'downloading' && (
                <div className="flex flex-col gap-2 w-64 sm:w-80">
                  <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">
                    Downloading Update... {downloadProgress.toFixed(0)}%
                  </span>
                  <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-indigo-100 shadow-inner">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {updateStatus === 'downloaded' && (
                <span className="text-sm text-purple-600 font-bold flex items-center gap-2">
                  ✅ Update downloaded and ready to install.
                </span>
              )}

              {updateStatus === 'error' && (
                <span className="text-sm text-red-600 font-bold flex items-center gap-2">
                  ❌ Error: {updateError}
                </span>
              )}
            </div>

            <div>
              {(updateStatus === 'idle' ||
                updateStatus === 'not-available' ||
                updateStatus === 'error') && (
                <button
                  onClick={handleCheckForUpdates}
                  className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 shadow-sm transition-all rounded-xl flex items-center gap-2 text-sm font-bold px-5 py-2.5 hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-4 h-4" /> CHECK FOR UPDATES
                </button>
              )}

              {updateStatus === 'available' && (
                <button
                  onClick={handleDownloadUpdate}
                  className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all rounded-xl flex items-center gap-2 text-sm font-bold px-5 py-2.5 hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" /> DOWNLOAD UPDATE
                </button>
              )}

              {updateStatus === 'downloaded' && (
                <button
                  onClick={handleQuitAndInstall}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all rounded-xl flex items-center gap-2 text-sm font-bold px-5 py-2.5 hover:-translate-y-0.5"
                >
                  <Power className="w-4 h-4" /> RESTART & INSTALL
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pilot Identity Settings */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 relative overflow-hidden"
        >
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> Pilot Identity
          </h2>

          <div
            className={`flex flex-col sm:flex-row items-center gap-8 p-6 sm:p-8 rounded-2xl shadow-inner relative overflow-hidden transition-all duration-300 ${profile?.equipped_background || 'bg-slate-50 border border-slate-100'}`}
          >
            <div
              className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${profile?.equipped_background ? 'opacity-50' : 'opacity-100'}`}
            />

            {/* Sparkles Decoration */}
            <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12 pointer-events-none">
              <Sparkles
                className={`w-40 h-40 ${profile?.equipped_background ? 'text-white' : 'text-blue-900'}`}
              />
            </div>

            {/* Avatar block */}
            <div className="relative group shrink-0 z-10 hover:-translate-y-1 transition-transform">
              <div
                className={`w-32 h-32 rounded-2xl shadow-xl overflow-hidden relative transition-all duration-300 ${profile?.equipped_frame || 'border-4 border-white'}`}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <User className="w-16 h-16 text-slate-400" />
                  </div>
                )}

                {/* Edit Overlay */}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                  <Upload className="w-8 h-8 text-white mb-2" />
                  <span className="text-[11px] text-white font-bold uppercase tracking-widest">
                    Upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            {/* Identity Info */}
            <div className="flex flex-col z-10 w-full sm:border-l sm:border-black/10 sm:pl-8 text-inherit">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-16">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                    Callsign
                  </span>
                  <span className="text-3xl font-black tracking-wider opacity-90 drop-shadow-sm">
                    {profile?.callsign || 'SEH000'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                    Rank
                  </span>
                  <span className="text-2xl font-bold opacity-80 flex items-center gap-2">
                    {profile?.rank || 'Cadet'}
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-black/10">
                <span className="text-xs font-semibold opacity-70 flex items-center gap-2">
                  <span className="text-lg">💡</span> Click your avatar picture to upload a new
                  profile photo. Callsign and Rank are managed by the system.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Integrations & Configuration */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-[3] flex flex-col min-w-0 overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" /> Integrations & Configuration
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col">
              <div className="p-6 space-y-6">
                {/* SimBrief Config */}
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 focus-within:text-sky-600 transition-colors">
                      SimBrief Username
                    </label>
                    <input
                      type="text"
                      value={simBriefUser}
                      onChange={(e) => setSimBriefUser(e.target.value)}
                      className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-400 p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                      placeholder="e.g. JSmith"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 focus-within:text-sky-600 transition-colors">
                      SimBrief Pilot ID (Number)
                    </label>
                    <input
                      type="text"
                      value={simBriefId}
                      onChange={(e) => setSimBriefId(e.target.value)}
                      className="w-full text-sm font-mono text-slate-800 placeholder:text-slate-400 p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                      placeholder="e.g. 123456"
                    />
                  </div>

                  <p className="text-[11px] font-semibold text-amber-700/80 mt-3 flex items-center gap-1.5">
                    <span className="text-sm">⚠️</span> These details are required to generate
                    Operational Flight Plans (OFP) and Dispatch flights.
                  </p>
                </div>

                {/* VATSIM Config */}
                <div className="px-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 focus-within:text-sky-600 transition-colors">
                    VATSIM ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={vatsimId}
                    onChange={(e) => setVatsimId(e.target.value)}
                    className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-400 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                    placeholder="e.g. 1000001"
                  />
                </div>
              </div>

              <div className="mt-auto bg-slate-50/80 border-t border-slate-100 p-4 px-6 flex flex-wrap lg:justify-between justify-start items-center gap-4">
                <div className="flex gap-3 flex-wrap w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={handleReplayTutorial}
                    className="text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 font-bold flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
                  >
                    📖 REPLAY TUTORIAL
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 font-bold flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> DELETE ACCOUNT
                  </button>
                </div>

                <div className="flex gap-4 items-center flex-wrap lg:justify-end w-full lg:w-auto">
                  {saved && (
                    <span className="text-sm text-emerald-500 font-bold fade-out whitespace-nowrap flex items-center gap-1">
                      ✅ SETTINGS SAVED!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all w-full lg:w-auto rounded-xl flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" /> SAVE CONFIG
                  </button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Community & Resources */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-[2] min-w-0 h-fit overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-400" /> Community & Resources
            </div>
            <div className="p-6 flex flex-col gap-4">
              <a
                href="https://discord.gg/9xRHBZWjVK"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-center gap-3 py-4 px-6 rounded-2xl shadow-sm text-sm bg-[#5865F2] text-white hover:bg-[#4752C4] hover:shadow-md hover:-translate-y-0.5 transition-all font-bold"
              >
                <img
                  src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png"
                  alt="Discord"
                  className="w-6 h-6 object-contain invert brightness-0"
                />
                <span>JOIN DISCORD SERVER</span>
              </a>

              <button
                onClick={() => navigate('/legal')}
                className="group flex items-center justify-center gap-3 py-4 px-6 rounded-2xl shadow-sm text-sm bg-slate-700 text-white hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold"
              >
                <ShieldCheck className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                <span>LEGAL & POLICIES</span>
              </button>

              <div className="mt-2 text-xs font-medium text-slate-500 text-center leading-relaxed p-4 bg-slate-50 rounded-2xl border border-slate-100">
                Connect with fellow pilots, report bugs, ask for help, and participate in exclusive
                Sky Express virtual events!
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
