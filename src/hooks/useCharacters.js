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
      .select('id, name, world, created_at')
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

  async function addCharacter({ name, world }) {
    const { data, error } = await supabase
      .from('characters')
      .insert({ name, world })
      .select('id, name, world, created_at')
      .single()

    if (!error) {
      setCharacters((prev) => [...prev, data])
      selectCharacter(data.id)
    }

    return { error }
  }

  async function removeCharacter(id) {
    const { error } = await supabase.from('characters').delete().eq('id', id)

    if (!error) {
      setCharacters((prev) => prev.filter((c) => c.id !== id))
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
    removeCharacter,
  }
}
