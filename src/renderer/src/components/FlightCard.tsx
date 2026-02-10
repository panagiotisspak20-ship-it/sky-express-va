import { Plane } from 'lucide-react'

interface FlightProps {
  flightNo: string
  origin: string
  destination: string
  depTime: string
  arrTime: string
  aircraft: string
  status: 'Scheduled' | 'Boarding' | 'Departed'
}

export const FlightCard: React.FC<FlightProps> = ({
  flightNo,
  origin,
  destination,
  depTime,
  arrTime,
  aircraft,
  status
}) => {
  return (
    <div className="glass p-5 rounded-xl border border-white/20 hover:border-sky-magenta/50 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Plane className="w-24 h-24 text-sky-navy" />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="bg-sky-navy/10 text-sky-navy px-2 py-1 rounded text-xs font-bold tracking-wider">
            {flightNo}
          </span>
          <h3 className="text-sm text-gray-500 mt-2 font-medium">{aircraft}</h3>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            status === 'Boarding' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {status}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 relative z-10">
        <div className="text-center">
          <p className="text-2xl font-bold text-sky-navy">{origin}</p>
          <p className="text-sm text-gray-500">{depTime}</p>
        </div>

        <div className="flex-1 px-4 flex flex-col items-center">
          <div className="w-full flex items-center gap-2">
            <div className="h-[2px] bg-gray-300 flex-1 relative">
              <div className="absolute w-2 h-2 bg-sky-magenta rounded-full left-0 -top-[3px]"></div>
            </div>
            <Plane className="w-4 h-4 text-sky-magenta rotate-90" />
            <div className="h-[2px] bg-gray-300 flex-1 relative">
              <div className="absolute w-2 h-2 bg-sky-navy rounded-full right-0 -top-[3px]"></div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Direct</p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-sky-navy">{destination}</p>
          <p className="text-sm text-gray-500">{arrTime}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end relative z-10">
        <button
          onClick={() => window.open('https://dispatch.simbrief.com/options/new', '_blank')}
          className="bg-sky-navy text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-sky-magenta transition-colors shadow-md cursor-pointer flex items-center gap-2"
        >
          Book on SimBrief
        </button>
      </div>
    </div>
  )
}
