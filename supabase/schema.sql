-- AI-Powered Interview Preparation System — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- Users are managed by Supabase Auth (auth.users). This table extends that
-- with app-specific profile data.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  target_role text,
  resume_text text,
  resume_url text,
  created_at timestamptz not null default now()
);

-- One row per mock interview session a student runs.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  domain text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  overall_score numeric(5,2),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Questions generated for a session (AI-generated, role/resume-aware).
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  order_index int not null,
  prompt text not null,
  category text, -- e.g. 'behavioral', 'technical', 'system-design'
  created_at timestamptz not null default now()
);

-- The candidate's answer to each question, plus AI evaluation.
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  answer_text text not null,
  score numeric(5,2),
  strengths text[],
  weaknesses text[],
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists questions_session_id_idx on public.questions (session_id);
create index if not exists answers_session_id_idx on public.answers (session_id);

-- Row Level Security: every user can only see/edit their own data.
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;

create policy "profiles: owner read/write" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "sessions: owner read/write" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "questions: owner via session" on public.questions
  for all using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );

create policy "answers: owner via session" on public.answers
  for all using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );
