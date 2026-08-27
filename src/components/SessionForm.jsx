import { useState } from 'react'
import { formatDuration } from '../lib/formatDuration'
import { parseSessionText } from '../lib/sessionParser'
import Button from './ui/Button'
import { Input, Textarea, Label } from './ui/Input'

const NUMERIC_FIELDS = [
  ['xpGain', 'XP Gain'],
  ['rawXpGain', 'Raw XP Gain'],
  ['xpPerHour', 'XP/h'],
  ['rawXpPerHour', 'Raw XP/h'],
  ['loot', 'Loot'],
  ['supplies', 'Supplies'],
  ['balance', 'Balance'],
  ['damage', 'Damage'],
  ['damagePerHour', 'Damage/h'],
  ['healing', 'Healing'],
  ['healingPerHour', 'Healing/h'],
]

const EMPTY_MANUAL_FIELDS = NUMERIC_FIELDS.reduce((acc, [key]) => ({ ...acc, [key]: '' }), {})

function SessionForm({ activeCharacterId, onSave }) {
  const [rawText, setRawText] = useState('')
  const [mode, setMode] = useState('paste') // 'paste' | 'preview' | 'manual'
  const [parsed, setParsed] = useState(null)
  const [manualFields, setManualFields] = useState(EMPTY_MANUAL_FIELDS)
  const [manualDuration, setManualDuration] = useState('')
  const [huntName, setHuntName] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function handleAnalyze() {
    setError(null)
    const result = parseSessionText(rawText)
    if (!result) {
      setMode('manual')
      return
    }
    setParsed(result)
    setMode('preview')
  }

  function updateParsedField(key, value) {
    setParsed((prev) => ({ ...prev, [key]: Number(value) }))
  }

  function updateManualField(key, value) {
    setManualFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!activeCharacterId) {
      setError('Selecione um personagem ativo antes de salvar uma sessão.')
      return
    }
    if (!huntName.trim()) {
      setError('Informe o nome da hunt.')
      return
    }

    setError(null)
    setSaving(true)

    let payload

    if (mode === 'preview' && parsed) {
      payload = {
        character_id: activeCharacterId,
        hunt_name: huntName.trim(),
        started_at: parsed.startedAt,
        ended_at: parsed.endedAt,
        duration_seconds: parsed.durationSeconds,
        raw_xp_gain: parsed.rawXpGain,
        xp_gain: parsed.xpGain,
        xp_per_hour: parsed.xpPerHour,
        raw_xp_per_hour: parsed.rawXpPerHour,
        loot: parsed.loot,
        supplies: parsed.supplies,
        balance: parsed.balance,
        damage: parsed.damage,
        damage_per_hour: parsed.damagePerHour,
        healing: parsed.healing,
        healing_per_hour: parsed.healingPerHour,
        source: 'parsed',
        monsters: parsed.monsters,
        items: parsed.items,
      }
    } else {
      const durationMinutes = Number(manualDuration)
      if (!durationMinutes || durationMinutes <= 0) {
        setError('Informe a duração da sessão em minutos.')
        setSaving(false)
        return
      }
      const now = new Date()
      const startedAt = new Date(now.getTime() - durationMinutes * 60000)
      const durationSeconds = durationMinutes * 60

      payload = {
        character_id: activeCharacterId,
        hunt_name: huntName.trim(),
        started_at: startedAt.toISOString(),
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
        raw_xp_gain: Number(manualFields.rawXpGain) || 0,
        xp_gain: Number(manualFields.xpGain) || 0,
        xp_per_hour: Number(manualFields.xpPerHour) || Math.round(((Number(manualFields.xpGain) || 0) / durationSeconds) * 3600),
        raw_xp_per_hour: Number(manualFields.rawXpPerHour) || 0,
        loot: Number(manualFields.loot) || 0,
        supplies: Number(manualFields.supplies) || 0,
        balance:
          Number(manualFields.balance) ||
          (Number(manualFields.loot) || 0) - (Number(manualFields.supplies) || 0),
        damage: Number(manualFields.damage) || 0,
        damage_per_hour: Number(manualFields.damagePerHour) || 0,
        healing: Number(manualFields.healing) || 0,
        healing_per_hour: Number(manualFields.healingPerHour) || 0,
        source: 'manual',
        monsters: [],
        items: [],
      }
    }

    const { error: saveError } = await onSave(payload)
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setRawText('')
    setParsed(null)
    setManualFields(EMPTY_MANUAL_FIELDS)
    setManualDuration('')
    setHuntName('')
    setMode('paste')
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-text">Registrar Sessão</h3>

      {mode === 'paste' && (
        <div className="flex flex-col gap-3">
          <Textarea
            rows={8}
            placeholder="Cole aqui o texto do Session Analyser..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={!rawText.trim()}>
              Analisar
            </Button>
            <Button variant="secondary" onClick={() => setMode('manual')}>
              Preencher manualmente
            </Button>
          </div>
        </div>
      )}

      {mode === 'preview' && parsed && (
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
            Revise os campos abaixo antes de salvar. Duração detectada:{' '}
            {formatDuration(parsed.durationSeconds)}.
          </p>

          <Input
            type="text"
            placeholder="Nome da hunt"
            value={huntName}
            onChange={(e) => setHuntName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NUMERIC_FIELDS.map(([key, label]) => (
              <Label key={key}>
                {label}
                <Input type="number" value={parsed[key]} onChange={(e) => updateParsedField(key, e.target.value)} />
              </Label>
            ))}
          </div>

          <p className="text-xs text-text-muted">
            {parsed.monsters.length} tipo(s) de monstro morto(s), {parsed.items.length} tipo(s) de item
            lootado(s).
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              Salvar Sessão
            </Button>
            <Button variant="secondary" onClick={() => setMode('paste')}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
            {rawText.trim()
              ? 'Não consegui reconhecer o texto colado. Preencha manualmente (o texto colado continua salvo abaixo, caso queira tentar novamente).'
              : 'Preenchimento manual da sessão.'}
          </p>

          <Input
            type="text"
            placeholder="Nome da hunt"
            value={huntName}
            onChange={(e) => setHuntName(e.target.value)}
          />

          <Label className="max-w-40">
            Duração (minutos)
            <Input type="number" value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} />
          </Label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NUMERIC_FIELDS.map(([key, label]) => (
              <Label key={key}>
                {label}
                <Input
                  type="number"
                  value={manualFields[key]}
                  onChange={(e) => updateManualField(key, e.target.value)}
                />
              </Label>
            ))}
          </div>

          {rawText.trim() && (
            <details className="text-sm text-text-muted">
              <summary className="cursor-pointer">Texto colado original</summary>
              <Textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="mt-2"
              />
              <Button variant="secondary" size="sm" onClick={handleAnalyze} className="mt-2">
                Tentar analisar de novo
              </Button>
            </details>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              Salvar Sessão
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMode('paste')
                setError(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionForm
