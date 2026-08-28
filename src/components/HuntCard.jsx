import Card from './ui/Card'
import MonsterIconStrip from './MonsterIconStrip'
import { formatDuration } from '../lib/formatDuration'

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR')
}

function formatNumber(n) {
  return (n ?? 0).toLocaleString('pt-BR')
}

function HuntCardContent({ hunt, badges }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <strong className="text-sm font-semibold text-text">{hunt.huntName}</strong>
        <span className="shrink-0 text-xs text-text-subtle">{formatDate(hunt.startedAt)}</span>
      </div>

      {badges && <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">{badges}</div>}

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-text-subtle">Duração</dt>
          <dd className="text-text-muted">{formatDuration(hunt.durationSeconds)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-subtle">XP/h</dt>
          <dd className="text-text-muted">{formatNumber(hunt.xpPerHour)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-subtle">Profit/h</dt>
          <dd className="font-medium text-gold">{formatNumber(hunt.profitPerHour)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-subtle">Total</dt>
          <dd className="text-text-muted">{formatNumber(hunt.balance)}</dd>
        </div>
      </dl>

      <MonsterIconStrip monsterNames={hunt.monsterNames} />
    </>
  )
}

function HuntCard({ hunt, badges, footer, onClick }) {
  return (
    <Card className="flex w-full flex-col">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex cursor-pointer flex-col text-left transition-opacity hover:opacity-90"
        >
          <HuntCardContent hunt={hunt} badges={badges} />
        </button>
      ) : (
        <div className="flex flex-col">
          <HuntCardContent hunt={hunt} badges={badges} />
        </div>
      )}

      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  )
}

export default HuntCard
