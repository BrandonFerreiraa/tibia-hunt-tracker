import { useState } from 'react'
import { useCharacterVerification } from '../hooks/useCharacterVerification'
import CharacterStats from './CharacterStats'

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
    return <span className="character-verified-badge">✔ Verificado</span>
  }

  return (
    <div className="character-verification">
      {code ? (
        <p>
          Cole <code>{code}</code> no campo "comment" do personagem em tibia.com, salve, e clique em
          "Conferir".
        </p>
      ) : (
        <p>Personagem ainda não verificado.</p>
      )}

      <div className="session-form-actions">
        <button type="button" onClick={handleGenerate} disabled={busy}>
          {code ? 'Gerar novo código' : 'Verificar personagem'}
        </button>
        {code && (
          <button type="button" onClick={handleCheck} disabled={busy}>
            Conferir
          </button>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}

function CharacterList({ characters, activeCharacterId, onSelect, onRemove, onRefresh }) {
  if (characters.length === 0) {
    return <p>Nenhum personagem cadastrado ainda. Adicione o primeiro acima.</p>
  }

  return (
    <ul className="character-list">
      {characters.map((character) => (
        <li
          key={character.id}
          className={character.id === activeCharacterId ? 'character-active' : ''}
        >
          <div className="character-row">
            <button type="button" onClick={() => onSelect(character.id)}>
              {character.name} ({character.world})
              {character.id === activeCharacterId ? ' ✓' : ''}
            </button>
            <button type="button" onClick={() => onRemove(character.id)} className="character-remove">
              Remover
            </button>
          </div>
          <CharacterVerification character={character} onVerified={onRefresh} />
          <CharacterStats character={character} onSynced={onRefresh} />
        </li>
      ))}
    </ul>
  )
}

export default CharacterList
