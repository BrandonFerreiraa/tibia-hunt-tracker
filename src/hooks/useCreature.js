import { useEffect, useState } from 'react'
import { getCreature } from '../lib/creaturesCache'

export function useCreature(monsterName) {
  const [creature, setCreature] = useState(null)
  const [loading, setLoading] = useState(Boolean(monsterName))

  useEffect(() => {
    let cancelled = false

    async function load() {
      const result = monsterName ? await getCreature(monsterName) : null
      if (!cancelled) {
        setCreature(result)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [monsterName])

  return { creature, loading }
}
