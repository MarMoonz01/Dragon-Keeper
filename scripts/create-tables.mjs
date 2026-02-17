import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uvdczryeoksadvyrnbod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZGN6cnllb2tzYWR2eXJuYm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDU0ODQsImV4cCI6MjA4NjE4MTQ4NH0.07_ROfTuEbDBytdYp8UP2IZQjSC7XAVrHaoDvgaqIFY';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Attempting to create tables via SQL endpoint...');

  const SQL = `
create table if not exists game_state (
  id integer primary key default 1 check (id = 1),
  dragon jsonb not null default '{"xp":0,"level":1}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  health jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  monster_state jsonb,
  challenges jsonb not null default '{}'::jsonb,
  quests jsonb not null default '{}'::jsonb,
  deadlines jsonb not null default '{}'::jsonb,
  weekly_goals jsonb,
  last_review text,
  health_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into game_state (id) values (1) on conflict do nothing;

create table if not exists writing_history (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  task_id bigint,
  task_type integer,
  text text,
  wc integer,
  band numeric,
  ta numeric,
  cc numeric,
  lr numeric,
  gra numeric,
  strengths text,
  improve text,
  created_at timestamptz not null default now()
);

create table if not exists user_profile (
  id integer primary key default 1 check (id = 1),
  name text,
  age integer,
  status text,
  goals jsonb default '[]'::jsonb,
  wake_time text,
  sleep_time text,
  free_slots text,
  current_band text,
  exercise_days integer,
  updated_at timestamptz not null default now()
);
insert into user_profile (id) values (1) on conflict do nothing;
`;

  // Try the /pg/sql endpoint (Supabase Studio SQL runner)
  const res = await fetch(`${SUPABASE_URL}/pg/sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('SUCCESS via /pg/sql');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(`/pg/sql returned ${res.status} — trying table-by-table verification...`);

  // Fallback: verify tables exist by trying to select from them
  // If they don't exist, the user needs to run SQL manually
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
  } else {
    // Ensure seed rows exist
    const { error: gsErr } = await sb.from('game_state').upsert([{ id: 1 }], { onConflict: 'id', ignoreDuplicates: true });
    if (gsErr) console.log('  game_state seed:', gsErr.message);
    else console.log('  ✅ game_state seed row ensured');

    const { error: upErr } = await sb.from('user_profile').upsert([{ id: 1 }], { onConflict: 'id', ignoreDuplicates: true });
    if (upErr) console.log('  user_profile seed:', upErr.message);
    else console.log('  ✅ user_profile seed row ensured');

    console.log('\n✅ All tables exist and are seeded!');
  }
}

run().catch(e => console.error('Fatal:', e));
