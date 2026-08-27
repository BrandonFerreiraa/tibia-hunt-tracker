import { useState } from 'react'
import { useCharacterVerification } from '../hooks/useCharacterVerification'
import CharacterStats from './CharacterStats'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'

function CharacterVerification({ character, onVerified }) {
  const { busy, generateVerificationCode, checkVerification } = useCharacterVerification()
  const [code, setCode] = useState(character.verification_code)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setError(null)
    const result = await generateVerificationCode(character.id)
    if (result.error) {
      setError(result.error.message)
      return
    }
    setCode(result.code)
  }

  async function handleCheck() {
    setError(null)
    const result = await checkVerification(character.id)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onVerified()
  }

  if (character.verified) {
    return <Badge variant="success">✔ Verificado</Badge>
  }

  return (
    <div className="flex flex-col gap-2">
      {code ? (
        <p className="text-sm text-text-muted">
          Cole{' '}
          <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs font-semibold text-gold">
            {code}
          </code>{' '}
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
