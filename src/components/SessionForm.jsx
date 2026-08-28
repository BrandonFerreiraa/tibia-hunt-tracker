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

function SessionForm({ activeCharacterId, onSave }) {
  const [rawText, setRawText] = useState('')
  const [mode, setMode] = useState('paste') // 'paste' | 'preview'
  const [parsed, setParsed] = useState(null)
  const [huntName, setHuntName] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function handleAnalyze() {
    setError(null)
    const result = parseSessionText(rawText)
    if (!result) {
      setError(
        'Não consegui reconhecer esse texto. Confira se colou o conteúdo completo do Session Analyser e tente de novo.'
      )
      return
    }
    setParsed(result)
    setMode('preview')
  }

  function updateParsedField(key, value) {
    setParsed((prev) => ({ ...prev, [key]: Number(value) }))
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

    const payload = {
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

    const { error: saveError } = await onSave(payload)
    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setRawText('')
    setParsed(null)
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

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button onClick={handleAnalyze} disabled={!rawText.trim()}>
            Analisar
          </Button>
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
    </div>
  )
}

export default SessionForm
