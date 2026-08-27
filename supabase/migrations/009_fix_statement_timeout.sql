-- Fix: 20 sequential http_get calls (~1.4s each even on failure) can total ~30s+, which
-- exceeds Postgres/Supabase's default statement_timeout for the `authenticated` role
-- (the whole RPC call gets killed mid-loop with "canceling statement due to statement
-- timeout", uncatchable by a nested EXCEPTION block). Raise the timeout specifically for
-- these two functions (not globally) and cap each individual request so a single hung
-- request can't consume the whole budget alone.

create or replace function sync_character_profile(p_character_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
set statement_timeout = '15s'
as $$
declare
  v_character record;
  v_response http_response;
  v_body jsonb;
  v_info jsonb;
begin
  select * into v_character
  from characters
  where id = p_character_id and user_id = auth.uid();

  if v_character is null then
    return jsonb_build_object('error', 'not_found_or_not_owner');
  end if;

  if v_character.stats_updated_at is not null and v_character.stats_updated_at > now() - interval '10 minutes' then
    return jsonb_build_object('error', 'cooldown', 'retry_after', v_character.stats_updated_at + interval '10 minutes');
  end if;

  begin
    select * into v_response
    from http_get('https://api.tibiadata.com/v4/character/' || urlencode(v_character.name));
  exception when others then
    return jsonb_build_object('error', 'api_unavailable', 'status', 0);
  end;

  if v_response.status = 0 or v_response.status >= 500 then
    return jsonb_build_object('error', 'api_unavailable', 'status', v_response.status);
  end if;

  if v_response.status = 404 then
    return jsonb_build_object('error', 'character_not_found');
  end if;

  if v_response.status != 200 then
    return jsonb_build_object('error', 'api_error', 'status', v_response.status);
  end if;

  v_body := v_response.content::jsonb;
  v_info := v_body->'character'->'character';

  if v_info is null then
    return jsonb_build_object('error', 'unexpected_response');
  end if;

  update characters
  set
    stats_level = (v_info->>'level')::int,
    stats_vocation = v_info->>'vocation',
    stats_world = v_info->>'world',
    stats_guild_name = v_info->'guild'->>'name',
    stats_achievement_points = coalesce((v_info->>'achievement_points')::int, 0),
    stats_updated_at = now()
  where id = p_character_id;

  return jsonb_build_object(
    'success', true,
    'level', (v_info->>'level')::int,
    'vocation', v_info->>'vocation',
    'guild', v_info->'guild'->>'name'
  );
end;
$$;

create or replace function sync_character_skill(p_character_id uuid, p_category text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
set statement_timeout = '45s'
as $$
declare
  v_character record;
  v_allowed_categories text[];
  v_response http_response;
  v_body jsonb;
  v_page int;
  v_found jsonb := null;
  v_request_failed boolean;
begin
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '4000');

  select * into v_character
  from characters
  where id = p_character_id and user_id = auth.uid();

  if v_character is null then
    return jsonb_build_object('error', 'not_found_or_not_owner');
  end if;

  if v_character.stats_vocation is null or v_character.stats_world is null then
    return jsonb_build_object('error', 'profile_not_synced_yet');
  end if;

  if v_character.stats_skill_checked_at is not null
     and v_character.stats_skill_checked_at > now() - interval '10 minutes' then
    return jsonb_build_object('error', 'cooldown', 'retry_after', v_character.stats_skill_checked_at + interval '10 minutes');
  end if;

  v_allowed_categories := case
    when v_character.stats_vocation in ('Knight', 'Elite Knight')
      then array['clubfighting', 'axefighting', 'swordfighting', 'shielding']
    when v_character.stats_vocation in ('Paladin', 'Royal Paladin')
      then array['distancefighting']
    when v_character.stats_vocation in ('Druid', 'Elder Druid', 'Sorcerer', 'Master Sorcerer')
      then array['magiclevel']
    else array[]::text[]
  end;

  if not (p_category = any(v_allowed_categories)) then
    return jsonb_build_object('error', 'invalid_category_for_vocation', 'allowed', v_allowed_categories);
  end if;

  for v_page in 1..20 loop
    v_request_failed := false;

    begin
      select * into v_response
      from http_get(
        'https://api.tibiadata.com/v4/highscores/' || urlencode(v_character.stats_world) ||
        '/' || p_category || '/all/' || v_page
      );
    exception when others then
      v_request_failed := true;
    end;

    if v_request_failed then
      return jsonb_build_object('error', 'api_unavailable', 'status', 0);
    end if;

    if v_response.status = 0 or v_response.status >= 500 then
      return jsonb_build_object('error', 'api_unavailable', 'status', v_response.status);
    end if;

    if v_response.status != 200 then
      return jsonb_build_object('error', 'api_error', 'status', v_response.status);
    end if;

    v_body := v_response.content::jsonb;

    select entry into v_found
    from jsonb_array_elements(v_body->'highscores'->'highscore_list') as entry
    where lower(entry->>'name') = lower(v_character.name)
    limit 1;

    if v_found is not null then
      exit;
    end if;
  end loop;

  if v_found is null then
    update characters
    set stats_skill_category = null,
        stats_skill_value = null,
        stats_skill_rank = null,
        stats_skill_checked_at = now()
    where id = p_character_id;

    return jsonb_build_object('success', true, 'found', false);
  end if;

  update characters
  set stats_skill_category = p_category,
      stats_skill_value = (v_found->>'value')::int,
      stats_skill_rank = (v_found->>'rank')::int,
      stats_skill_checked_at = now()
  where id = p_character_id;

  return jsonb_build_object(
    'success', true,
    'found', true,
    'value', (v_found->>'value')::int,
    'rank', (v_found->>'rank')::int
  );
end;
$$;
