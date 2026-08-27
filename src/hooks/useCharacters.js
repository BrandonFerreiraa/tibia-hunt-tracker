import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ACTIVE_CHARACTER_KEY = 'activeCharacterId'

export function useCharacters() {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCharacterId, setActiveCharacterId] = useState(
    () => localStorage.getItem(ACTIVE_CHARACTER_KEY) || null
  )

  const loadCharacters = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('characters')
      .select(
        `id, name, world, type, created_at, verified, verification_code, verification_code_expires_at,
         stats_level, stats_vocation, stats_world, stats_guild_name, stats_achievement_points, stats_updated_at,
         stats_skill_category, stats_skill_value, stats_skill_rank, stats_skill_checked_at`
      )
      .order('created_at', { ascending: true })

    if (!error) setCharacters(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  useEffect(() => {
    if (characters.length === 0) return
    const stillExists = characters.some((c) => c.id === activeCharacterId)
    if (!stillExists) {
      selectCharacter(characters[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters])

  function selectCharacter(id) {
    setActiveCharacterId(id)
    if (id) {
      localStorage.setItem(ACTIVE_CHARACTER_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_CHARACTER_KEY)
    }
  }

  async function addCharacter({ name, world, type = 'principal' }) {
    if (type === 'principal') {
      const currentPrincipal = characters.find((c) => c.type === 'principal')
      if (currentPrincipal) {
        await supabase.from('characters').update({ type: 'maker' }).eq('id', currentPrincipal.id)
      }
    }

    const { data, error } = await supabase
      .from('characters')
      .insert({ name, world, type })
      .select(
        `id, name, world, type, created_at, verified, verification_code, verification_code_expires_at,
         stats_level, stats_vocation, stats_world, stats_guild_name, stats_achievement_points, stats_updated_at,
         stats_skill_category, stats_skill_value, stats_skill_rank, stats_skill_checked_at`
      )
      .single()

    if (!error) {
      setCharacters((prev) => {
        const demoted =
          type === 'principal' ? prev.map((c) => (c.type === 'principal' ? { ...c, type: 'maker' } : c)) : prev
        return [...demoted, data]
      })
      selectCharacter(data.id)
    }

    return { error }
  }

  async function updateCharacterType(id, type) {
    if (type === 'principal') {
      const currentPrincipal = characters.find((c) => c.type === 'principal' && c.id !== id)
      if (currentPrincipal) {
        await supabase.from('characters').update({ type: 'maker' }).eq('id', currentPrincipal.id)
      }
    }

    const { error } = await supabase.from('characters').update({ type }).eq('id', id)

    if (!error) {
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.id === id) return { ...c, type }
          if (type === 'principal' && c.type === 'principal') return { ...c, type: 'maker' }
          return c
        })
      )
    }

    return { error }
  }

  async function removeCharacter(id) {
    const removed = characters.find((c) => c.id === id)
    const { error } = await supabase.from('characters').delete().eq('id', id)

    if (!error) {
      // characters is ordered by created_at ascending, so remaining[0] is the oldest survivor.
      const remaining = characters.filter((c) => c.id !== id)
      const promotedId = removed?.type === 'principal' && remaining.length > 0 ? remaining[0].id : null

      if (promotedId) {
        await supabase.from('characters').update({ type: 'principal' }).eq('id', promotedId)
      }

      setCharacters(remaining.map((c) => (c.id === promotedId ? { ...c, type: 'principal' } : c)))
      if (id === activeCharacterId) selectCharacter(null)
    }

    return { error }
  }

  return {
    characters,
    loading,
    activeCharacterId,
    selectCharacter,
    addCharacter,
    updateCharacterType,
    removeCharacter,
    refresh: loadCharacters,
  }
}
