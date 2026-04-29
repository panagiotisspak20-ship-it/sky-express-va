import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle, Map as MapIcon, Activity, ArrowRight, Plane, Trophy, TrendingDown, Clock, BarChart2 } from 'lucide-react'
import { DataService } from '../services/dataService'
import { SkyLoader } from '../components/ui/SkyLoader'
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { motion } from 'framer-motion'
import { pageVariants, staggerContainer, fadeInUp, slideDown } from '../utils/animations'

// Fix generic Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

export const PirepDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pirep, setPirep] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadPirep(id)
  }, [id])

  const loadPirep = async (flightId: string) => {
    setLoading(true)
    try {
      const data = await DataService.getPirep(flightId)
      setPirep(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getGradeStyle = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-emerald-500/20'
    if (grade === 'B') return 'text-blue-700 bg-blue-50 border-blue-200 shadow-blue-500/20'
    if (grade === 'C') return 'text-amber-700 bg-amber-50 border-amber-200 shadow-amber-500/20'
    return 'text-rose-700 bg-rose-50 border-rose-200 shadow-rose-500/20'
  }

  if (loading)
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/50">
        <SkyLoader text="Loading Report..." />
      </div>
    )
  if (!pirep) return <div className="p-4 text-center text-red-500">Report not found.</div>

  const evts = pirep.flight_events || []
  const flightPath = pirep.flight_path || []
  const landingData = pirep.landing_data || []

  // Prepare Map Data
  const polylinePositions = flightPath.map((p: any) => [p.lat, p.lng])
  const departurePos = polylinePositions.length > 0 ? polylinePositions[0] : null
  const arrivalPos =
    polylinePositions.length > 0 ? polylinePositions[polylinePositions.length - 1] : null

  // Prepare Landing Chart Data
  const chartData = landingData
    .filter((d: any) => d.alt <= 500)
    .sort((a: any, b: any) => b.alt - a.alt) // Descending altitude

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="p-6 xl:p-8 font-sans bg-slate-50/50 h-full overflow-y-auto"
    >
      {/* Header */}
      <motion.div variants={slideDown} className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/pireps')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Logs
        </button>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">ID: {pirep.id.split('-')[0]}</span>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6 pb-8"
      >
        {/* Top Summary Card */}
        <motion.div
          variants={fadeInUp}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm border-2 ${getGradeStyle(pirep.grade)}`}>
               {pirep.grade || 'A'}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Flight {pirep.flight_number}</h1>
              <div className="flex items-center flex-wrap gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 shadow-sm">
                  {pirep.departure_icao} <ArrowRight className="w-3 h-3 text-blue-500" /> {pirep.arrival_icao}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1"><Plane className="w-3 h-3 text-slate-400"/> {pirep.aircraft_type}</span>
                <span>•</span>
                <span>{new Date(pirep.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric'})}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full md:w-auto overflow-x-auto">
            <div className="pr-6 border-r border-slate-200 flex flex-col items-center justify-center">
              <div className="text-2xl font-black text-indigo-600 leading-none mb-1">{pirep.score}</div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1"><Trophy className="w-3 h-3 text-indigo-400"/> Score</div>
            </div>
            <div className="pr-6 border-r border-slate-200 flex flex-col items-center justify-center">
              <div
                className={`text-2xl font-black leading-none mb-1 ${Math.abs(pirep.landing_rate) < 200 ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {Math.round(pirep.landing_rate)}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1"><TrendingDown className="w-3 h-3 text-emerald-400"/> Landing FPM</div>
            </div>
            <div className="flex flex-col items-center justify-center pl-2 pr-2">
              <div className="text-2xl font-black text-blue-600 leading-none mb-1">{pirep.flight_time}<span className="text-sm ml-0.5">m</span></div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400"/> Duration</div>
            </div>
          </div>
        </motion.div>

        {/* FLIGHT MAP */}
        <motion.div
          variants={fadeInUp}
          className="bg-white p-2 rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-[340px] relative z-0 flex flex-col"
        >
          <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase text-slate-700 shadow-lg border border-white/50 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-blue-600" /> Flight Path
          </div>
          {polylinePositions.length > 0 ? (
            <div className="h-full w-full rounded-2xl overflow-hidden relative">
              <MapContainer
                bounds={L.latLngBounds(polylinePositions)}
                className="h-full w-full absolute inset-0 z-0"
                zoom={5}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
                <Polyline positions={polylinePositions} color="#3b82f6" weight={4} opacity={0.8} />
                {departurePos && <Marker position={departurePos} />}
                {arrivalPos && <Marker position={arrivalPos} />}
              </MapContainer>
            </div>
          ) : (
            <div className="h-full w-full rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-400">
              <MapIcon className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold text-slate-500 tracking-tight text-lg">No Flight Path Data</p>
              <p className="text-xs font-medium mt-1">Telemetry was not recorded for this flight.</p>
            </div>
          )}
        </motion.div>

        {/* LANDING ANALYSIS CHART */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-4 h-4" /></div>
            Landing Analysis (Last 500ft)
          </h3>
          {chartData.length > 0 ? (
            <>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="alt"
                      type="number"
                      reversed={true}
                      domain={[0, 500]}
                      label={{
                        value: 'Altitude (ft AGL)',
                        position: 'insideBottomRight',
                        offset: -5,
                        fontSize: 10,
                        fontWeight: 'bold',
                        fill: '#94a3b8'
                      }}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickMargin={8}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      label={{
                        value: 'Vertical Speed (fpm)',
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fill: '#94a3b8',
                        offset: 10
                      }}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      domain={['auto', 'auto']}
                      tickMargin={8}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      labelFormatter={(value) => `${value} ft`}
                    />
                    <ReferenceLine
                      y={-100}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{ value: 'Soft', fontSize: 10, fill: '#10b981', fontWeight: 'bold' }}
                    />
                    <ReferenceLine
                      y={-600}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: 'Hard', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vs"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      name="Vertical Speed"
                    />
                    <Line
                      type="monotone"
                      dataKey="g"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="right"
                      name="G-Force"
                    />
                    <YAxis yAxisId="right" orientation="right" domain={[0.5, 2.0]} hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-4 font-bold flex items-center justify-center gap-1 uppercase tracking-widest">
                * Chart shows vertical speed vs altitude from 500ft AGL to touchdown.
              </p>
            </>
          ) : (
            <div className="h-72 w-full rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-400">
              <Activity className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold text-slate-500 tracking-tight text-lg">No Landing Telemetry</p>
              <p className="text-xs font-medium mt-1">Landing data was not recorded for this flight.</p>
            </div>
          )}
        </motion.div>

        {/* Breakdown Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Penalties & Events */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-100 p-4 px-6 flex justify-between items-center">
              <span className="text-xs font-black text-slate-700 flex items-center gap-2 tracking-widest uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Flight Events & Penalties
              </span>
              <span className="text-xs font-black bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg">
                -{100 - pirep.score} pts
              </span>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {evts.length === 0 && (
                <div className="text-center text-slate-400 py-8 flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                     <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <span className="font-bold text-slate-600 text-lg">Perfect Flight!</span>
                  <span className="text-sm">No penalties recorded.</span>
                </div>
              )}
              {evts.map((e: any, i: number) => (
                <div
                  key={i}
                  className="flex gap-4 text-sm border-b border-slate-100 pb-4 last:border-0 relative items-start"
                >
                  <div className="bg-slate-100 px-2 flex-shrink-0 text-slate-500 font-mono text-[10px] rounded border border-slate-200 font-bold mt-1">
                    {new Date(e.time).toLocaleTimeString()}
                  </div>
                  <div className="flex-1 mt-0.5">
                    <p className={`font-bold leading-snug ${e.penalty > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {e.description || e.message}
                    </p>
                  </div>
                  {e.penalty > 0 && <div className="font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-100">-{e.penalty}</div>}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Flight Stats */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xs font-black text-slate-700 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-widest">
                 <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><BarChart2 className="w-4 h-4" /></div>
                 Flight Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                <div className="flex flex-col gap-1 border border-slate-100 p-3 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Max Bank Angle</span>
                  <span
                    className={`font-mono font-bold text-lg leading-none ${((pirep.flight_data?.systemStats?.maxBankAngle || pirep.system_stats?.maxBankAngle) || 0) > 30 ? 'text-orange-600' : 'text-emerald-600'}`}
                  >
                    {Math.round((pirep.flight_data?.systemStats?.maxBankAngle || pirep.system_stats?.maxBankAngle) || 0)}°
                  </span>
                </div>
                <div className="flex flex-col gap-1 border border-slate-100 p-3 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Max G-Force</span>
                  <span className="font-mono font-bold text-lg leading-none text-blue-600">{((pirep.flight_data?.systemStats?.maxG || pirep.system_stats?.maxG) || 1).toFixed(2)} <span className="text-xs text-slate-400 font-sans">G</span></span>
                </div>
                <div className="flex flex-col gap-1 border border-slate-100 p-3 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Fuel Used</span>
                  <span className="font-mono font-bold text-lg leading-none text-slate-700">
                    {pirep.flight_data?.fuelUsed ? `${pirep.flight_data.fuelUsed} kg` : '---'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border border-slate-100 p-3 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Distance</span>
                  <span className="font-mono font-bold text-lg leading-none text-slate-700">{Math.round(pirep.distanceFlown || pirep.distance || 0)} nm</span>
                </div>
                <div className="flex items-center justify-between col-span-2 border border-emerald-100 bg-emerald-50/50 p-4 rounded-xl mt-1">
                  <span className="text-xs font-black tracking-widest uppercase text-emerald-600">Revenue Generated</span>
                  <span className="font-black text-xl text-emerald-700">€{pirep.revenue}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Evaluation Grade</span>
              <span
                className={`text-7xl font-black ${getGradeStyle(pirep.grade)} bg-clip-text text-transparent bg-gradient-to-br from-current to-slate-900/10 drop-shadow-sm leading-none`}
              >
                {pirep.grade || 'A'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
