-- Story 3.4: Hunts Compartilhadas — Destaque de Hunts Próprias
--
-- Adiciona character_id na view pública pra permitir identificar, no client, quais
-- hunts pertencem aos personagens do proprio usuario logado (comparando contra os
-- ids que useCharacters() já retorna) — sem nunca expor user_id de ninguém na view
-- (decisão deliberada da Story 2.3, mantida aqui).
--
-- Coluna nova vai no FINAL da lista de colunas: "create or replace view" do Postgres
-- recusa (erro 42P16) se uma coluna nova for inserida no meio de uma view existente
-- (mesmo problema já resolvido na Story 2.4 / migration 013).

create or replace view public_hunts_feed as
select
  s.id,
  s.hunt_name,
  s.started_at,
  s.duration_seconds,
  s.xp_per_hour,
  s.balance,
  c.name as character_name,
  c.world,
  c.verified,
  c.stats_level,
  c.stats_vocation,
  (
    select string_agg(top.monster_name || ' (' || top.quantity || ')', ', ')
    from (
      select monster_name, quantity
      from session_monsters
      where session_id = s.id
      order by quantity desc
      limit 3
    ) top
  ) as top_monsters,
  (
    select array_agg(distinct sm.monster_name)
    from session_monsters sm
    where sm.session_id = s.id
  ) as all_monster_names,
  round(s.balance / (nullif(s.duration_seconds, 0) / 3600.0))::bigint as profit_per_hour,
  c.id as character_id
from sessions s
join characters c on c.id = s.character_id
where s.is_shared = true
order by s.started_at desc;

grant select on public_hunts_feed to authenticated;
