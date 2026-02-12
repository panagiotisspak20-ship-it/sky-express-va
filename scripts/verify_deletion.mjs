import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function verifyDeletion() {
    console.log('Verifying deletion of "Sky Corporate"...');
    
    const { data: items, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('name', 'Sky Corporate');
        
    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (items.length === 0) {
        console.log('✅ SUCCESS: Item "Sky Corporate" not found (Deleted).');
    } else {
        console.log('⚠️ Item still exists:', items.length, 'record(s) found.');
        console.log('IDs:', items.map(i => i.id));
    }
}

verifyDeletion();
