import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('completed_flights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) {
    console.error('Error:', error)
  } else if (data && data.length > 0) {
    console.log('Flight Data JSONB:', JSON.stringify(data[0].flight_data, null, 2))
    console.log('Main columns max speed:', data[0].max_speed)
    console.log('Main columns max alt:', data[0].max_altitude)
  }
}
check()
