import { createClient } from '@supabase/supabase-js'

const url = 'https://nbjxycyomnupheueznfu.supabase.co'
const key = 'sb_publishable_MtOsYqxByfpRBTj4SBP6oQ_iPYGmzfk'
const supabase = createClient(url, key)

async function check() {
  const { data, error } = await supabase
    .from('completed_flights')
    .select('*')
    .eq('delete_requested', true)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Found ${data.length} deletion requests.`)
    console.log(data)
  }
}
check()
