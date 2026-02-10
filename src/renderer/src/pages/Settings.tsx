import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Save,
  Trash2,
  RefreshCw,
  Download,
  Power,
  MessageCircle,
  Globe
} from 'lucide-react'
import { DataService, PilotProfile } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'

export const Settings = () => {
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
    DataService.getProfile().then((p) => {
      setProfile(p)
      if (p?.simBriefUsername) setSimBriefUser(p.simBriefUsername)
      if (p?.simBriefId) setSimBriefId(p.simBriefId)
    })

    // Get App Version
    // @ts-ignore (Accessing exposed electron process versions)
    if (window.electron && window.electron.process) {
      // @ts-ignore (Accessing exposed electron process versions)
      setAppVersion(window.electron.process.versions.app || '1.1.0') // Fallback if not exposed properly yet
    }

    // Register Updater Listeners
    // @ts-ignore (Accessing exposed updater API)
    if (window.api && window.api.updater) {
      // @ts-ignore
      const cleanup1 = window.api.updater.onChecking(() => {
        setUpdateStatus('checking')
      })
      // @ts-ignore
      const cleanup2 = window.api.updater.onUpdateAvailable(() => {
        setUpdateStatus('available')
      })
      // @ts-ignore
      const cleanup3 = window.api.updater.onUpdateNotAvailable(() => {
        setUpdateStatus('not-available')
      })
      // @ts-ignore
      const cleanup4 = window.api.updater.onError((err) => {
        console.error('[Settings] Update status: error', err)
        setUpdateStatus('error')
        setUpdateError(err)
      })
      // @ts-ignore
      const cleanup5 = window.api.updater.onDownloadProgress((prog) => {
        setUpdateStatus('downloading')
        setDownloadProgress(prog.percent)
      })
      // @ts-ignore
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
    return () => { }
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    setUpdateStatus('checking')
    setUpdateError('')

    // @ts-ignore
    if (!window.api || !window.api.updater) {
      console.error('[Settings] Updater API not found')
      setUpdateStatus('error')
      setUpdateError('Updater API not available')
      return
    }

    try {
      // @ts-ignore (Accessing exposed updater API)
      await window.api.updater.checkForUpdates()
    } catch (e: any) {
      console.error('[Settings] Check for updates invocation error:', e)
      setUpdateStatus('error')
      setUpdateError(e.message || 'Invocation failed')
    }
  }

  const handleDownloadUpdate = (): void => {
    // @ts-ignore (Accessing exposed updater API)
    window.api.updater.downloadUpdate()
  }

  const handleQuitAndInstall = (): void => {
    // @ts-ignore (Accessing exposed updater API)
    window.api.updater.quitAndInstall()
  }

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (profile) {
      // Validation: Ensure both fields are present
      if (!simBriefUser.trim() || !simBriefId.trim()) {
        alert('⚠️ Please fill in BOTH SimBrief Username and Pilot ID to save.')
        return
      }

      try {
        await DataService.updateProfile({
          simBriefUsername: simBriefUser,
          simBriefId: simBriefId
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (error: any) {
        console.error('Failed to update settings:', error)
        alert(`Failed to save settings: ${error.message}\n\nPlease ensure you have run the database update script 'fix_missing_profile_columns.sql'.`)
      }
    }
  }

  const handleDeleteAccount = async (): Promise<void> => {
    if (
      confirm(
        'WARNING: This will delete your account and ALL data (Flight hours, career logs, bookings) permanently. This action cannot be undone. Are you sure?'
      )
    ) {
      try {
        await DataService.deleteAccount()
        window.location.reload() // Or navigate to login
      } catch (error: any) {
        console.error('Failed to delete account:', error)
        alert(
          `Failed to delete account: ${error.message || 'Unknown error'}\n\nPlease ensure the database update script has been run.`
        )
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
      setProfile((prev: any) => ({ ...prev, avatar_url: url }))
      alert('Profile photo updated!')
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      alert(`Failed to upload photo: ${error.message}`)
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
      <div className="flex items-center justify-center h-full">
        <SkyLoader text="Updating Settings..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 h-full flex flex-col font-tahoma bg-[#f0f0f0]">
        <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter mb-4 px-1 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> System Configuration
        </h1>
        <div className="legacy-panel bg-[#fcfcfc] max-w-lg p-4 text-center text-gray-600 flex justify-center py-8">
          <SkyLoader text="Loading profile..." />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col gap-4 font-tahoma bg-[#f0f0f0] overflow-y-auto">
      <h1 className="text-xl font-bold text-[#333] uppercase tracking-tighter border-b-2 border-white pb-2">
        System Settings
      </h1>

      {/* Application Updates */}
      <div className="legacy-panel p-4 bg-blue-50 border-blue-200">
        <h2 className="text-sm font-bold text-blue-900 border-b border-blue-200 pb-1 mb-3 flex items-center justify-between">
          <span>APPLICATION UPDATES</span>
          <span className="text-xs font-normal text-gray-500">Current Version: {appVersion}</span>
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {updateStatus === 'idle' && (
              <span className="text-xs text-gray-600">Click to check for the latest version.</span>
            )}

            {updateStatus === 'not-available' && (
              <span className="text-xs text-green-600 font-bold flex items-center gap-2">
                ✅ You are on the latest version.
              </span>
            )}

            {updateStatus === 'checking' && (
              <span className="text-xs text-blue-600 font-bold flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking for updates...
              </span>
            )}

            {updateStatus === 'available' && (
              <span className="text-xs text-green-600 font-bold flex items-center gap-2">
                🎉 New version available!
              </span>
            )}

            {updateStatus === 'downloading' && (
              <div className="flex flex-col gap-1 w-64">
                <span className="text-[10px] text-blue-600 font-bold">Downloading Update... {downloadProgress.toFixed(0)}%</span>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-gray-400">
                  <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}

            {updateStatus === 'downloaded' && (
              <span className="text-xs text-purple-600 font-bold flex items-center gap-2">
                ✅ Update downloaded and ready to install.
              </span>
            )}

            {updateStatus === 'error' && (
              <span className="text-xs text-red-600 font-bold flex items-center gap-2">
                ❌ Error: {updateError}
              </span>
            )}
          </div>

          <div>
            {(updateStatus === 'idle' || updateStatus === 'not-available' || updateStatus === 'error') && (
              <button onClick={handleCheckForUpdates} className="btn-classic flex items-center gap-1 text-xs px-3 py-1">
                <RefreshCw className="w-3 h-3" /> CHECK FOR UPDATES
              </button>
            )}

            {updateStatus === 'available' && (
              <button onClick={handleDownloadUpdate} className="btn-classic flex items-center gap-1 text-xs px-3 py-1">
                <Download className="w-3 h-3" /> DOWNLOAD UPDATE
              </button>
            )}

            {updateStatus === 'downloaded' && (
              <button onClick={handleQuitAndInstall} className="btn-classic flex items-center gap-1 text-xs px-3 py-1 text-green-700">
                <Power className="w-3 h-3" /> RESTART & INSTALL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pilot Profile Settings */}
      <div className="legacy-panel p-4 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">
          PILOT PROFILE CONFIGURATION
        </h2>

        <div className="flex gap-4 items-start">
          {/* Photo Preview */}
          <div className="flex flex-col gap-2 items-center">
            <div className="w-32 h-32 border border-gray-400 bg-gray-200 flex items-center justify-center shadow-inner overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500 text-center">
                  NO PHOTO
                  <br />
                  AVAILABLE
                </span>
              )}
            </div>
            <label className="btn-classic text-[10px] px-2 py-1 cursor-pointer flex flex-col items-center">
              <span>UPLOAD NEW PHOTO</span>
              <span className="text-[9px] font-normal text-gray-500 normal-case">(Auto-saves)</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-600">CALLSIGN</label>
              <div className="inset-box p-2 font-mono font-bold bg-gray-100 text-gray-500">
                {profile.callsign}
              </div>
              <span className="text-[9px] text-gray-400">Callsign cannot be changed.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-600">RANK</label>
              <div className="inset-box p-2 font-bold bg-gray-100 text-gray-500">
                {profile.rank}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Integrations & Configuration */}
        <div className="legacy-panel bg-[#fcfcfc] flex-1 min-w-0">
          <div className="bg-[#e1e1e1] px-2 py-1 text-xs font-bold text-[#333] border border-gray-300 mb-3">
            INTEGRATIONS & CONFIGURATION
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-4 px-2 pb-2 h-[calc(100%-40px)] flex flex-col"
          >
            {/* SimBrief Config */}
            <div className="border border-gray-300 p-2 bg-yellow-50 flex-1">
              <div className="mb-3">
                <label className="block text-xs font-bold text-[#333] mb-1">
                  SimBrief Username:
                </label>
                <input
                  type="text"
                  value={simBriefUser}
                  onChange={(e) => setSimBriefUser(e.target.value)}
                  className="w-full text-xs p-1 border border-gray-400 bg-white"
                  placeholder="e.g. JSmith"
                />
              </div>

              <div className="mb-1">
                <label className="block text-xs font-bold text-[#333] mb-1">
                  SimBrief Pilot ID (Number):
                </label>
                <input
                  type="text"
                  value={simBriefId}
                  onChange={(e) => setSimBriefId(e.target.value)}
                  className="w-full text-xs p-1 border border-gray-400 bg-white font-mono"
                  placeholder="e.g. 123456"
                />
              </div>

              <p className="text-[10px] text-gray-500 mt-2 italic">
                These details are required to generate Operational Flight Plans (OFP) and Dispatch flights.
              </p>
            </div>

            {/* VATSIM Config (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[#333] mb-1">
                VATSIM ID (Optional):
              </label>
              <input
                type="text"
                value={vatsimId}
                onChange={(e) => setVatsimId(e.target.value)}
                className="w-full text-xs p-1 border border-gray-400 bg-white"
                placeholder="e.g. 1000001"
              />
            </div>

            <div className="border-t border-gray-300 pt-3 flex flex-wrap justify-between items-center bg-gray-50 p-2 mt-auto gap-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleReplayTutorial}
                  className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline border border-transparent p-1 hover:border-blue-200 whitespace-nowrap"
                >
                  📖 REPLAY TUTORIAL
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-[10px] text-red-600 font-bold flex items-center gap-1 hover:underline border border-transparent p-1 hover:border-red-200 whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" /> DELETE ACCOUNT
                </button>
              </div>

              <div className="flex gap-2 items-center flex-wrap justify-end">
                {saved && (
                  <span className="text-xs text-green-600 font-bold fade-out whitespace-nowrap">
                    SETTINGS SAVED!
                  </span>
                )}
                <button
                  type="submit"
                  className="btn-classic flex items-center gap-1 whitespace-nowrap"
                >
                  <Save className="w-4 h-4" /> SAVE CONFIG
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Community & Resources */}
        <div className="legacy-panel bg-[#fcfcfc] flex-1 min-w-0 h-fit">
          <div className="bg-[#e1e1e1] px-2 py-1 text-xs font-bold text-[#333] border border-gray-300 mb-3">
            COMMUNITY & RESOURCES
          </div>
          <div className="p-4 flex flex-col gap-3">
            <a
              href="https://discord.gg/9xRHBZWjVK"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded shadow-sm text-xs bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors font-bold"
              style={{ textShadow: 'none', color: 'white' }}
            >
              <MessageCircle className="w-5 h-5" />
              <span>JOIN DISCORD</span>
            </a>

            <a
              href="https://vsky.odoo.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded shadow-sm text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold"
              style={{ textShadow: 'none', color: 'white' }}
            >
              <Globe className="w-5 h-5" />
              <span>VISIT WEBSITE</span>
            </a>

            <div className="text-[10px] text-gray-500 text-center mt-2 p-2 border border-gray-200 bg-gray-50">
              Connect with fellow pilots, check for flight events, and get the latest VA news!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
