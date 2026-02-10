import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataService } from '../services/dataService'
import { Plane } from 'lucide-react'
import logo from '../assets/logo.png'

export const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const result = await DataService.login(email, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Invalid Email or Password')
      }
    } catch (err) {
      setError('Login failed. System error.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] via-[#2c5282] to-[#1a365d] flex items-center justify-center font-tahoma">
      <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden">
        {/* Header with Logo */}
        <div className="bg-white p-6 border-b-4 border-[#d63384] flex flex-col items-center">
          <img src={logo} alt="Sky Express" className="w-32 h-auto mb-3" />
          <h1 className="text-xl font-bold text-[#1a365d]">Virtual Airline</h1>
          <p className="text-xs text-gray-500 mt-1">ACARS Portal Login</p>
        </div>

        <div className="p-6 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center gap-3 mb-5 p-3 bg-pink-50 rounded border border-pink-200">
            <Plane className="w-6 h-6 text-[#d63384]" />
            <p className="text-sm text-gray-600">
              Enter your pilot credentials to access flight operations.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1a365d] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-[#d63384] focus:ring-2 focus:ring-pink-200 transition-all"
                placeholder="pilot@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1a365d] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-[#d63384] focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-3 py-2 rounded text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="flex-1 px-4 py-2 bg-white border-2 border-[#1a365d] text-[#1a365d] font-bold rounded hover:bg-slate-50 transition-colors"
              >
                Register
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#d63384] to-[#c02578] text-white font-bold rounded hover:from-[#c02578] hover:to-[#a91d65] shadow-md transition-all"
              >
                LOGIN
              </button>
            </div>
          </form>
        </div>

        {/* Disclaimer */}
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <p className="text-[10px] text-gray-500 text-center leading-tight">
            We are <strong>NOT</strong> affiliated with, endorsed by, or connected to the real-world
            Sky Express airline. All content is for virtual aviation use only.
          </p>
        </div>
      </div>
    </div>
  )
}
