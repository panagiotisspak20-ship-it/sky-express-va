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

async function check() {
    const { data, error } = await supabase
        .from('shop_items')
        .select('name, css_class')
        .eq('name', 'Sky Corporate');
    
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

check();
