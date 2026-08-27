-- Story 2.1: Character Ownership Verification
-- Rode este script no SQL Editor do Supabase (após o supabase/schema.sql original).

alter table characters
  add column if not exists verified boolean not null default false,
  add column if not exists verification_code text,
  add column if not exists verification_code_expires_at timestamptz;

-- Nomes de personagem no Tibia não diferenciam maiúsculas/minúsculas para fins de unicidade.
create unique index if not exists characters_name_unique_ci on characters (lower(name));
