import { useState } from 'react'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { useGoals } from '../hooks/useGoals'
import { useProfitStats } from '../hooks/useProfitStats'
import { goldToTc, tcToBrl } from '../lib/currencyConverter'
import { dayKey } from '../lib/groupSessionsByDay'
import { computeDailyTarget, daysBetweenInclusive, profitInRange } from '../lib/goalCalculator'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Input, Label } from '../components/ui/Input'
import { FormattedGoldInput, FormattedCurrencyInput } from '../components/ui/FormattedNumberInput'

function formatDayLabel(dateKey) {
  const [year, month, day] = dateKey.split('-')
  return `${day}/${month}/${year}`
}

function formatGold(gold) {
  return gold.toLocaleString('pt-BR')
}

function RatesForm({ rates, onSave }) {
  const [goldPerTc, setGoldPerTc] = useState(() => (rates ? rates.goldPerTc : ''))
  const [brlPer250Tc, setBrlPer250Tc] = useState(() => (rates ? rates.brlPer250Tc : ''))
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const goldPerTcNum = Number(goldPerTc)
    const brlPer250TcNum = Number(brlPer250Tc)
    if (!(goldPerTcNum > 0) || !(brlPer250TcNum > 0)) return

    setSaving(true)
    await onSave({ goldPerTc: goldPerTcNum, brlPer250Tc: brlPer250TcNum })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <Label className="flex-1">
        Gold por TC
        <FormattedGoldInput value={goldPerTc} onValueChange={setGoldPerTc} placeholder="ex.: 45.000" required />
      </Label>
      <Label className="flex-1">
        Reais a cada 250 TC
        <FormattedCurrencyInput
          value={brlPer250Tc}
          onValueChange={setBrlPer250Tc}
          placeholder="ex.: R$ 47,50"
          required
        />
      </Label>
      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar taxas'}
      </Button>
    </form>
  )
}

