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
