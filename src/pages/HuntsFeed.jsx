import { useState } from 'react'
import { useHuntsFeed } from '../hooks/useHuntsFeed'
import { useHuntsFilters } from '../hooks/useHuntsFilters'
import { useCharacters } from '../hooks/useCharacters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import HuntCard from '../components/HuntCard'
import HuntDetailModal from '../components/HuntDetailModal'
import { Input, Select, Label } from '../components/ui/Input'

function toHunt(hunt) {
  return {
    huntName: hunt.hunt_name,
    startedAt: hunt.started_at,
    durationSeconds: hunt.duration_seconds,
    xpPerHour: hunt.xp_per_hour,
    profitPerHour: hunt.profit_per_hour,
    balance: hunt.balance,
    monsterNames: hunt.all_monster_names,
  }
}

function HuntsFeed() {
  const { hunts, loading } = useHuntsFeed()
  const { characters } = useCharacters()
  const [selectedHuntId, setSelectedHuntId] = useState(null)
  const ownCharacterIds = new Set(characters.map((c) => c.id))
  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    sortBy,
    setSortBy,
    worlds,
    vocations,
    filteredHunts,
  } = useHuntsFilters(hunts)

  if (loading) return <p className="text-sm text-text-muted">Carregando feed...</p>

  if (hunts.length === 0) {
    return (
      <Card className="text-sm text-text-muted">
        Nenhuma hunt compartilhada ainda. Seja o primeiro a compartilhar uma!
      </Card>
    )
  }

  const selectedHunt = hunts.find((h) => h.id === selectedHuntId)

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-wrap items-end gap-3">
        <Input
          type="text"
          placeholder="Filtrar por monstro"
          value={filters.monster}
          onChange={(e) => updateFilter('monster', e.target.value)}
          className="w-44"
        />

        <Select
          value={filters.world}
          onChange={(e) => updateFilter('world', e.target.value)}
          className="w-auto"
        >
          <option value="">Todos os mundos</option>
          {worlds.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </Select>

        <Select
          value={filters.vocation}
          onChange={(e) => updateFilter('vocation', e.target.value)}
          className="w-auto"
        >
          <option value="">Todas as vocações</option>
          {vocations.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>

        <Label>
          De
          <Input type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
        </Label>

        <Label>
          Até
          <Input type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
        </Label>

        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-auto">
          <option value="recent">Mais recente</option>
          <option value="profit">Maior profit/h</option>
          <option value="xp">Maior XP/h</option>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </Card>

      {filteredHunts.length === 0 ? (
        <Card className="text-sm text-text-muted">Nenhuma hunt encontrada com esses filtros.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHunts.map((hunt) => (
            <HuntCard
              key={hunt.id}
              hunt={toHunt(hunt)}
              onClick={() => setSelectedHuntId(hunt.id)}
              badges={
                <>
                  <span>
                    {hunt.character_name} ({hunt.world})
                  </span>
                  {ownCharacterIds.has(hunt.character_id) && <Badge variant="gold">Sua hunt</Badge>}
                  {hunt.verified && (
                    <Badge variant="success">
                      ✔ Level {hunt.stats_level} {hunt.stats_vocation}
                    </Badge>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      {selectedHunt && (
        <HuntDetailModal
          sessionId={selectedHunt.id}
          hunt={toHunt(selectedHunt)}
          onClose={() => setSelectedHuntId(null)}
          scope="public"
        />
      )}
    </div>
  )
}

export default HuntsFeed
