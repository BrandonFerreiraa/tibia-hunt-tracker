import { useMemo, useState } from 'react'

const EMPTY_FILTERS = { monster: '', world: '', vocation: '', dateFrom: '', dateTo: '' }

const SORTERS = {
  recent: (a, b) => new Date(b.started_at) - new Date(a.started_at),
  profit: (a, b) => b.profit_per_hour - a.profit_per_hour,
  xp: (a, b) => b.xp_per_hour - a.xp_per_hour,
}

export function useHuntsFilters(hunts) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState('recent')

  const worlds = useMemo(() => [...new Set(hunts.map((h) => h.world))].sort(), [hunts])
  const vocations = useMemo(
    () => [...new Set(hunts.map((h) => h.stats_vocation).filter(Boolean))].sort(),
    [hunts]
  )

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  const filteredAndSorted = useMemo(() => {
    const result = hunts.filter((hunt) => {
      if (filters.monster) {
        const names = hunt.all_monster_names ?? []
        const match = names.some((n) => n.toLowerCase().includes(filters.monster.toLowerCase()))
        if (!match) return false
      }
      if (filters.world && hunt.world !== filters.world) return false
      if (filters.vocation && hunt.stats_vocation !== filters.vocation) return false
      if (filters.dateFrom && new Date(hunt.started_at) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(hunt.started_at) > new Date(`${filters.dateTo}T23:59:59`)) return false
      return true
    })

    return [...result].sort(SORTERS[sortBy])
  }, [hunts, filters, sortBy])

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    sortBy,
    setSortBy,
    worlds,
    vocations,
    filteredHunts: filteredAndSorted,
  }
}
