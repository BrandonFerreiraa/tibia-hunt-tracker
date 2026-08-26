import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSessions(characterId) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadSessions = useCallback(async () => {
    if (!characterId) {
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(
        'id, hunt_name, started_at, ended_at, duration_seconds, xp_gain, xp_per_hour, loot, supplies, balance, source'
      )
      .eq('character_id', characterId)
      .order('started_at', { ascending: false })

    if (!error) setSessions(data)
    setLoading(false)
  }, [characterId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function addSession({ monsters, items, ...sessionFields }) {
    const { data, error } = await supabase.from('sessions').insert(sessionFields).select().single()

    if (error) return { error }

    if (monsters?.length) {
      const rows = monsters.map((m) => ({ session_id: data.id, monster_name: m.name, quantity: m.quantity }))
      const { error: monstersError } = await supabase.from('session_monsters').insert(rows)
      if (monstersError) return { error: monstersError }
    }

    if (items?.length) {
      const rows = items.map((i) => ({ session_id: data.id, item_name: i.name, quantity: i.quantity }))
      const { error: itemsError } = await supabase.from('session_items').insert(rows)
      if (itemsError) return { error: itemsError }
    }

    await loadSessions()
    return { error: null }
  }

  return { sessions, loading, addSession }
}
