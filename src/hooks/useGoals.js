import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { dayKey } from '../lib/groupSessionsByDay'
import { profitInRange } from '../lib/goalCalculator'

async function closeGoalInDb(goal, profitGold) {
  const status = profitGold >= goal.target_gold ? 'completed' : 'failed'
  const { data, error } = await supabase
    .from('goals')
    .update({ status, final_profit_gold: profitGold, ended_at: new Date().toISOString() })
    .eq('id', goal.id)
    .select()
    .single()

  return error ? { ...goal, status, final_profit_gold: profitGold } : data
}

export function useGoals({ sessions, sessionsLoading }) {
  const [activeGoal, setActiveGoal] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionsLoading) return

    let cancelled = false

    async function load() {
      const [{ data: active, error: activeError }, { data: past, error: historyError }] = await Promise.all([
        supabase.from('goals').select('*').eq('status', 'active').maybeSingle(),
        supabase.from('goals').select('*').neq('status', 'active').order('end_date', { ascending: false }),
      ])

      let resolvedActive = activeError ? null : active
      let resolvedHistory = historyError ? [] : past

      if (resolvedActive && resolvedActive.end_date < dayKey(new Date())) {
        const profit = profitInRange(sessions, resolvedActive.start_date, resolvedActive.end_date)
        const closed = await closeGoalInDb(resolvedActive, profit)
        resolvedHistory = [closed, ...resolvedHistory]
        resolvedActive = null
      }

      if (!cancelled) {
        setActiveGoal(resolvedActive)
        setHistory(resolvedHistory)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [sessionsLoading, sessions])

  async function createGoal({ targetGold, startDate, endDate }) {
    let closedPrevious = null

    if (activeGoal) {
      const today = dayKey(new Date())
      const cutoffEnd = today < activeGoal.start_date ? activeGoal.start_date : today
      const profit = profitInRange(sessions, activeGoal.start_date, cutoffEnd)
      closedPrevious = await closeGoalInDb(activeGoal, profit)
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({ target_gold: targetGold, start_date: startDate, end_date: endDate })
      .select()
      .single()

    if (!error) {
      setActiveGoal(data)
      if (closedPrevious) setHistory((prev) => [closedPrevious, ...prev])
    }

    return { data, error }
  }

  async function cancelGoal() {
    if (!activeGoal) return { data: null, error: null }

    const { data, error } = await supabase
      .from('goals')
      .update({ status: 'cancelled', ended_at: new Date().toISOString() })
      .eq('id', activeGoal.id)
      .select()
      .single()

    if (!error) {
      setActiveGoal(null)
      setHistory((prev) => [data, ...prev])
    }

    return { data, error }
  }

  return { activeGoal, history, loading, createGoal, cancelGoal }
}
