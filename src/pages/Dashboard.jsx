import CharacterForm from '../components/CharacterForm'
import CharacterList from '../components/CharacterList'
import SessionForm from '../components/SessionForm'
import SessionList from '../components/SessionList'
import { useCharacters } from '../hooks/useCharacters'
import { useSessions } from '../hooks/useSessions'

function Dashboard() {
  const {
    characters,
    loading: loadingCharacters,
    activeCharacterId,
    selectCharacter,
    addCharacter,
    removeCharacter,
    refresh: refreshCharacters,
  } = useCharacters()

  const { sessions, loading: loadingSessions, addSession } = useSessions(activeCharacterId)

  function handleRemoveCharacter(id) {
    const character = characters.find((c) => c.id === id)
    if (!character) return
    if (!window.confirm(`Remover "${character.name}"? Isso também remove todas as sessões dele.`)) {
      return
    }
    removeCharacter(id)
  }

  return (
    <div>
      <section>
        <h2>Personagens</h2>
        <CharacterForm onAddCharacter={addCharacter} />
        {loadingCharacters ? (
          <p>Carregando personagens...</p>
        ) : (
          <CharacterList
            characters={characters}
            activeCharacterId={activeCharacterId}
            onSelect={selectCharacter}
            onRemove={handleRemoveCharacter}
            onRefresh={refreshCharacters}
          />
        )}
      </section>

      <section>
        <h2>Sessões</h2>
        {!activeCharacterId ? (
          <p>Cadastre e selecione um personagem acima para registrar sessões.</p>
        ) : (
          <>
            <SessionForm activeCharacterId={activeCharacterId} onSave={addSession} />
            {loadingSessions ? <p>Carregando sessões...</p> : <SessionList sessions={sessions} />}
          </>
        )}
      </section>
    </div>
  )
}

export default Dashboard
