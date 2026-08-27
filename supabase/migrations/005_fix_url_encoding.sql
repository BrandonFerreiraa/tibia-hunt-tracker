-- Fix: character names with spaces (very common in Tibia, e.g. "Nightmare Deathbringer")
-- broke the http_get() call with "Malformed input to a URL function", because the name
-- wasn't URL-encoded. The `http` extension provides urlencode() for exactly this.

create or replace function verify_character(p_character_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_character record;
  v_response http_response;
  v_body jsonb;
  v_comment text;
begin
  select * into v_character
  from characters
  where id = p_character_id and user_id = auth.uid();

  if v_character is null then
    return jsonb_build_object('error', 'not_found_or_not_owner');
  end if;

  if v_character.verified then
    return jsonb_build_object('error', 'already_verified');
  end if;

  if v_character.verification_code is null then
    return jsonb_build_object('error', 'no_code');
  end if;

  if v_character.verification_code_expires_at < now() then
    return jsonb_build_object('error', 'code_expired');
  end if;

  select * into v_response
  from http_get('https://api.tibiadata.com/v4/character/' || urlencode(v_character.name));

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
  v_comment := coalesce(v_body->'character'->'character'->>'comment', '');

  if v_comment not like ('%' || v_character.verification_code || '%') then
    return jsonb_build_object('error', 'code_not_found_in_comment');
  end if;

  update characters
  set verified = true, verification_code = null, verification_code_expires_at = null
  where id = p_character_id;

  return jsonb_build_object('success', true);
end;
$$;
