import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const SKILL_CATEGORY_LABELS = {
  clubfighting: 'Club Fighting',
  axefighting: 'Axe Fighting',
  swordfighting: 'Sword Fighting',
  shielding: 'Shielding',
  distancefighting: 'Distance Fighting',
  magiclevel: 'Magic Level',
}

export function getAutoSkillCategory(vocation) {
  if (['Paladin', 'Royal Paladin'].includes(vocation)) return 'distancefighting'
  if (['Druid', 'Elder Druid', 'Sorcerer', 'Master Sorcerer'].includes(vocation)) return 'magiclevel'
  return null // Knights choose manually among 4 options
}

export function isKnight(vocation) {
  return ['Knight', 'Elite Knight'].includes(vocation)
}

function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.round(hours / 24)}d`
}

const ERROR_MESSAGES = {
  not_found_or_not_owner: 'Personagem não encontrado ou não pertence à sua conta.',
  api_unavailable: 'A TibiaData API está indisponível agora. Tente novamente em alguns minutos.',
  character_not_found: 'Personagem não encontrado no Tibia.',
  api_error: 'Erro ao consultar a TibiaData API. Tente novamente.',
  unexpected_response: 'Resposta inesperada da TibiaData API.',
  profile_not_synced_yet: 'Sincronize o perfil primeiro.',
  invalid_category_for_vocation: 'Categoria de skill inválida para essa vocação.',
}

function errorMessage(data) {
  if (data?.error === 'cooldown') {
    return `Aguarde antes de sincronizar de novo (disponível ${formatRelativeTime(data.retry_after)}).`
  }
  return ERROR_MESSAGES[data?.error] ?? data?.error ?? 'Erro desconhecido.'
}

export function useCharacterStats() {
  const [busy, setBusy] = useState(false)

  async function syncProfile(characterId) {
    setBusy(true)
    const { data, error } = await supabase.rpc('sync_character_profile', { p_character_id: characterId })
    setBusy(false)
    if (error) return { error }
    if (data?.error) return { error: new Error(errorMessage(data)) }
    return { data }
  }

  async function syncSkill(characterId, category) {
    setBusy(true)
    const { data, error } = await supabase.rpc('sync_character_skill', {
      p_character_id: characterId,
      p_category: category,
    })
    setBusy(false)
    if (error) return { error }
    if (data?.error) return { error: new Error(errorMessage(data)) }
    return { data }
  }

  return { busy, syncProfile, syncSkill }
}

export { formatRelativeTime }
