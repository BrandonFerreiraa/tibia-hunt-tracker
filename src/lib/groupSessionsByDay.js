export function dayKey(dateOrIso) {
  const d = new Date(dateOrIso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function groupSessionsByDay(sessions) {
  const buckets = new Map()

  for (const session of sessions) {
    const key = dayKey(session.started_at)
    if (!buckets.has(key)) {
      buckets.set(key, { date: key, profit: 0, sessions: [] })
    }
    const bucket = buckets.get(key)
    bucket.profit += session.balance
    bucket.sessions.push(session)
  }

  return [...buckets.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
}
