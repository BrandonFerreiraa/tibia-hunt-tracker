import { useState } from 'react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import HuntCard from './HuntCard'
import HuntDetailModal from './HuntDetailModal'

function computeProfitPerHour(balance, durationSeconds) {
  if (!durationSeconds) return 0
  return Math.round(balance / (durationSeconds / 3600))
}

function toHunt(session) {
  return {
    huntName: session.hunt_name,
    startedAt: session.started_at,
    durationSeconds: session.duration_seconds,
    xpPerHour: session.xp_per_hour,
    profitPerHour: computeProfitPerHour(session.balance, session.duration_seconds),
    balance: session.balance,
    monsterNames: session.monster_names,
  }
}

function SessionList({ sessions, onToggleShare, onRemove }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  if (sessions.length === 0) {
    return <Card className="text-sm text-text-muted">Nenhuma sessão registrada ainda para este personagem.</Card>
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <HuntCard
            key={session.id}
            hunt={toHunt(session)}
            onClick={() => setSelectedSessionId(session.id)}
            footer={
              (onToggleShare || onRemove) && (
                <div className="flex items-center justify-between gap-2">
                  {onToggleShare && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleShare(session.id, !session.is_shared)
                      }}
                      className="cursor-pointer"
                    >
                      <Badge variant={session.is_shared ? 'success' : 'neutral'}>
                        {session.is_shared
                          ? '🌐 Compartilhada — clique p/ tornar privada'
                          : '🔒 Privada — clique p/ compartilhar'}
                      </Badge>
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Excluir a hunt "${session.hunt_name}"? Essa ação não pode ser desfeita.`)) {
                          onRemove(session.id)
                        }
                      }}
                      className="cursor-pointer text-xs text-danger hover:underline"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              )
            }
          />
        ))}
      </div>

      {selectedSession && (
        <HuntDetailModal
          sessionId={selectedSession.id}
          hunt={toHunt(selectedSession)}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </>
  )
}

export default SessionList
