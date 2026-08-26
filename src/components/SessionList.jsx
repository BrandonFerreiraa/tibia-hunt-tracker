import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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

  if (loading) return <p>Carregando detalhes...</p>

  const { monsters, items } = details

  return (
    <div className="session-details">
      <div>
        <h4>Monstros mortos</h4>
        {monsters.length === 0 ? (
          <p>Nenhum monstro registrado para esta sessão.</p>
        ) : (
          <ul>
            {monsters.map((m) => (
              <li key={m.monster_name}>
                {formatNumber(m.quantity)}x {m.monster_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4>Itens lootados</h4>
        {items.length === 0 ? (
          <p>Nenhum item registrado para esta sessão.</p>
        ) : (
          <ul>
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

function SessionList({ sessions }) {
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
    return <p>Nenhuma sessão registrada ainda para este personagem.</p>
  }

  return (
    <ul className="session-list">
      {sessions.map((session) => {
        const isOpen = openIds.has(session.id)
        return (
          <li key={session.id}>
            <button
              type="button"
              className="session-card-toggle"
              onClick={() => toggleExpanded(session.id)}
            >
              <strong>{session.hunt_name}</strong> — {formatDate(session.started_at)}
              <br />
              Duração: {Math.round(session.duration_seconds / 60)} min | XP/h:{' '}
              {formatNumber(session.xp_per_hour)} | Profit: {formatNumber(session.balance)}
              <span className="session-card-chevron">{isOpen ? '▲' : '▼'}</span>
            </button>

            {mountedIds.has(session.id) && (
              <div className={isOpen ? '' : 'session-details-hidden'}>
                <SessionDetails sessionId={session.id} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default SessionList
