import { useState } from 'react'
import { fetchCharacter } from '../lib/tibiaDataClient'
import { useCharacterVerification } from '../hooks/useCharacterVerification'
import { useCharacterStats, getAutoSkillCategory, isKnight, SKILL_CATEGORY_LABELS } from '../hooks/useCharacterStats'
import CharacterStats from './CharacterStats'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import CopyButton from './ui/CopyButton'
import { Select, Label } from './ui/Input'

const KNIGHT_CATEGORIES = ['swordfighting', 'axefighting', 'clubfighting']

function CharacterVerification({ character, onVerified }) {
  const { busy, generateVerificationCode, checkVerification } = useCharacterVerification()
  const { syncProfile, syncSkill } = useCharacterStats()
  const [code, setCode] = useState(character.verification_code)
  const [error, setError] = useState(null)
  const [askingKnightCategory, setAskingKnightCategory] = useState(false)
  const [knightCategory, setKnightCategory] = useState(KNIGHT_CATEGORIES[0])
  const [skillCategory, setSkillCategory] = useState(null)

  async function generateCodeWithCategory(category) {
    setSkillCategory(category)
    const result = await generateVerificationCode(character.id)
    if (result.error) {
      setError(result.error.message)
      return
    }
    setCode(result.code)
  }

  async function handleGenerate() {
    setError(null)

    let info = null
    try {
      info = await fetchCharacter(character.name)
    } catch {
      // Best-effort: se a busca falhar aqui, ainda dá pra gerar o código normalmente
      // (a skill é auto-detectada de novo, sem o ajuste manual de Knight, ao confirmar).
    }

    if (info && isKnight(info.vocation)) {
      setAskingKnightCategory(true)
      return
    }

    await generateCodeWithCategory(info ? getAutoSkillCategory(info.vocation) : null)
  }

  async function handleConfirmKnightCategory() {
    setAskingKnightCategory(false)
    await generateCodeWithCategory(knightCategory)
  }

  async function handleCheck() {
    setError(null)
    const result = await checkVerification(character.id)
    if (result.error) {
      setError(result.error.message)
      return
    }
    // Best-effort: uma falha de sync não deve impedir a verificação já confirmada.
    const profileResult = await syncProfile(character.id)
    const category = skillCategory ?? getAutoSkillCategory(profileResult.data?.vocation)
    if (category) await syncSkill(character.id, category)
    onVerified()
  }

  if (character.verified) {
    return <Badge variant="success">✔ Verificado</Badge>
  }

  if (askingKnightCategory) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-text-muted">Qual skill você mais usa pra hunt?</p>
        <Label className="max-w-40">
          Skill
          <Select value={knightCategory} onChange={(e) => setKnightCategory(e.target.value)}>
            {KNIGHT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {SKILL_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </Label>
        <Button variant="secondary" size="sm" onClick={handleConfirmKnightCategory} disabled={busy} className="w-fit">
          Continuar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {code ? (
        <p className="text-sm text-text-muted">
          Cole{' '}
          <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs font-semibold text-gold">
            {code}
          </code>{' '}
          <CopyButton text={code} />{' '}
          no campo "comment" do personagem em tibia.com, salve, e clique em "Conferir".
        </p>
      ) : (
        <p className="text-sm text-text-muted">Personagem ainda não verificado.</p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={busy}>
          {code ? 'Gerar novo código' : 'Verificar personagem'}
        </Button>
        {code && (
          <Button variant="secondary" size="sm" onClick={handleCheck} disabled={busy}>
            Conferir
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}

function CharacterList({ characters, activeCharacterId, onSelect, onRemove, onRefresh, onToggleType }) {
  if (characters.length === 0) {
    return (
      <Card className="text-sm text-text-muted">
        Nenhum personagem cadastrado ainda. Adicione o primeiro acima.
      </Card>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {characters.map((character) => {
        const isActive = character.id === activeCharacterId
        return (
          <Card
            as="li"
            key={character.id}
            className={isActive ? 'border-accent/50 ring-1 ring-accent/20' : ''}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(character.id)}
                  className={`cursor-pointer text-left text-sm font-semibold transition-colors ${
                    isActive ? 'text-accent' : 'text-text hover:text-accent'
                  }`}
                >
                  {character.name} <span className="font-normal text-text-muted">({character.world})</span>
                  {isActive && ' ✓'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleType(character.id, character.type === 'maker' ? 'principal' : 'maker')}
                  className="cursor-pointer"
                  title={character.type === 'maker' ? 'Clique para tornar Principal' : 'Clique para tornar Maker'}
                >
                  <Badge variant={character.type === 'maker' ? 'gold' : 'neutral'}>
                    {character.type === 'maker' ? 'Maker' : 'Principal'}
                  </Badge>
                </button>
              </div>
              <Button variant="danger" size="sm" onClick={() => onRemove(character.id)}>
                Remover
              </Button>
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <CharacterVerification character={character} onVerified={onRefresh} />
            </div>

            <CharacterStats character={character} onSynced={onRefresh} />
          </Card>
        )
      })}
    </ul>
  )
}

export default CharacterList
