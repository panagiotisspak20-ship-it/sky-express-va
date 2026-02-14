
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Try to load .env from project root
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProfile() {
    console.log('--- Debugging Profile Access ---')
    console.log('Target Callsign: SEH0001')

    // 1. Try to find the profile by callsign (to get the ID)
    const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('callsign', 'SEH0001')
    
    if (searchError) {
        console.error('Error searching for SEH0001:', searchError)
        return
    }

    if (!profiles || profiles.length === 0) {
        console.error('❌ SEH0001 profile NOT found in "profiles" table with anon key.')
        console.log('Possible causes: RLS blocking listing, or profile does not exist.')
        return
    }

    const profile = profiles[0]
    console.log('✅ Found Profile:', profile)
    console.log('Profile ID:', profile.id)

    // 2. Simulate the exact query used in DataService
    console.log('\n--- Simulating DataService Query ---')
    // We can't easily simulate "eq('id', user.id)" because we don't have the user's auth session here.
    // But we can verify the profile *can* be fetched by ID.

    const { data: fetchedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('callsign, rank, avatar_url')
        .eq('id', profile.id)
        .single()
    
    if (fetchError) {
        console.error('❌ Error fetching single profile by ID:', fetchError)
    } else {
        console.log('✅ Successfully fetched single profile by ID:', fetchedProfile)
    }
}

debugProfile()
