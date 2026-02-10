import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataService } from '../services/dataService'
import { UserPlus, RefreshCw } from 'lucide-react'

export const Register = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [homeBase, setHomeBase] = useState('LGAV')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [customCallsign, setCustomCallsign] = useState('SEH')
  const [callsignError, setCallsignError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const validateCallsign = async (value: string) => {
    const regex = /^SEH\d{4}$/
    if (!regex.test(value)) {
      setCallsignError('Must be SEH + 4 digits (e.g. SEH1234)')
      return false
    }

    try {
      const available = await DataService.checkCallsignAvailable(value)
      if (!available) {
        setCallsignError('Callsign is already taken.')
        return false
      }
    } catch (err) {
      console.error('Error checking callsign:', err)
      // Allow proceeding if check fails? Or block? Better to block or show error.
      setCallsignError('Error checking availability.')
      return false
    }

    setCallsignError(null)
    return true
  }

  const handleCallsignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    if (val.length <= 7) {
      setCustomCallsign(val)
      if (val.length === 7) {
        validateCallsign(val)
      } else {
        setCallsignError(null) // Clear while typing
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    // Validation
    if (!name || !password || !confirmPassword) {
      setGeneralError('Please fill in all required fields.')
      return
    }

    if (password !== confirmPassword) {
      setGeneralError('Passwords do not match.')
      return
    }

    const isValid = await validateCallsign(customCallsign)
    if (!isValid) return

    // Check Admin Code
    let isAdmin = false
    if (adminCode) {
      if (adminCode === '1ds343423kj4h') {
        isAdmin = true
      } else {
        setGeneralError('Invalid Administrator Code.')
        return
      }
    }

    setLoading(true)

    try {
      // Register user
      await DataService.register({
        callsign: customCallsign,
        name,
        email,
        homeBase: homeBase as any,
        password,
        isAdmin // Pass admin flag
      })
      setRegistrationSuccess(true)
    } catch (error: any) {
      console.error('Registration failed:', error)
      setGeneralError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const confirmRegistration = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#3a6ea5] flex items-center justify-center font-tahoma text-[11px]">
      <div className="bg-[#f0f0f0] border-2 border-white border-r-gray-500 border-b-gray-500 shadow-xl w-96 p-1">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-2 py-1 font-bold flex justify-between items-center mb-3">
          <span>New Pilot Application</span>
          <button
            onClick={() => navigate('/login')}
            className="w-4 h-4 bg-[#c0c0c0] text-black font-bold leading-none border border-white border-b-gray-600 border-r-gray-600"
          >
            X
          </button>
        </div>

        {!registrationSuccess ? (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white border border-gray-400 p-1 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-blue-800" strokeWidth={1.5} />
              </div>
              <div className="text-[#333]">
                <p className="mb-2">Complete the form below to join Sky Express VA.</p>
                <p className="italic text-gray-500">Choose your unique callsign.</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Callsign Input */}
              <div className="grid grid-cols-3 items-start gap-2">
                <label className="text-right font-bold text-[#333] pt-1">Callsign:</label>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={customCallsign}
                    onChange={handleCallsignChange}
                    className={`w-full border-2 ${callsignError ? 'border-red-500 bg-red-50' : 'border-gray-400 border-r-white border-b-white bg-white'} px-1 py-0.5 outline-none font-mono font-bold uppercase`}
                    placeholder="SEHxxxx"
                    maxLength={7}
                  />
                  {callsignError && (
                    <div className="text-[10px] text-red-600 mt-1">{callsignError}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-bold text-[#333]">Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-2 border-2 border-gray-400 border-r-white border-b-white bg-white px-1 py-0.5 outline-none focus:bg-yellow-50 uppercase"
                  placeholder="JOHN DOE"
                  required
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-bold text-[#333]">Home Base:</label>
                <select
                  value={homeBase}
                  onChange={(e) => setHomeBase(e.target.value)}
                  className="col-span-2 border-2 border-gray-400 border-r-white border-b-white bg-white px-1 py-0.5 outline-none focus:bg-yellow-50"
                >
                  <option value="LGAV">Athens (LGAV)</option>
                  <option value="LGHER">Heraklion (LGHER)</option>
                  <option value="LGTS">Thessaloniki (LGTS)</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-bold text-[#333]">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-2 border-2 border-gray-400 border-r-white border-b-white bg-white px-1 py-0.5 outline-none focus:bg-yellow-50"
                  placeholder="pilot@example.com"
                  required
                />
              </div>

              {/* Password Section */}
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-bold text-[#333]">Password:</label>
                <div className="col-span-2 flex gap-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-400 border-r-white border-b-white bg-white px-1 py-0.5 outline-none focus:bg-yellow-50"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-2 bg-gray-200 border border-gray-400 text-[9px] font-bold text-gray-700"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-bold text-[#333]">Confirm:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="col-span-2 border-2 border-gray-400 border-r-white border-b-white bg-white px-1 py-0.5 outline-none focus:bg-yellow-50"
                  required
                  placeholder="Confirm Password"
                />
              </div>

              {/* Admin Code Section */}
              <div className="grid grid-cols-3 items-center gap-2 pt-2 border-t border-gray-300 border-dashed">
                <label className="text-right font-bold text-purple-800">Admin Code:</label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="col-span-2 border-2 border-purple-200 border-r-white border-b-white bg-purple-50 px-1 py-0.5 outline-none focus:bg-purple-100"
                  placeholder="Optional (For Staff)"
                />
              </div>

              {generalError && (
                <div className="text-red-600 text-xs font-bold text-center bg-red-100 p-1 border border-red-300 mb-2">
                  {generalError}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-3 py-1 bg-[#e1e1e1] border border-gray-400 border-b-gray-600 border-r-gray-600 hover:bg-[#eaeaea] active:border-t-gray-600 active:border-l-gray-600 active:border-white active:bg-[#d0d0d0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !!callsignError}
                  className="px-3 py-1 bg-[#e1e1e1] border border-black border-b-gray-600 border-r-gray-600 hover:bg-[#eaeaea] active:border-t-gray-600 active:border-l-gray-600 active:border-white active:bg-[#d0d0d0] font-bold border-2 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <RefreshCw className="w-3 h-3 animate-spin" />} Submit Application
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="px-4 pb-4 text-center">
            <div className="bg-green-100 border border-green-500 p-4 mb-4 shadow-inner">
              <h3 className="text-sm font-bold text-green-800 mb-2">APPLICATION APPROVED</h3>
              <p className="mb-2 text-[#333]">Welcome aboard, Captain!</p>
              <div className="text-2xl font-mono font-bold text-blue-900 border-2 border-gray-400 bg-white inline-block px-4 py-2">
                {customCallsign}
              </div>
              <p className="mt-2 text-xs text-gray-600">Please use this callsign to login.</p>
            </div>
            <button
              onClick={confirmRegistration}
              className="w-full px-3 py-2 bg-[#e1e1e1] border border-black border-b-gray-600 border-r-gray-600 hover:bg-[#eaeaea] active:border-t-gray-600 active:border-l-gray-600 active:border-white active:bg-[#d0d0d0] font-bold border-2"
            >
              PROCEED TO LOGIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
