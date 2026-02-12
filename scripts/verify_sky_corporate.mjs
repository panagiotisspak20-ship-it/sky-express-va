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

async function verifyUpdate() {
    console.log('Verifying Sky Corporate background...');
    
    // Fetch the item by exact name
    const { data: items, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('name', 'Sky Corporate');
        
    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (items && items.length > 0) {
        const item = items[0];
        console.log('Current CSS Class:', item.css_class);
        
        // Updated expected value for high contrast
        const expected = 'bg-gradient-to-br from-[#0052cc] to-[#020617] text-white shadow-inner';
        
        if (item.css_class === expected) {
            console.log('✅ SUCCESS: High-contrast gradient verified.');
        } else {
            console.log('❌ FAILURE: Class does not match.');
            console.log('Expected:', expected);
            console.log('Actual:  ', item.css_class);
        }
    } else {
        console.error('Item not found! Did you run the insert script?');
    }
}

verifyUpdate();
