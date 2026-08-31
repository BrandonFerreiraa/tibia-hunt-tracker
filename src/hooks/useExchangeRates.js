import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export function useExchangeRates() {
  const { user } = useAuth()
  const [rates, setRates] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('gold_per_tc, brl_per_250tc')
        .maybeSingle()

      if (!cancelled) {
        if (!error) {
          setRates(data ? { goldPerTc: data.gold_per_tc, brlPer250Tc: data.brl_per_250tc } : null)
        }
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  async function saveRates({ goldPerTc, brlPer250Tc }) {
    const { data, error } = await supabase
      .from('exchange_rates')
      .upsert({
        user_id: user.id,
        gold_per_tc: goldPerTc,
        brl_per_250tc: brlPer250Tc,
        updated_at: new Date().toISOString(),
      })
      .select('gold_per_tc, brl_per_250tc')
      .single()

    if (!error) {
      setRates({ goldPerTc: data.gold_per_tc, brlPer250Tc: data.brl_per_250tc })
    }

    return { data, error }
  }

  return { rates, loading, saveRates }
}
