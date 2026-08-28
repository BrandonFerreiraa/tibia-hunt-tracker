-- Fix (achado em teste manual pós-deploy do Epic 4): a TibiaData API não envia
-- headers de CORS, então chamar https://api.tibiadata.com/v4/creature/{name}
-- direto do browser (fetchCreature em tibiaDataClient.js, Story 4.1) sempre
-- falha com "blocked by CORS policy". Mesmo motivo pelo qual a verificação de
-- personagem e o sync de stats (Stories 2.1/2.2) já passam por uma RPC
-- SECURITY DEFINER usando a extensão `http` server-side, em vez de fetch()
-- no client — replicado aqui para criaturas.

alter table creatures add column if not exists display_name text;

create or replace function get_creature(p_monster_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
set statement_timeout = '10s'
as $$
declare
  v_name text := lower(trim(p_monster_name));
  v_cached creatures;
  v_response http_response;
  v_body jsonb;
  v_info jsonb;
begin
  select * into v_cached from creatures where name = v_name;

  if v_cached.synced_at is not null and v_cached.synced_at > now() - interval '30 days' then
    return to_jsonb(v_cached);
  end if;

  begin
    select * into v_response
    from http_get('https://api.tibiadata.com/v4/creature/' || urlencode(v_name));
  exception when others then
    return to_jsonb(v_cached);
  end;

  -- A TibiaData API responde 400 (não 404) para um nome de criatura inválido
  -- ("the provided creature name is invalid") — qualquer status != 200 aqui
  -- é tratado como "não encontrado ou indisponível", nunca como erro fatal.
  if v_response.status != 200 then
    return to_jsonb(v_cached);
  end if;

  v_body := v_response.content::jsonb;
  v_info := v_body->'creature';

  if v_info->>'name' is null then
    return to_jsonb(v_cached);
  end if;

  insert into creatures (
    name, display_name, race, image_url, hitpoints, experience_points,
    is_lootable, loot_list, immune, strong, weakness, synced_at
  )
  values (
    v_name,
    v_info->>'name',
    v_info->>'race',
    v_info->>'image_url',
    (v_info->>'hitpoints')::integer,
    (v_info->>'experience_points')::integer,
    coalesce((v_info->>'is_lootable')::boolean, false),
    coalesce(v_info->'loot_list', '[]'::jsonb),
    coalesce(v_info->'immune', '[]'::jsonb),
    coalesce(v_info->'strong', '[]'::jsonb),
    coalesce(v_info->'weakness', '[]'::jsonb),
    now()
  )
  on conflict (name) do update set
    display_name = excluded.display_name,
    race = excluded.race,
    image_url = excluded.image_url,
    hitpoints = excluded.hitpoints,
    experience_points = excluded.experience_points,
    is_lootable = excluded.is_lootable,
    loot_list = excluded.loot_list,
    immune = excluded.immune,
    strong = excluded.strong,
    weakness = excluded.weakness,
    synced_at = excluded.synced_at
  returning * into v_cached;

  return to_jsonb(v_cached);
end;
$$;

grant execute on function get_creature(text) to authenticated;
