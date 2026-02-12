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

async function fixBranding() {
    console.log('Updating Sky Corporate background...');
    
    // Using Hex codes to be 100% sure the gradient renders correctly
    const newClass = 'bg-gradient-to-br from-[#003366] to-[#0f172a] text-white shadow-inner';

    const { data, error } = await supabase
        .from('shop_items')
        .update({ css_class: newClass })
        .eq('name', 'Sky Corporate')
        .select();

    if (error) {
        console.error('Error updating:', error);
    } else {
        console.log('Update success!', data);
    }
}

fixBranding();
