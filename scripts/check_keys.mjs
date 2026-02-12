import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const keys = [];
    envContent.split('\n').forEach(line => {
        const [key] = line.split('=');
        if (key && key.trim().includes('SUPABASE')) {
            keys.push(key.trim());
        }
    });
    console.log('Available Supabase Keys:', keys);
} catch (e) {
    console.error('Error reading .env:', e.message);
}
