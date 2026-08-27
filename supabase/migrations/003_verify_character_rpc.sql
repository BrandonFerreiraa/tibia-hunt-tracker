-- Story 2.1: Server-side verification (security hardening)
--
-- Problem: with only RLS (user_id = auth.uid()), the client's anon key could set
-- `verified = true` directly via the browser console, without ever proving comment
-- ownership on tibia.com. This migration moves the actual verification check into a
-- SECURITY DEFINER Postgres function, and revokes direct client write access to the
-- `verified` column so it can only be flipped through that function.
--
-- Requires the `http` extension (bundled with Supabase Postgres) for synchronous
-- outbound HTTP calls to the TibiaData API.

create extension if not exists http;

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
  from http_get('https://api.tibiadata.com/v4/character/' || v_character.name);

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

grant execute on function verify_character(uuid) to authenticated;

-- Column-level privilege: the client can still request a code (writes verification_code /
-- verification_code_expires_at via normal UPDATE, still guarded by the existing RLS policy),
-- but can no longer flip `verified` itself — only verify_character() can, since it runs as
-- the function owner (bypassing this column restriction).
revoke update (verified) on characters from authenticated;
