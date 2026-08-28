-- Story 4.1: Cache de Criaturas TibiaData (Supabase)
--
-- Cache global (não por usuário) de dados de criatura vindos da TibiaData API
-- (https://api.tibiadata.com/v4/creature/{name}). Populado sob demanda (lazy)
-- pelo helper src/lib/creaturesCache.js — nunca por um job agendado.
--
-- Chave primária é o próprio monster_name normalizado (lowercase), evitando
-- join extra: session_monsters.monster_name (texto livre do parser) é a
-- mesma string usada para buscar aqui.

create table if not exists creatures (
  name text primary key,
  race text,
  image_url text,
  hitpoints integer,
  experience_points integer,
  is_lootable boolean not null default false,
  loot_list jsonb not null default '[]'::jsonb,
  immune jsonb not null default '[]'::jsonb,
  strong jsonb not null default '[]'::jsonb,
  weakness jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now()
);

alter table creatures enable row level security;

-- Dado não é sensível (cache de API pública) — qualquer usuário autenticado
-- pode ler, e a própria aplicação (client autenticado) faz upsert quando um
-- monstro ainda não está cacheado ou está desatualizado.
create policy "Authenticated users can read creatures"
  on creatures for select
  to authenticated
  using (true);

create policy "Authenticated users can upsert creatures"
  on creatures for insert
  to authenticated
  with check (true);

create policy "Authenticated users can refresh creatures"
  on creatures for update
  to authenticated
  using (true)
  with check (true);
