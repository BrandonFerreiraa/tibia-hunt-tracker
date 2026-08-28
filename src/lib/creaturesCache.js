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
    // Percentuais exatos vêm do TibiaWiki (Fandom), fonte separada da
    // TibiaData — null quando a wiki não tem o campo ou a busca falhou
    // (client cai pro badge qualitativo immune/strong/weakness acima).
    resistancePct: {
      physical: row.physical_pct,
      fire: row.fire_pct,
      earth: row.earth_pct,
      energy: row.energy_pct,
      ice: row.ice_pct,
      holy: row.holy_pct,
      death: row.death_pct,
    },
    hasWikiData: row.wiki_synced_at != null,
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
