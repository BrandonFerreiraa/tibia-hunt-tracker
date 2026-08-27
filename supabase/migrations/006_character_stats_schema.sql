-- Story 2.2: colunas de stats sincronizados (level/vocacao/guild/skill via highscore)

alter table characters
  add column if not exists stats_level int,
  add column if not exists stats_vocation text,
  add column if not exists stats_world text,
  add column if not exists stats_guild_name text,
  add column if not exists stats_achievement_points int,
  add column if not exists stats_updated_at timestamptz,
  add column if not exists stats_skill_category text,
  add column if not exists stats_skill_value int,
  add column if not exists stats_skill_rank int,
  add column if not exists stats_skill_checked_at timestamptz;

-- Mesmo padrao de seguranca da Story 2.1: cliente nao pode escrever esses campos
-- diretamente (evita spoofing de stats no feed publico). So as RPCs abaixo podem.
revoke update (
  stats_level, stats_vocation, stats_world, stats_guild_name, stats_achievement_points,
  stats_updated_at, stats_skill_category, stats_skill_value, stats_skill_rank, stats_skill_checked_at
) on characters from authenticated;
