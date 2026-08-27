import AccountSettings from '../components/AccountSettings'
import CharacterForm from '../components/CharacterForm'
import CharacterList from '../components/CharacterList'
import Card from '../components/ui/Card'
import { useCharacters } from '../hooks/useCharacters'

function Settings() {
  const {
    characters,
    loading: loadingCharacters,
    activeCharacterId,
    selectCharacter,
    addCharacter,
    updateCharacterType,
    removeCharacter,
    refresh: refreshCharacters,
  } = useCharacters()

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
            onToggleType={updateCharacterType}
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Conta</h2>

        <Card>
          <AccountSettings />
        </Card>
      </section>
    </div>
  )
}

export default Settings
