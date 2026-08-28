import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDuration } from '../lib/formatDuration'
import { useCreature } from '../hooks/useCreature'
import Modal from './ui/Modal'

function formatNumber(n) {
  return (n ?? 0).toLocaleString('pt-BR')
}

function MonsterRow({ monster }) {
  const [expanded, setExpanded] = useState(false)
  const { creature } = useCreature(monster.monster_name)

  return (
    <li className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full cursor-pointer items-center gap-3 p-2.5 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-hover">
          {creature?.imageUrl ? (
            <img src={creature.imageUrl} alt={creature.name} className="h-full w-full object-contain" />
          ) : (
            <span aria-hidden="true">🐾</span>
          )}
        </span>

        <span className="flex-1">
          <span className="block text-sm font-medium text-text">
            {formatNumber(monster.quantity)}x {monster.monster_name}
          </span>
          {creature && (
            <span className="block text-xs text-text-subtle">
              HP {formatNumber(creature.hitpoints)} · XP {formatNumber(creature.experiencePoints)}
            </span>
          )}
        </span>

        <span className="shrink-0 text-xs text-text-subtle">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-border p-2.5 text-xs text-text-muted">
          <strong className="mb-1 block uppercase tracking-wide text-text-subtle">Loot conhecido</strong>
          {creature?.lootList?.length > 0
            ? creature.lootList.join(', ')
            : 'Sem dados de loot conhecidos para este monstro.'}
        </div>
      )}
    </li>
  )
}

function HuntDetailModal({ sessionId, hunt, onClose, scope = 'own' }) {
  const [details, setDetails] = useState(null)

  // RLS de session_monsters/session_items só deixa o dono ver suas próprias
  // linhas — hunts de outros usuários (feed público) precisam das views
  // public_session_monsters/public_session_items (migration 017), que
  // liberam leitura de qualquer sessão marcada is_shared = true.
  const monstersTable = scope === 'public' ? 'public_session_monsters' : 'session_monsters'
  const itemsTable = scope === 'public' ? 'public_session_items' : 'session_items'

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [{ data: monsters }, { data: items }] = await Promise.all([
        supabase.from(monstersTable).select('monster_name, quantity').eq('session_id', sessionId),
        supabase.from(itemsTable).select('item_name, quantity').eq('session_id', sessionId),
      ])
      if (!cancelled) {
        setDetails({ monsters: monsters ?? [], items: items ?? [] })
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [sessionId, monstersTable, itemsTable])

  return (
    <Modal title={hunt.huntName} onClose={onClose}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
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

      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Monstros mortos</h4>
        {!details ? (
          <p className="text-sm text-text-muted">Carregando...</p>
        ) : details.monsters.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum monstro registrado para esta sessão.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {details.monsters.map((m) => (
              <MonsterRow key={m.monster_name} monster={m} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Itens lootados</h4>
        {!details ? (
          <p className="text-sm text-text-muted">Carregando...</p>
        ) : details.items.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum item registrado para esta sessão.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-text-muted">
            {details.items.map((i) => (
              <li key={i.item_name}>
                {formatNumber(i.quantity)}x {i.item_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

export default HuntDetailModal
