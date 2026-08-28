-- Adiciona a skill sincronizada do personagem (Story 2.2) na view pública, pra
-- exibir junto do badge de "verificado" nos cards de Hunts Compartilhadas.
--
-- Coluna nova no FINAL da lista de colunas (mesmo motivo das migrations 013/015:
-- "create or replace view" recusa inserir coluna no meio de uma view existente).

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
  c.id as character_id,
  c.stats_skill_category,
  c.stats_skill_value,
  c.stats_skill_rank
from sessions s
join characters c on c.id = s.character_id
where s.is_shared = true
order by s.started_at desc;

grant select on public_hunts_feed to authenticated;
