import CharacterForm from '../components/CharacterForm'
import CharacterList from '../components/CharacterList'
import SessionForm from '../components/SessionForm'
import SessionList from '../components/SessionList'
import Card from '../components/ui/Card'
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

  const { sessions, loading: loadingSessions, addSession, toggleShare } = useSessions(activeCharacterId)

  function handleRemoveCharacter(id) {
    const character = characters.find((c) => c.id === id)
    if (!character) return
    if (!window.confirm(`Remover "${character.name}"? Isso também remove todas as sessões dele.`)) {
      return
    }
    removeCharacter(id)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Personagens</h2>

        <Card>
          <CharacterForm onAddCharacter={addCharacter} />
        </Card>

        {loadingCharacters ? (
          <p className="text-sm text-text-muted">Carregando personagens...</p>
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

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Sessões</h2>

        {!activeCharacterId ? (
          <Card className="text-sm text-text-muted">
            Cadastre e selecione um personagem acima para registrar sessões.
          </Card>
        ) : (
          <>
            <Card>
              <SessionForm activeCharacterId={activeCharacterId} onSave={addSession} />
              <p className="mt-3 text-xs text-text-subtle">
                Novas sessões são compartilhadas publicamente no feed por padrão — use o botão em cada
                sessão pra torná-la privada se preferir.
              </p>
            </Card>

            {loadingSessions ? (
              <p className="text-sm text-text-muted">Carregando sessões...</p>
            ) : (
              <SessionList sessions={sessions} onToggleShare={toggleShare} />
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default Dashboard
