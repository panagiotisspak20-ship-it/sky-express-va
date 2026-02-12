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

async function debugAndFix() {
    console.log('Searching for "Sky Corporate"...');
    
    // List all backgrounds to find the right one
    const { data: items, error: listError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('type', 'background');
        
    if (listError) {
        console.error('List error:', listError);
        return;
    }

    const skyCorp = items.find(i => i.name === 'Sky Corporate' || i.name.includes('Corporate'));
    console.log('Found item:', skyCorp);

    if (skyCorp) {
        console.log('Updating item ID:', skyCorp.id);
        const newClass = 'bg-gradient-to-br from-[#003366] to-[#0f172a] text-white shadow-inner';
        
        const { data: updateData, error: updateError } = await supabase
            .from('shop_items')
            .update({ css_class: newClass })
            .eq('id', skyCorp.id)
            .select();
            
        if (updateError) {
            console.error('Update error:', updateError);
        } else {
            console.log('Update success:', updateData);
        }
    } else {
        console.error('Sky Corporate item not found!');
    }
}

debugAndFix();
