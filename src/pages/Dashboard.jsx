import SessionForm from '../components/SessionForm'
import SessionList from '../components/SessionList'
import Card from '../components/ui/Card'
import { Select, Label } from '../components/ui/Input'
import { useCharacters } from '../hooks/useCharacters'
import { useSessions } from '../hooks/useSessions'

function Dashboard() {
  const { characters, activeCharacterId, selectCharacter, loading: loadingCharacters } = useCharacters()

  const { sessions, loading: loadingSessions, addSession, toggleShare, removeSession } = useSessions(activeCharacterId)

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">Hunts</h2>

        {loadingCharacters ? (
          <p className="text-sm text-text-muted">Carregando personagens...</p>
        ) : characters.length === 0 ? (
          <Card className="text-sm text-text-muted">
            Cadastre um personagem na aba Configurações para registrar hunts.
          </Card>
        ) : (
          <>
            <Label className="max-w-xs">
              Personagem
              <Select value={activeCharacterId ?? ''} onChange={(e) => selectCharacter(e.target.value)}>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name} ({character.world})
                  </option>
                ))}
              </Select>
            </Label>

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
              <SessionList sessions={sessions} onToggleShare={toggleShare} onRemove={removeSession} />
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default Dashboard
