// Shared Sky Express airport database with coordinates
// Used by LiveMap, BookedFlights, and any future airport-aware features

export interface Airport {
  icao: string
  iata: string
  name: string
  city: string
  lat: number
  lng: number
  hub: boolean
}

export const skyExpressAirports: Airport[] = [
  // --- HUBS ---
  { icao: 'LGAV', iata: 'ATH', name: "Athens Int'l", city: 'Athens', lat: 37.9364, lng: 23.9445, hub: true },
  { icao: 'LGTS', iata: 'SKG', name: 'Makedonia', city: 'Thessaloniki', lat: 40.5197, lng: 22.9709, hub: true },
  { icao: 'LGIR', iata: 'HER', name: 'Heraklion', city: 'Heraklion', lat: 35.3397, lng: 25.1803, hub: true },

  // --- INTERNATIONAL ---
  { icao: 'EGKK', iata: 'LGW', name: 'London Gatwick', city: 'London', lat: 51.1481, lng: -0.1903, hub: false },
  { icao: 'LFPG', iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', lat: 49.0097, lng: 2.5479, hub: false },
  { icao: 'LIRF', iata: 'FCO', name: 'Fiumicino', city: 'Rome', lat: 41.8003, lng: 12.2389, hub: false },
  { icao: 'LCLK', iata: 'LCA', name: "Larnaca Int'l", city: 'Larnaca', lat: 34.8754, lng: 33.6249, hub: false },
  { icao: 'EDDF', iata: 'FRA', name: 'Frankfurt', city: 'Frankfurt', lat: 50.0379, lng: 8.5622, hub: false },
  { icao: 'EBBR', iata: 'BRU', name: 'Brussels', city: 'Brussels', lat: 50.901, lng: 4.4856, hub: false },
  { icao: 'EDDM', iata: 'MUC', name: 'Munich', city: 'Munich', lat: 48.3538, lng: 11.7861, hub: false },
  { icao: 'LIMC', iata: 'MXP', name: 'Malpensa', city: 'Milan', lat: 45.6306, lng: 8.7281, hub: false },
  { icao: 'EHAM', iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', lat: 52.3086, lng: 4.7639, hub: false },
  { icao: 'LTFM', iata: 'IST', name: 'Istanbul', city: 'Istanbul', lat: 41.2619, lng: 28.7278, hub: false },

  // --- GREEK ISLANDS & DOMESTIC ---
  { icao: 'LGRP', iata: 'RHO', name: 'Diagoras', city: 'Rhodes', lat: 36.4054, lng: 28.0862, hub: false },
  { icao: 'LGKR', iata: 'CFU', name: 'Ioannis Kapodistrias', city: 'Corfu', lat: 39.6019, lng: 19.9117, hub: false },
  { icao: 'LGSA', iata: 'CHQ', name: "Chania Int'l", city: 'Chania', lat: 35.5317, lng: 24.1497, hub: false },
  { icao: 'LGKO', iata: 'KGS', name: 'Hippocrates', city: 'Kos', lat: 36.7933, lng: 26.9406, hub: false },
  { icao: 'LGSR', iata: 'JTR', name: 'Santorini', city: 'Santorini', lat: 36.3992, lng: 25.4793, hub: false },
  { icao: 'LGMK', iata: 'JMK', name: 'Mykonos', city: 'Mykonos', lat: 37.4351, lng: 25.3481, hub: false },
  { icao: 'LGMT', iata: 'MJT', name: 'Mytilene', city: 'Mytilene', lat: 39.0567, lng: 26.5983, hub: false },
  { icao: 'LGHI', iata: 'JKH', name: 'Chios', city: 'Chios', lat: 38.3432, lng: 26.1406, hub: false },
  { icao: 'LGSM', iata: 'SMI', name: 'Samos', city: 'Samos', lat: 37.69, lng: 26.9117, hub: false },
  { icao: 'LGAL', iata: 'AXD', name: 'Alexandroupolis', city: 'Alexandroupolis', lat: 40.8559, lng: 25.9563, hub: false },
  { icao: 'LGML', iata: 'MLO', name: 'Milos', city: 'Milos', lat: 36.6969, lng: 24.4769, hub: false },
  { icao: 'LGNX', iata: 'JNX', name: 'Naxos', city: 'Naxos', lat: 37.0811, lng: 25.3681, hub: false },
  { icao: 'LGPA', iata: 'PAS', name: 'Paros', city: 'Paros', lat: 37.0103, lng: 25.1281, hub: false },
  { icao: 'LGPL', iata: 'JTY', name: 'Astypalaia', city: 'Astypalaia', lat: 36.58, lng: 26.3756, hub: false },
  { icao: 'LGLR', iata: 'LRA', name: 'Larissa', city: 'Larissa', lat: 39.65, lng: 22.4661, hub: false },
  { icao: 'LGKY', iata: 'KIT', name: 'Kalymnos', city: 'Kalymnos', lat: 36.9633, lng: 26.9419, hub: false },
  { icao: 'LGKP', iata: 'AOK', name: 'Karpathos', city: 'Karpathos', lat: 35.4214, lng: 27.146, hub: false },
  { icao: 'LGKC', iata: 'KZS', name: 'Kythira', city: 'Kythira', lat: 36.2743, lng: 23.017, hub: false },
  { icao: 'LGSY', iata: 'SKU', name: 'Skyros', city: 'Skyros', lat: 38.9676, lng: 24.4872, hub: false },
  { icao: 'LGST', iata: 'JSH', name: 'Sitia', city: 'Sitia', lat: 35.2161, lng: 26.1013, hub: false },
  { icao: 'LGIK', iata: 'JIK', name: 'Ikaria', city: 'Ikaria', lat: 37.6827, lng: 26.3471, hub: false },
  { icao: 'LGLM', iata: 'LXS', name: 'Limnos', city: 'Limnos', lat: 39.9175, lng: 25.2364, hub: false },

  // --- MORE INTERNATIONAL ---
  { icao: 'EDDL', iata: 'DUS', name: 'Düsseldorf', city: 'Düsseldorf', lat: 51.2895, lng: 6.7668, hub: false },
  { icao: 'EDDH', iata: 'HAM', name: 'Hamburg', city: 'Hamburg', lat: 53.6304, lng: 9.9882, hub: false },
  { icao: 'EDDB', iata: 'BER', name: 'Berlin', city: 'Berlin', lat: 52.3622, lng: 13.5007, hub: false },
  { icao: 'EPWA', iata: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', lat: 52.1658, lng: 20.9671, hub: false },
  { icao: 'LOWW', iata: 'VIE', name: "Vienna Int'l", city: 'Vienna', lat: 48.1103, lng: 16.5697, hub: false },
  { icao: 'LFLL', iata: 'LYS', name: 'Saint-Exupéry', city: 'Lyon', lat: 45.7256, lng: 5.0811, hub: false },
  { icao: 'LFML', iata: 'MRS', name: 'Marseille Provence', city: 'Marseille', lat: 43.4367, lng: 5.215, hub: false },
  { icao: 'LFRS', iata: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', lat: 47.1569, lng: -1.6078, hub: false },
  { icao: 'LFQQ', iata: 'LIL', name: 'Lille', city: 'Lesquin', lat: 50.5619, lng: 3.0894, hub: false },
  { icao: 'LEMD', iata: 'MAD', name: 'Adolfo Suárez', city: 'Madrid', lat: 40.4722, lng: -3.5609, hub: false },
  { icao: 'LEIB', iata: 'IBZ', name: 'Ibiza', city: 'Ibiza', lat: 38.8729, lng: 1.3731, hub: false },
  { icao: 'LPPT', iata: 'LIS', name: 'Humberto Delgado', city: 'Lisbon', lat: 38.7742, lng: -9.1342, hub: false },
  { icao: 'LBSF', iata: 'SOF', name: 'Sofia', city: 'Sofia', lat: 42.6952, lng: 23.4085, hub: false },
  { icao: 'LKPR', iata: 'PRG', name: 'Václav Havel', city: 'Prague', lat: 50.1008, lng: 14.26, hub: false },
  { icao: 'LATI', iata: 'TIA', name: "Tirana Int'l", city: 'Tirana', lat: 41.4147, lng: 19.7206, hub: false }
]

// --- Lookup Helpers ---

/** Haversine distance in nautical miles */
export function haversineNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Find airport by ICAO code */
export function getAirportByICAO(icao: string): Airport | undefined {
  return skyExpressAirports.find((a) => a.icao === icao.toUpperCase().trim())
}

/** Find airport by IATA code */
export function getAirportByIATA(iata: string): Airport | undefined {
  return skyExpressAirports.find((a) => a.iata === iata.toUpperCase().trim())
}

/** Find the nearest network airport within a given radius (NM). Returns null if none found. */
export function findNearestAirport(
  lat: number,
  lon: number,
  maxRadiusNM: number = 5
): { airport: Airport; distanceNM: number } | null {
  let closest: { airport: Airport; distanceNM: number } | null = null

  for (const airport of skyExpressAirports) {
    const dist = haversineNM(lat, lon, airport.lat, airport.lng)
    if (dist <= maxRadiusNM && (!closest || dist < closest.distanceNM)) {
      closest = { airport, distanceNM: dist }
    }
  }

  return closest
}
