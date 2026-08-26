-- Tibia Hunt Tracker — Story 1.1: Supabase Schema & Auth Setup
-- Rode este script no SQL Editor do seu projeto Supabase (Dashboard > SQL Editor > New query).

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  world text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  hunt_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  raw_xp_gain bigint not null default 0,
  xp_gain bigint not null default 0,
  xp_per_hour bigint not null default 0,
  raw_xp_per_hour bigint not null default 0,
  loot bigint not null default 0,
  supplies bigint not null default 0,
  balance bigint not null default 0,
  damage bigint not null default 0,
  damage_per_hour bigint not null default 0,
  healing bigint not null default 0,
  healing_per_hour bigint not null default 0,
  source text not null check (source in ('parsed', 'manual')),
  created_at timestamptz not null default now()
);

create table if not exists session_monsters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  monster_name text not null,
  quantity integer not null
);

create table if not exists session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  item_name text not null,
  quantity integer not null
);

create index if not exists idx_characters_user_id on characters(user_id);
create index if not exists idx_sessions_character_id on sessions(character_id);
create index if not exists idx_session_monsters_session_id on session_monsters(session_id);
create index if not exists idx_session_items_session_id on session_items(session_id);

-- Row Level Security

alter table characters enable row level security;
alter table sessions enable row level security;
alter table session_monsters enable row level security;
alter table session_items enable row level security;

create policy "Users manage own characters"
  on characters for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage own sessions"
  on sessions for all
  using (character_id in (select id from characters where user_id = auth.uid()))
  with check (character_id in (select id from characters where user_id = auth.uid()));

create policy "Users manage own session_monsters"
  on session_monsters for all
  using (session_id in (
    select s.id from sessions s
    join characters c on c.id = s.character_id
    where c.user_id = auth.uid()
  ))
  with check (session_id in (
    select s.id from sessions s
    join characters c on c.id = s.character_id
    where c.user_id = auth.uid()
  ));

create policy "Users manage own session_items"
  on session_items for all
  using (session_id in (
    select s.id from sessions s
    join characters c on c.id = s.character_id
    where c.user_id = auth.uid()
  ))
  with check (session_id in (
    select s.id from sessions s
    join characters c on c.id = s.character_id
    where c.user_id = auth.uid()
  ));
