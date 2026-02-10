// Schedule Validator - Ensures only authentic Sky Express flight data is imported

export interface FlightRow {
  flight_number: string
  origin: string
  destination: string
  departure_time: string
  arrival_time?: string
  aircraft?: string
  days?: string // e.g., "MTWTFSS" or "1234567"
}

export interface ValidationResult {
  valid: boolean
  validRows: FlightRow[]
  errors: string[]
  warnings: string[]
  rejectedCount: number
  acceptedCount: number
}

// Sky Express IATA/ICAO codes
const SKY_EXPRESS_PREFIXES = ['GQ', 'SEH']

// Known Sky Express network airports (IATA codes)
const SKY_EXPRESS_AIRPORTS = new Set([
  // Greek Mainland
  'ATH',
  'LGAV', // Athens
  'SKG',
  'LGTS', // Thessaloniki

  // Greek Islands - Cyclades
  'JTR',
  'LGSR', // Santorini
  'JMK',
  'LGMK', // Mykonos
  'JNX',
  'LGNX', // Naxos
  'PAS',
  'LGPA', // Paros
  'MLO',
  'LGML', // Milos
  'JSY',
  'LGSO', // Syros

  // Greek Islands - Crete
  'HER',
  'LGIR', // Heraklion
  'CHQ',
  'LGSA', // Chania
  'JSH',
  'LGST', // Sitia

  // Greek Islands - Dodecanese
  'RHO',
  'LGRP', // Rhodes
  'KGS',
  'LGKO', // Kos
  'JKL',
  'LGKL', // Kalymnos
  'LRS',
  'LGLE', // Leros
  'JTY',
  'LGKY', // Astypalea
  'KZS',
  'LGKS', // Kastelorizo

  // Greek Islands - Ionian
  'CFU',
  'LGKR', // Corfu
  'ZTH',
  'LGZA', // Zakynthos
  'EFL',
  'LGKF', // Kefalonia
  'PVK',
  'LGPZ', // Preveza/Aktion

  // Greek Islands - North Aegean
  'LXS',
  'LGLM', // Limnos
  'JIK',
  'LGIK', // Ikaria
  'SMI',
  'LGSM', // Samos
  'JKH',
  'LGHI', // Chios
  'MJT',
  'LGMT', // Mytilene/Lesvos
  'SKU',
  'LGSK', // Skiathos

  // International
  'LHR',
  'EGLL', // London Heathrow
  'CDG',
  'LFPG', // Paris CDG
  'FRA',
  'EDDF', // Frankfurt
  'LCA',
  'LCLK', // Larnaca
  'BRU',
  'EBBR', // Brussels
  'TLV',
  'LLBG' // Tel Aviv
])

// Valid Sky Express aircraft types
const VALID_AIRCRAFT = [
  'ATR 42',
  'ATR42',
  'ATR-42',
  'ATR 72',
  'ATR72',
  'ATR-72',
  'A320',
  'A320neo',
  'A320-200',
  'A321',
  'A321neo',
  'A321-200',
  'AIRBUS A320',
  'AIRBUS A321'
]

/**
 * Validates if a flight number belongs to Sky Express
 */
export const isValidSkyExpressFlightNumber = (flightNumber: string): boolean => {
  if (!flightNumber) return false
  const normalized = flightNumber.toUpperCase().trim()
  return SKY_EXPRESS_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

/**
 * Checks if an airport is in the Sky Express network
 */
export const isKnownAirport = (code: string): boolean => {
  if (!code) return false
  return SKY_EXPRESS_AIRPORTS.has(code.toUpperCase().trim())
}

/**
 * Validates aircraft type
 */
export const isValidAircraft = (aircraft: string): boolean => {
  if (!aircraft) return true // Optional field
  const normalized = aircraft.toUpperCase().trim()
  return VALID_AIRCRAFT.some((type) => normalized.includes(type.toUpperCase()))
}

/**
 * Parses CSV content into flight rows
 */
export const parseCSV = (content: string): FlightRow[] => {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
  if (lines.length < 2) return [] // Need header + at least one row

  const headers = lines[0]
    .toLowerCase()
    .split(',')
    .map((h) => h.trim())
  const rows: FlightRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: any = {}

    headers.forEach((header, idx) => {
      // Normalize common header variations
      const normalizedHeader = header
        .replace('flight_no', 'flight_number')
        .replace('flightno', 'flight_number')
        .replace('dep_time', 'departure_time')
        .replace('arr_time', 'arrival_time')
        .replace('dep', 'origin')
        .replace('arr', 'destination')
        .replace('dest', 'destination')

      row[normalizedHeader] = values[idx] || ''
    })

    if (row.flight_number) {
      rows.push(row as FlightRow)
    }
  }

  return rows
}

/**
 * Main validation function - validates imported flight schedule
 */
export const validateSchedule = (csvContent: string): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    validRows: [],
    errors: [],
    warnings: [],
    rejectedCount: 0,
    acceptedCount: 0
  }

  const rows = parseCSV(csvContent)

  if (rows.length === 0) {
    result.valid = false
    result.errors.push('No valid data found in CSV file. Please check the file format.')
    return result
  }

  let hasNonSkyExpressFlights = false

  rows.forEach((row, index) => {
    const lineNum = index + 2 // Account for header and 0-index

    // CRITICAL: Check flight number prefix
    if (!isValidSkyExpressFlightNumber(row.flight_number)) {
      result.errors.push(
        `Line ${lineNum}: Flight "${row.flight_number}" is NOT a Sky Express flight (must start with GQ or SEH). REJECTED.`
      )
      result.rejectedCount++
      hasNonSkyExpressFlights = true
      return // Skip this row
    }

    // Check required fields
    if (!row.origin || !row.destination || !row.departure_time) {
      result.errors.push(
        `Line ${lineNum}: Missing required field (origin, destination, or departure_time). REJECTED.`
      )
      result.rejectedCount++
      return
    }

    // Warnings for airports not in known network (but still accept)
    if (!isKnownAirport(row.origin)) {
      result.warnings.push(
        `Line ${lineNum}: Origin "${row.origin}" not recognized in Sky Express network.`
      )
    }
    if (!isKnownAirport(row.destination)) {
      result.warnings.push(
        `Line ${lineNum}: Destination "${row.destination}" not recognized in Sky Express network.`
      )
    }

    // Warning for unknown aircraft
    if (row.aircraft && !isValidAircraft(row.aircraft)) {
      result.warnings.push(
        `Line ${lineNum}: Aircraft "${row.aircraft}" not typical for Sky Express fleet.`
      )
    }

    // Valid row - add to results
    result.validRows.push(row)
    result.acceptedCount++
  })

  // Set overall validity
  if (hasNonSkyExpressFlights) {
    result.valid = result.acceptedCount > 0 // Partial success if some valid rows
  }

  if (result.acceptedCount === 0) {
    result.valid = false
    result.errors.push('No valid Sky Express flights found in the imported file.')
  }

  return result
}

/**
 * Get validation summary message
 */
export const getValidationSummary = (result: ValidationResult): string => {
  if (!result.valid && result.acceptedCount === 0) {
    return '❌ Import Failed: No valid Sky Express flights found.'
  }
  if (result.rejectedCount > 0) {
    return `⚠️ Partial Import: ${result.acceptedCount} flights imported, ${result.rejectedCount} rejected (non-Sky Express).`
  }
  return `✅ Import Successful: ${result.acceptedCount} Sky Express flights imported.`
}
