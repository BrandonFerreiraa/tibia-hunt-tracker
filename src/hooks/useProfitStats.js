import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProfitStats() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, hunt_name, started_at, balance, duration_seconds, character_id')
        .order('started_at', { ascending: false })

      if (!cancelled) {
        if (!error) setSessions(data)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { sessions, loading }
}
