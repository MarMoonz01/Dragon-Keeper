import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load credentials from .env file (never hardcode)
const envPath = new URL('../.env', import.meta.url);
const env = {};
try {
    readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length) env[key.trim()] = val.join('=').trim();
    });
} catch {
    console.error('Could not read .env file. Create one with VITE_SUPABASE_URL and VITE_SUPABASE_KEY.');
    process.exit(1);
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env');
    process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log('Verifying Supabase tables...');

    const tables = ['game_state', 'writing_history', 'user_profile'];
    let allExist = true;

    for (const table of tables) {
        const { data, error } = await sb.from(table).select('*').limit(1);
        if (error) {
            console.log(`  ❌ ${table}: ${error.message}`);
            allExist = false;
        } else {
            console.log(`  ✅ ${table}: exists (${data.length} rows)`);
        }
    }

    if (!allExist) {
        console.log('\n⚠️  Some tables are missing. Please run the SQL from supabase/schema.sql');
        console.log('   in the Supabase Dashboard → SQL Editor.');
        return;
    }

    // Ensure seed rows exist
    const { error: gsErr } = await sb.from('game_state').upsert([{ id: 1 }], { onConflict: 'id', ignoreDuplicates: true });
    if (gsErr) console.log('  game_state seed:', gsErr.message);
    else console.log('  ✅ game_state seed row ensured');

    const { error: upErr } = await sb.from('user_profile').upsert([{ id: 1 }], { onConflict: 'id', ignoreDuplicates: true });
    if (upErr) console.log('  user_profile seed:', upErr.message);
    else console.log('  ✅ user_profile seed row ensured');

    console.log('\n✅ All tables exist and are seeded!');
}

run().catch(e => console.error('Fatal:', e));
