import { useState } from 'react'
import { useProfitStats } from '../hooks/useProfitStats'
import { useCharacters } from '../hooks/useCharacters'
import { groupSessionsByDay, dayKey } from '../lib/groupSessionsByDay'
import Card from '../components/ui/Card'

function formatNumber(n) {
  return n.toLocaleString('pt-BR')
}

function formatDayLabel(dateKey) {
  const [year, month, day] = dateKey.split('-')
  return `${day}/${month}/${year}`
}

const TABS = [
  { key: 'daily', label: 'Diário' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensal' },
]

function daysInRange(tab) {
  const today = new Date()

  if (tab === 'daily') return [dayKey(today)]

  if (tab === 'weekly') {
    const keys = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      keys.push(dayKey(d))
    }
    return keys
  }

  const keys = []
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1)
  while (cursor <= today) {
    keys.push(dayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

function Profit() {
  const { sessions, loading: loadingSessions } = useProfitStats()
  const { characters, loading: loadingCharacters } = useCharacters()
  const [tab, setTab] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()))

  if (loadingSessions || loadingCharacters) {
    return <p className="text-sm text-text-muted">Carregando profit...</p>
  }

  const characterNames = new Map(characters.map((c) => [c.id, c.name]))
  const dayByKey = new Map(groupSessionsByDay(sessions).map((d) => [d.date, d]))

  const daysInTab = daysInRange(tab)
    .map((key) => dayByKey.get(key))
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const periodTotal = daysInTab.reduce((sum, d) => sum + d.profit, 0)
  const selectedDay = dayByKey.get(selectedDate) ?? { date: selectedDate, profit: 0, sessions: [] }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <p className="text-sm text-text-muted">Profit do período ({TABS.find((t) => t.key === tab).label.toLowerCase()})</p>
        <p className="text-2xl font-semibold text-gold">{formatNumber(periodTotal)}</p>
      </Card>

      {daysInTab.length === 0 ? (
        <Card className="text-sm text-text-muted">Nenhuma hunt registrada nesse período.</Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {daysInTab.map((day) => (
            <Card as="li" key={day.date} className="p-0">
              <button
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm ${
                  day.date === selectedDate ? 'text-accent' : 'text-text'
                }`}
              >
                <span className="font-medium">{formatDayLabel(day.date)}</span>
                <span className="text-gold">{formatNumber(day.profit)}</span>
              </button>
            </Card>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text">Detalhe de {formatDayLabel(selectedDate)}</h3>

        <Card>
          <p className="text-sm text-text-muted">
            Profit total: <span className="font-semibold text-gold">{formatNumber(selectedDay.profit)}</span>
          </p>
        </Card>

        {selectedDay.sessions.length === 0 ? (
          <Card className="text-sm text-text-muted">Nenhuma hunt registrada nesse dia.</Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedDay.sessions.map((session) => (
              <Card as="li" key={session.id} className="flex items-center justify-between text-sm">
                <div>
                  <strong className="text-text">{session.hunt_name}</strong>{' '}
                  <span className="text-text-muted">({characterNames.get(session.character_id)})</span>
                </div>
                <span className="text-gold">{formatNumber(session.balance)}</span>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default Profit
