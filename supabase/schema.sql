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
