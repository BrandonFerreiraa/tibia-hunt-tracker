import { supabase } from './supabaseClient'
import { fetchCreature } from './tibiaDataClient'

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

function normalize(monsterName) {
  return monsterName.trim().toLowerCase()
}

function isFresh(syncedAt) {
  return Date.now() - new Date(syncedAt).getTime() < CACHE_TTL_MS
}

function toRow(name, creature) {
  return {
    name,
    race: creature.race,
    image_url: creature.imageUrl,
    hitpoints: creature.hitpoints,
    experience_points: creature.experiencePoints,
    is_lootable: creature.isLootable,
    loot_list: creature.lootList,
    immune: creature.immune,
    strong: creature.strong,
    weakness: creature.weakness,
    synced_at: new Date().toISOString(),
  }
}

function fromRow(row) {
  return {
    name: row.name,
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

export async function getCreature(monsterName) {
  if (!monsterName) return null
  const name = normalize(monsterName)

  const { data: cached } = await supabase.from('creatures').select('*').eq('name', name).maybeSingle()

  if (cached && isFresh(cached.synced_at)) {
    return fromRow(cached)
  }

  let creature
  try {
    creature = await fetchCreature(name)
  } catch {
    return cached ? fromRow(cached) : null
  }

  if (!creature) {
    return cached ? fromRow(cached) : null
  }

  await supabase.from('creatures').upsert(toRow(name, creature))

  return creature
}
