-- Story 2.3: coluna is_shared + view publica do feed
--
-- A view NAO depende de RLS pra seguranca: ela roda com os privilegios do dono
-- (tipicamente postgres, que ja bypassa RLS por ser dono das tabelas), entao a
-- seguranca vem do proprio WHERE is_shared = true na definicao da view, e do fato
-- de so selecionarmos campos explicitamente seguros (nunca user_id, verification_code).

alter table sessions
  add column if not exists is_shared boolean not null default true;

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
  ) as top_monsters
from sessions s
join characters c on c.id = s.character_id
where s.is_shared = true
order by s.started_at desc;

grant select on public_hunts_feed to authenticated;
