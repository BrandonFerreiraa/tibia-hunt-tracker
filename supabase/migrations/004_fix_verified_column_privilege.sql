-- Fix for migration 003: `revoke update (verified) ... from authenticated` alone did NOT
-- block the client, because Supabase's default schema privileges already grant
-- table-level UPDATE on `characters` to `authenticated` (which implicitly covers every
-- column, including `verified`, regardless of column-specific revokes).
--
-- The fix: revoke the blanket table-level UPDATE, then grant back only the columns the
-- client is actually allowed to write itself. `verified` is deliberately excluded — it can
-- only be flipped by verify_character() (SECURITY DEFINER, runs as table owner).

revoke update on characters from authenticated;

grant update (name, world, verification_code, verification_code_expires_at)
  on characters to authenticated;
