import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Keys!')
  process.exit(1)
}

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})

console.log('Initializing Channel...')
const channel = supabase.channel('room_debug_test', {
    config: {
        presence: {
            key: 'debug-user-' + Math.random().toString(36).substring(7)
        }
    }
})

channel
    .on('presence', { event: 'sync' }, () => {
        console.log('✅ PRESENCE SYNCED! Connection Successful.')
        const state = channel.presenceState()
        console.log('Current State:', state)
        process.exit(0)
    })
    .subscribe((status, err) => {
        console.log(`Status Changed: ${status}`)
        if (status === 'SUBSCRIBED') {
            console.log('Subscribed! Tracking presence...')
            channel.track({ status: 'online', specific_test: true })
        }
        if (status === 'CHANNEL_ERROR') {
            console.error('❌ CHANNEL ERROR:', err)
        }
        if (status === 'TIMED_OUT') {
            console.error('❌ TIMED OUT')
        }
    })

// Timeout after 10 seconds
setTimeout(() => {
    console.log('⚠️ Test Timeout (10s)')
    process.exit(1)
}, 10000)
