-- Nexus App — Supabase Schema
-- Run this in the Supabase SQL Editor to create all required tables.
-- No RLS — simple public access with anon key.

-- 1. daily_plans
create table if not exists daily_plans (
  date date primary key,
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. daily_summaries
create table if not exists daily_summaries (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  summary text,
  mood text,
  mood_score integer,
  energy_score integer,
  focus_score integer,
  sleep_score integer,
  productivity_score integer,
  completed_tasks jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. scores (IELTS)
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  overall numeric,
  writing numeric,
  reading numeric,
  listening numeric,
  speaking numeric,
  type text,
  created_at timestamptz not null default now()
);

-- 4. notebook (vocabulary)
create table if not exists notebook (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  def text,
  ex text,
  ipa text,
  cat text,
  topic text,
  mastery integer not null default 0,
  next_review_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. practice_logs
create table if not exists practice_logs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. game_state — single row, JSONB columns for all game/app state
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

-- Seed the single row so upserts work
insert into game_state (id) values (1) on conflict do nothing;

-- 7. writing_history — one row per scored essay
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

-- 8. user_profile — single row
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

-- Seed the single row
insert into user_profile (id) values (1) on conflict do nothing;
