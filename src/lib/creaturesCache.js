import { supabase } from './supabaseClient'

function fromRow(row) {
  if (!row) return null

  return {
    name: row.display_name ?? row.name,
    race: row.race,
    imageUrl: row.image_url,
    hitpoints: row.hitpoints,
    experiencePoints: row.experience_points,
    isLootable: row.is_lootable,
    lootList: row.loot_list ?? [],
    immune: row.immune ?? [],
    strong: row.strong ?? [],
    weakness: row.weakness ?? [],
  }
}

// A TibiaData API não envia headers de CORS, então a busca roda server-side
// via RPC (extensão `http` do Postgres, mesmo padrão de sync_character_profile)
// em vez de fetch() direto do browser — ver migration 018_get_creature_rpc.sql.
export async function getCreature(monsterName) {
  if (!monsterName) return null

  const { data, error } = await supabase.rpc('get_creature', { p_monster_name: monsterName })
  if (error) return null

  return fromRow(data)
}
