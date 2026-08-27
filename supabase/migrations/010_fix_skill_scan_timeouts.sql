-- Fix: TibiaData highscores latency varies (1.5s-3.3s observed live per page). A 4s
-- per-request curl timeout occasionally got hit by one slow page in a 20-page scan,
-- aborting the whole sync_character_skill call with api_unavailable even though the API
-- was actually up. Raise the per-request timeout and the function's statement_timeout
-- to give enough headroom for a full 20-page scan under realistic latency.

create or replace function sync_character_skill(p_character_id uuid, p_category text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
set statement_timeout = '90s'
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
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '8000');

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
