import { useHuntsFeed } from '../hooks/useHuntsFeed'
import { useHuntsFilters } from '../hooks/useHuntsFilters'
import { useCharacters } from '../hooks/useCharacters'
import { formatDuration } from '../lib/formatDuration'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { Input, Select, Label } from '../components/ui/Input'

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR')
}

function formatNumber(n) {
  return n.toLocaleString('pt-BR')
}

function HuntsFeed() {
  const { hunts, loading } = useHuntsFeed()
  const { characters } = useCharacters()
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
        <ul className="flex flex-col gap-3">
          {filteredHunts.map((hunt) => (
            <Card as="li" key={hunt.id}>
              <div className="flex items-baseline justify-between gap-2">
                <strong className="text-sm font-semibold text-text">{hunt.hunt_name}</strong>
                <span className="shrink-0 text-xs text-text-subtle">{formatDate(hunt.started_at)}</span>
              </div>

              <p className="mt-1 text-sm text-text-muted">
                {hunt.character_name} ({hunt.world})
                {ownCharacterIds.has(hunt.character_id) && (
                  <Badge variant="gold" className="ml-2">
                    Sua hunt
                  </Badge>
                )}
                {hunt.verified && (
                  <Badge variant="success" className="ml-2">
                    ✔ Level {hunt.stats_level} {hunt.stats_vocation}
                  </Badge>
                )}
              </p>

              <p className="mt-2 text-sm text-text-muted">
                Duração: {formatDuration(hunt.duration_seconds)} · XP/h:{' '}
                {formatNumber(hunt.xp_per_hour)} · Profit/h:{' '}
                <span className="font-medium text-gold">{formatNumber(hunt.profit_per_hour)}</span> · Total:{' '}
                {formatNumber(hunt.balance)}
              </p>

              {hunt.top_monsters && (
                <p className="mt-2 text-sm text-warning">🗡️ {hunt.top_monsters}</p>
              )}
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}

export default HuntsFeed
