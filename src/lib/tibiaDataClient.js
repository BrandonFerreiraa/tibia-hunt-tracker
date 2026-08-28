const BASE_URL = 'https://api.tibiadata.com/v4'

export class TibiaDataUnavailableError extends Error {
  constructor(status) {
    super(`TibiaData API indisponível (HTTP ${status}). Tente novamente em alguns minutos.`)
    this.status = status
  }
}

export class CharacterNotFoundError extends Error {
  constructor(name) {
    super(`Personagem "${name}" não encontrado no Tibia.`)
  }
}

export async function fetchCharacter(name) {
  let response
  try {
    response = await fetch(`${BASE_URL}/character/${encodeURIComponent(name)}`)
  } catch {
    throw new TibiaDataUnavailableError('network error')
  }

  if (response.status === 404) {
    throw new CharacterNotFoundError(name)
  }

  if (response.status >= 500) {
    throw new TibiaDataUnavailableError(response.status)
  }

  if (!response.ok) {
    throw new TibiaDataUnavailableError(response.status)
  }

  const data = await response.json()
  const info = data?.character?.character

  if (!info) {
    throw new CharacterNotFoundError(name)
  }

  return {
    name: info.name,
    level: info.level,
    vocation: info.vocation,
    world: info.world,
    guild: info.guild ?? null,
    achievementPoints: info.achievement_points ?? 0,
    comment: info.comment ?? '',
  }
}

const VOCATION_SKILL_CATEGORY = {
  Knight: ['clubfighting', 'axefighting', 'swordfighting', 'shielding'],
  'Elite Knight': ['clubfighting', 'axefighting', 'swordfighting', 'shielding'],
  Paladin: ['distancefighting'],
  'Royal Paladin': ['distancefighting'],
  Druid: ['magiclevel'],
  'Elder Druid': ['magiclevel'],
  Sorcerer: ['magiclevel'],
  'Master Sorcerer': ['magiclevel'],
}

export function getSkillCategoriesForVocation(vocation) {
  return VOCATION_SKILL_CATEGORY[vocation] ?? []
}

export async function fetchCreature(name) {
  let response
  try {
    response = await fetch(`${BASE_URL}/creature/${encodeURIComponent(name)}`)
  } catch {
    throw new TibiaDataUnavailableError('network error')
  }

  // A TibiaData API responde 400 (não 404) para um nome de criatura que não
  // existe ("the provided creature name is invalid") — tratado aqui como
  // "não encontrado", não como erro.
  if (response.status === 400 || response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new TibiaDataUnavailableError(response.status)
  }

  const data = await response.json()
  const info = data?.creature

  if (!info?.name) {
    return null
  }

  return {
    name: info.name,
    race: info.race,
    imageUrl: info.image_url ?? null,
    hitpoints: info.hitpoints ?? null,
    experiencePoints: info.experience_points ?? null,
    isLootable: info.is_lootable ?? false,
    lootList: info.loot_list ?? [],
    immune: info.immune ?? [],
    strong: info.strong ?? [],
    weakness: info.weakness ?? [],
  }
}

export async function fetchHighscorePage(world, category, vocation, page) {
  let response
  try {
    response = await fetch(`${BASE_URL}/highscores/${world}/${category}/${vocation}/${page}`)
  } catch {
    throw new TibiaDataUnavailableError('network error')
  }

  if (response.status >= 500) {
    throw new TibiaDataUnavailableError(response.status)
  }

  if (!response.ok) {
    throw new TibiaDataUnavailableError(response.status)
  }

  const data = await response.json()
  return data?.highscores?.highscore_list ?? []
}
