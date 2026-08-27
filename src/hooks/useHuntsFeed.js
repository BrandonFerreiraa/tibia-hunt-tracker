import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useHuntsFeed() {
  const [hunts, setHunts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.from('public_hunts_feed').select('*')
      if (!cancelled) {
        if (!error) setHunts(data)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { hunts, loading }
}
