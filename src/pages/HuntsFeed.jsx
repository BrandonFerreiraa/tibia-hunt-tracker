import { useHuntsFeed } from '../hooks/useHuntsFeed'
import { useHuntsFilters } from '../hooks/useHuntsFilters'

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR')
}

function formatNumber(n) {
  return n.toLocaleString('pt-BR')
}

function HuntsFeed() {
  const { hunts, loading } = useHuntsFeed()
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

  if (loading) return <p>Carregando feed...</p>

  if (hunts.length === 0) {
    return <p>Nenhuma hunt compartilhada ainda. Seja o primeiro a compartilhar uma!</p>
  }

  return (
    <div>
      <div className="hunts-filters">
        <input
          type="text"
          placeholder="Filtrar por monstro"
          value={filters.monster}
          onChange={(e) => updateFilter('monster', e.target.value)}
        />

        <select value={filters.world} onChange={(e) => updateFilter('world', e.target.value)}>
          <option value="">Todos os mundos</option>
          {worlds.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        <select value={filters.vocation} onChange={(e) => updateFilter('vocation', e.target.value)}>
          <option value="">Todas as vocações</option>
          {vocations.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <label>
          De
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </label>

        <label>
          Até
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </label>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Mais recente</option>
          <option value="profit">Maior profit/h</option>
          <option value="xp">Maior XP/h</option>
        </select>

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
      </div>

      {filteredHunts.length === 0 ? (
        <p>Nenhuma hunt encontrada com esses filtros.</p>
      ) : (
        <ul className="hunts-feed">
          {filteredHunts.map((hunt) => (
            <li key={hunt.id}>
              <div className="hunts-feed-header">
                <strong>{hunt.hunt_name}</strong>
                <span className="hunts-feed-date">{formatDate(hunt.started_at)}</span>
              </div>

              <p className="hunts-feed-character">
                {hunt.character_name} ({hunt.world})
                {hunt.verified && (
                  <span className="character-verified-badge">
                    {' '}
                    ✔ Level {hunt.stats_level} {hunt.stats_vocation}
                  </span>
                )}
              </p>

              <p>
                Duração: {Math.round(hunt.duration_seconds / 60)} min | XP/h:{' '}
                {formatNumber(hunt.xp_per_hour)} | Profit/h: {formatNumber(hunt.profit_per_hour)} | Profit
                total: {formatNumber(hunt.balance)}
              </p>

              {hunt.top_monsters && <p className="hunts-feed-monsters">🗡️ {hunt.top_monsters}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default HuntsFeed
