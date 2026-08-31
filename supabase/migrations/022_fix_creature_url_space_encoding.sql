-- Bug real (confirmado via debug_get_creature): a função `urlencode()` da
-- extensão `http` do Postgres codifica espaço como `+` (estilo
-- application/x-www-form-urlencoded), mas a TibiaData API só aceita espaço
-- como `%20` no path — "bulltaur brute" virava a URL
-- .../creature/bulltaur+brute, e a TibiaData respondia 400 "the provided
-- creature name is invalid" (tratado como "não encontrado", por design,
-- então o bug ficava invisível pro usuário). Confirmado: "orc" (uma
-- palavra, sem espaço) sempre funcionou; qualquer nome de 2+ palavras
-- nunca encontrado ("bulltaur brute", "dragon lord", "crypt warrior").
--
-- Fix: troca o `+` por `%20` no resultado de `urlencode()` antes de montar
-- a URL da TibiaData. Mantém `urlencode()` pra qualquer outro caractere
-- especial, só corrige a codificação de espaço.
--
-- Timeout/curlopt da migration 021 mantidos (não eram a causa raiz, mas
-- não fazem mal como margem de segurança).

create or replace function get_creature(p_monster_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
set statement_timeout = '20s'
as $$
declare
  v_name text := lower(trim(p_monster_name));
  v_cached creatures;
  v_response http_response;
  v_body jsonb;
  v_info jsonb;
  v_wiki_response http_response;
  v_wiki_body jsonb;
  v_wikitext text;
begin
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '8000');

  select * into v_cached from creatures where name = v_name;

  if v_cached.synced_at is not null
     and v_cached.wiki_checked_at is not null
     and v_cached.synced_at > now() - interval '30 days' then
    return to_jsonb(v_cached);
  end if;

  begin
    select * into v_response
    from http_get('https://api.tibiadata.com/v4/creature/' || replace(urlencode(v_name), '+', '%20'));
  exception when others then
    return to_jsonb(v_cached);
  end;

  if v_response.status != 200 then
    return to_jsonb(v_cached);
  end if;

  v_body := v_response.content::jsonb;
  v_info := v_body->'creature';

  if v_info->>'name' is null then
    return to_jsonb(v_cached);
  end if;

  begin
    select * into v_wiki_response
    from http_get(
      'https://tibia.fandom.com/api.php?action=parse&page=' ||
      replace(urlencode(initcap(v_name)), '+', '%20') ||
      '&prop=wikitext&redirects=1&format=json&section=0'
    );

    if v_wiki_response.status = 200 then
      v_wiki_body := v_wiki_response.content::jsonb;
      v_wikitext := v_wiki_body->'parse'->'wikitext'->>'*';
    end if;
  exception when others then
    v_wikitext := null;
  end;

  insert into creatures (
    name, display_name, race, image_url, hitpoints, experience_points,
    is_lootable, loot_list, immune, strong, weakness, synced_at,
    physical_pct, fire_pct, earth_pct, energy_pct, ice_pct, holy_pct,
    death_pct, drown_pct, hp_drain_pct, heal_pct, wiki_synced_at, wiki_checked_at
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
    now(),
    substring(v_wikitext from 'physicalDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'fireDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'earthDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'energyDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'iceDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'holyDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'deathDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'drownDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'hpDrainDmgMod\s*=\s*(\d+)%')::integer,
    substring(v_wikitext from 'healMod\s*=\s*(\d+)%')::integer,
    case when v_wikitext is not null then now() else null end,
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
    synced_at = excluded.synced_at,
    physical_pct = coalesce(excluded.physical_pct, creatures.physical_pct),
    fire_pct = coalesce(excluded.fire_pct, creatures.fire_pct),
    earth_pct = coalesce(excluded.earth_pct, creatures.earth_pct),
    energy_pct = coalesce(excluded.energy_pct, creatures.energy_pct),
    ice_pct = coalesce(excluded.ice_pct, creatures.ice_pct),
    holy_pct = coalesce(excluded.holy_pct, creatures.holy_pct),
    death_pct = coalesce(excluded.death_pct, creatures.death_pct),
    drown_pct = coalesce(excluded.drown_pct, creatures.drown_pct),
    hp_drain_pct = coalesce(excluded.hp_drain_pct, creatures.hp_drain_pct),
    heal_pct = coalesce(excluded.heal_pct, creatures.heal_pct),
    wiki_synced_at = coalesce(excluded.wiki_synced_at, creatures.wiki_synced_at),
    wiki_checked_at = excluded.wiki_checked_at
  returning * into v_cached;

  return to_jsonb(v_cached);
end;
$$;

grant execute on function get_creature(text) to authenticated;

-- Limpa a function de diagnóstico temporária (migration 099).
drop function if exists debug_get_creature(text);
