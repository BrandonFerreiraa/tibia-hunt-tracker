import { dayKey } from './groupSessionsByDay'

export function daysBetweenInclusive(startDate, endDate) {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

export function profitInRange(sessions, startDate, endDate) {
  return sessions.reduce((sum, session) => {
    const key = dayKey(session.started_at)
    if (key >= startDate && key <= endDate) return sum + session.balance
    return sum
  }, 0)
}

export function computeDailyTarget({ targetGold, startDate, endDate, profitSoFarGold, today }) {
  const remaining = targetGold - profitSoFarGold
  if (remaining <= 0) return { met: true, dailyTargetGold: 0 }

  const effectiveToday = today < startDate ? startDate : today
  const daysRemaining = daysBetweenInclusive(effectiveToday, endDate)
  if (daysRemaining <= 0) return { met: false, dailyTargetGold: null }

  return { met: false, dailyTargetGold: Math.ceil(remaining / daysRemaining) }
}