function CurrencyConverter({ rates }) {
  const [amountGold, setAmountGold] = useState('')
  const gold = Number(amountGold) || 0
  const tc = rates ? goldToTc(gold, rates.goldPerTc) : 0
  const brl = rates ? tcToBrl(tc, rates.brlPer250Tc) : 0

  if (!rates) {
    return (
      <p className="text-sm text-text-muted">Configure suas taxas de câmbio acima pra usar o conversor.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Label className="max-w-xs">
        Valor em Gold
        <FormattedGoldInput value={amountGold} onValueChange={setAmountGold} placeholder="ex.: 80.000.000" />
      </Label>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-bg p-4 text-center">
          <p className="text-xs text-text-muted">Tibia Coins</p>
          <p className="text-lg font-semibold text-text">{tc.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} TC</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-4 text-center">
          <p className="text-xs text-text-muted">Reais</p>
          <p className="text-lg font-semibold text-accent">
            {brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
    </div>
  )
}

function GoalForm({ hasActiveGoal, onCreate }) {
  const [targetGold, setTargetGold] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [creating, setCreating] = useState(false)

  const isValid = Number(targetGold) > 0 && startDate && endDate && endDate >= startDate

  function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    if (hasActiveGoal) {
      setShowConfirm(true)
      return
    }
    submit()
  }

  async function submit() {
    setCreating(true)
    await onCreate({
      targetGold: Number(targetGold),
      startDate,
      endDate,
    })
    setCreating(false)
    setShowConfirm(false)
    setTargetGold('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-end">
        <Label className="min-w-[10rem] flex-1">
          Meta (Gold)
          <FormattedGoldInput value={targetGold} onValueChange={setTargetGold} placeholder="ex.: 80.000.000" required />
        </Label>
        <Label className="min-w-[10rem] flex-1">
          Data inicial
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Label>
        <Label className="min-w-[10rem] flex-1">
          Data final
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </Label>
        <Button type="submit" disabled={creating || !isValid}>
          {hasActiveGoal ? 'Criar nova meta' : 'Criar meta'}
        </Button>
      </form>

      {showConfirm && (
        <Modal title="Encerrar meta atual?" onClose={() => setShowConfirm(false)}>
          <p className="text-sm text-text-muted">
            Você já tem uma meta ativa. Criar uma nova vai encerrar a meta atual agora — o progresso até
            aqui vai pro histórico — e começar a nova no lugar dela.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={submit} disabled={creating}>
              {creating ? 'Encerrando...' : 'Encerrar e criar nova'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-3 text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-base font-semibold text-gold">{value}</p>
    </div>
  )
}

function GoalProgress({ goal, sessions, rates, onCancel }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const today = dayKey(new Date())
  const profitSoFarGold = profitInRange(sessions, goal.start_date, goal.end_date)
  const { met, dailyTargetGold } = computeDailyTarget({
    targetGold: goal.target_gold,
    startDate: goal.start_date,
    endDate: goal.end_date,
    profitSoFarGold,
    today,
  })

  const effectiveToday = today < goal.start_date ? goal.start_date : today
  const daysRemaining = Math.max(daysBetweenInclusive(effectiveToday, goal.end_date), 0)
  const remainingGold = Math.max(goal.target_gold - profitSoFarGold, 0)

  const dailyTc = rates && dailyTargetGold != null ? goldToTc(dailyTargetGold, rates.goldPerTc) : null
  const dailyBrl = dailyTc != null ? tcToBrl(dailyTc, rates.brlPer250Tc) : null

  async function handleConfirmCancel() {
    setCancelling(true)
    await onCancel()
    setCancelling(false)
    setShowCancelConfirm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-subtle">
          {formatDayLabel(goal.start_date)} até {formatDayLabel(goal.end_date)}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowCancelConfirm(true)}>
          Cancelar meta
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Meta" value={formatGold(goal.target_gold)} />
        <Stat label="Já feito" value={formatGold(profitSoFarGold)} />
        <Stat label="Falta" value={formatGold(remainingGold)} />
        <Stat label="Dias restantes" value={String(daysRemaining)} />
      </div>

      {met ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center text-sm font-semibold text-success">
          Meta batida! 🎉
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-bg p-4 text-center">
          <p className="text-xs text-text-muted">Meta diária pra continuar no ritmo</p>
          <p className="text-lg font-semibold text-gold">{formatGold(dailyTargetGold ?? 0)}</p>
          {dailyTc != null && (
            <p className="text-xs text-text-subtle">
              ≈ {dailyTc.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} TC ·{' '}
              {dailyBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
      )}

      {showCancelConfirm && (
        <Modal title="Cancelar meta?" onClose={() => setShowCancelConfirm(false)}>
          <p className="text-sm text-text-muted">
            A meta atual será cancelada e não vai contar como batida nem como não batida — só some do
            painel e fica no histórico marcada como "Cancelada".
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} disabled={cancelling}>
              {cancelling ? 'Cancelando...' : 'Cancelar meta'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const HISTORY_STATUS = {
  completed: { label: 'Batida', variant: 'success' },
  failed: { label: 'Não batida', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'neutral' },
}

function GoalHistory({ goals }) {
  if (goals.length === 0) {
    return <p className="text-sm text-text-muted">Nenhuma meta encerrada ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {goals.map((goal) => {
        const status = HISTORY_STATUS[goal.status] ?? HISTORY_STATUS.failed
        return (
          <Card as="li" key={goal.id} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="text-text">
                {formatGold(goal.target_gold)} · {formatDayLabel(goal.start_date)} a {formatDayLabel(goal.end_date)}
              </p>
              {goal.status !== 'cancelled' && (
                <p className="text-xs text-text-muted">Resultado final: {formatGold(goal.final_profit_gold ?? 0)}</p>
              )}
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </Card>
        )
      })}
    </ul>
  )
}

function Goals() {
  const { rates, loading: loadingRates, saveRates } = useExchangeRates()
  const { sessions, loading: loadingSessions } = useProfitStats()
  const { activeGoal, history, loading: loadingGoals, createGoal, cancelGoal } = useGoals({
    sessions,
    sessionsLoading: loadingSessions,
  })

  if (loadingRates) {
    return <p className="text-sm text-text-muted">Carregando conversor...</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Taxas de Câmbio</h2>

        <Card>
          <RatesForm key={rates ? 'loaded' : 'empty'} rates={rates} onSave={saveRates} />
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Conversor</h2>

        <Card>
          <CurrencyConverter rates={rates} />
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Meta de Profit</h2>

        <Card>
          <GoalForm hasActiveGoal={Boolean(activeGoal)} onCreate={createGoal} />
        </Card>

        {loadingSessions || loadingGoals ? (
          <p className="text-sm text-text-muted">Carregando meta...</p>
        ) : activeGoal ? (
          <Card>
            <GoalProgress goal={activeGoal} sessions={sessions} rates={rates} onCancel={cancelGoal} />
          </Card>
        ) : (
          <Card className="text-sm text-text-muted">Nenhuma meta ativa no momento.</Card>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Histórico de Metas</h2>

        {loadingGoals ? (
          <p className="text-sm text-text-muted">Carregando histórico...</p>
        ) : (
          <GoalHistory goals={history} />
        )}
      </section>
    </div>
  )
}

export default Goals
