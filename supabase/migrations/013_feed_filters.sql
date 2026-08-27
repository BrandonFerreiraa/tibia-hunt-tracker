-- Story 2.4: campos de apoio para filtro (lista completa de monstros) e ordenacao (profit/h)

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
  round(s.balance / (nullif(s.duration_seconds, 0) / 3600.0))::bigint as profit_per_hour
from sessions s
join characters c on c.id = s.character_id
where s.is_shared = true
order by s.started_at desc;

grant select on public_hunts_feed to authenticated;
