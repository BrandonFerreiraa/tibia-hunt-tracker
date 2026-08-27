import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDuration } from '../lib/formatDuration'
import Card from './ui/Card'
import Badge from './ui/Badge'

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR')
}

function formatNumber(n) {
  return n.toLocaleString('pt-BR')
}

function SessionDetails({ sessionId }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [{ data: monsters }, { data: items }] = await Promise.all([
        supabase.from('session_monsters').select('monster_name, quantity').eq('session_id', sessionId),
        supabase.from('session_items').select('item_name, quantity').eq('session_id', sessionId),
      ])
      if (!cancelled) {
        setDetails({ monsters: monsters ?? [], items: items ?? [] })
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) return <p className="mt-3 text-sm text-text-muted">Carregando detalhes...</p>

  const { monsters, items } = details

  return (
    <div className="mt-3 grid grid-cols-1 gap-4 border-t border-border pt-3 sm:grid-cols-2">
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-subtle">
          Monstros mortos
        </h4>
        {monsters.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum monstro registrado para esta sessão.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-text-muted">
            {monsters.map((m) => (
              <li key={m.monster_name}>
                {formatNumber(m.quantity)}x {m.monster_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-subtle">
          Itens lootados
        </h4>
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum item registrado para esta sessão.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-text-muted">
            {items.map((i) => (
              <li key={i.item_name}>
                {formatNumber(i.quantity)}x {i.item_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SessionList({ sessions, onToggleShare }) {
  // openIds controls visibility; mountedIds is a superset that, once a session has been
  // expanded, keeps its <SessionDetails> mounted (hidden via CSS) so collapsing/re-expanding
  // never re-fetches monsters/items.
  const [openIds, setOpenIds] = useState(() => new Set())
  const [mountedIds, setMountedIds] = useState(() => new Set())

  function toggleExpanded(id) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setMountedIds((prev) => new Set(prev).add(id))
  }

  if (sessions.length === 0) {
    return <Card className="text-sm text-text-muted">Nenhuma sessão registrada ainda para este personagem.</Card>
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((session) => {
        const isOpen = openIds.has(session.id)
        return (
          <Card as="li" key={session.id}>
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="flex-1 cursor-pointer text-left"
                onClick={() => toggleExpanded(session.id)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-sm font-semibold text-text">{session.hunt_name}</strong>
                  <span className="shrink-0 text-xs text-text-subtle">{formatDate(session.started_at)}</span>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  Duração: {formatDuration(session.duration_seconds)} · XP/h:{' '}
                  {formatNumber(session.xp_per_hour)} · Profit:{' '}
                  <span className="text-gold">{formatNumber(session.balance)}</span>
                </p>
              </button>
              <span className="mt-0.5 shrink-0 text-xs text-text-subtle">{isOpen ? '▲' : '▼'}</span>
            </div>

            {onToggleShare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleShare(session.id, !session.is_shared)
                }}
                className="mt-2 cursor-pointer"
              >
                <Badge variant={session.is_shared ? 'success' : 'neutral'}>
                  {session.is_shared
                    ? '🌐 Compartilhada — clique p/ tornar privada'
                    : '🔒 Privada — clique p/ compartilhar'}
                </Badge>
              </button>
            )}

            {mountedIds.has(session.id) && (
              <div className={isOpen ? '' : 'hidden'}>
                <SessionDetails sessionId={session.id} />
              </div>
            )}
          </Card>
        )
      })}
    </ul>
  )
}

export default SessionList
