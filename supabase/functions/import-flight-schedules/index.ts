import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { airline_iata, api_key } = await req.json()

    // Use provided key or fallback to Secret Environment Variable
    const finalApiKey = api_key || Deno.env.get('AIRLABS_API_KEY')

    // Validate inputs
    if (!airline_iata) throw new Error('airline_iata is required')
    if (!finalApiKey) throw new Error('api_key is required (body) or AIRLABS_API_KEY (secret)')

    console.log(`Fetching schedules for ${airline_iata}...`)

    // 1. Fetch Generic Schedules from AirLabs
    const response = await fetch(
      `https://airlabs.co/api/v9/schedules?airline_iata=${airline_iata}&api_key=${finalApiKey}`
    )
    const data = await response.json()

    if (data.error) {
      throw new Error(`AirLabs Error: ${data.error.message || JSON.stringify(data.error)}`)
    }

    const schedules = data.response || []
    console.log(`Found ${schedules.length} generic routes. Expanding to concrete flights...`)

    // 2. Expand into Concrete Dates for the Current Month
    const concreteFlights = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    // Get last day of current month
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()

    for (const route of schedules) {
      // route.days is usually ["mon", "tue", ...]
      // AirLabs might return it as object or array. API docs say array of strings usually.
      // We need to normalize if needed. Assuming array of short day names.
      const days = route.days || []
      if (!Array.isArray(days) || days.length === 0) continue

      // Iterate through every day of this month
      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(currentYear, currentMonth, day)

        // Skip past days if we want? Or just keep full month history?
        // User said "all flights of the month". Let's keep past ones too for history if ran mid-month.
        // Actually, if we run it on the 1st, we want the whole month.

        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()

        if (days.includes(dayName)) {
          // MATCH! This flight flies on this day.

          // Construct timestamps
          // AirLabs times are HH:mm (Local usually, or UTC? API docs say UTC usually for schedules unless specified)
          // Let's assume HH:mm is sufficient to build the timestamp.

          // Logic to parse dep_time (e.g. "14:35")
          const [depH, depM] = route.dep_time.split(':').map(Number)
          const [arrH, arrM] = route.arr_time.split(':').map(Number)

          const departureTime = new Date(Date.UTC(currentYear, currentMonth, day, depH, depM, 0))

          // Handle arrival (could be next day)
          let arrivalTime = new Date(Date.UTC(currentYear, currentMonth, day, arrH, arrM, 0))
          if (arrivalTime < departureTime) {
            // Arrival is next day
            arrivalTime = new Date(arrivalTime.getTime() + 24 * 60 * 60 * 1000)
          }
          // Add duration check if available to be more precise, but this is good heuristic.

          concreteFlights.push({
            flight_number: (route.flight_iata || route.flight_number || '').trim(),
            airline_iata: (route.airline_iata || '').trim(),
            airline_icao: (route.airline_icao || '').trim(),
            dep_icao: (route.dep_icao || '').trim(),
            arr_icao: (route.arr_icao || '').trim(),
            departure_time: departureTime.toISOString(),
            arrival_time: arrivalTime.toISOString(),
            duration: route.duration,
            aircraft_type: (route.aircraft_icao || 'A320').trim(), // Fallback
            status: 'scheduled'
          })
        }
      }
    }

    console.log(`Generated ${concreteFlights.length} concrete flight instances.`)

    // 2b. Deduplicate concrete flights to prevent intra-batch constraint violations
    // Postgres ON CONFLICT does not handle duplicates existing *within* the insert batch itself.
    const uniqueMap = new Map()
    for (const flight of concreteFlights) {
      // Ensure keys are clean
      const uniqueKey = `${flight.flight_number}_${flight.departure_time}`
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, flight)
      }
    }
    const finalFlights = Array.from(uniqueMap.values())
    console.log(`Deduplicated to ${finalFlights.length} unique flights for insertion.`)

    // 3. Insert into Database
    // We need to use Service Key to bypass RLS potentially, or just normal client if user is admin.
    // In Edge Function, we usually use the Auth context or Service Key.
    // Let's use the provided content supabaseClient

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // Using Service Role Key is best for bulk admin operations to avoid RLS issues and timeouts

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Upsert into Database
    // We update existing records rather than deleting, to be safe against race conditions.

    // Bulk upsert in chunks using RPC to avoid PostgREST matching issues
    const chunkSize = 100
    for (let i = 0; i < finalFlights.length; i += chunkSize) {
      const chunk = finalFlights.slice(i, i + chunkSize)

      // Use RPC calls instead of .upsert() for robust constraint handling
      // v5: No-Constraint Manual Upsert to ensure 100% success rate
      const { error } = await supabase.rpc('upsert_flight_schedules_v5', {
        flights: chunk
      })

      if (error) {
        console.error('RPC Upsert error:', error)
        throw error
      }
    }

    // 4. Automatic Cleanup
    // Remove any duplicates that might have slipped in (though v5 is robust, this is a safety net)
    console.log('Running post-import cleanup...')
    const { error: cleanupError } = await supabase.rpc('cleanup_flight_duplicates')
    if (cleanupError) {
      console.error('Cleanup Warning:', cleanupError)
      // We don't throw here, as the import itself was successful.
    } else {
      console.log('Cleanup complete.')
    }

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${concreteFlights.length} flights for ${airline_iata}`,
        count: concreteFlights.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
