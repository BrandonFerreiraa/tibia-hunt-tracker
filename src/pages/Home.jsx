import { useEffect, useState } from 'react'
import { fetchBoostedBoss, fetchBoostedCreature } from '../lib/tibiaDataClient'
import { getRashidCityToday } from '../lib/rashid'
import Card from '../components/ui/Card'

const NAV_CARDS = [
  { view: 'dashboard', label: 'Minhas Hunts', description: 'Registre e acompanhe suas hunts' },
  { view: 'feed', label: 'Hunts Compartilhadas', description: 'Veja o que a comunidade está caçando' },
  { view: 'profit', label: 'Meu Profit', description: 'Profit diário, semanal e mensal' },
  { view: 'metas', label: 'Metas', description: 'Acompanhe suas metas de profit' },
  { view: 'settings', label: 'Configurações', description: 'Personagens, conta e tema' },
]

function BoostCard({ title, boost, error }) {
  return (
    <Card className="flex flex-col items-center gap-2 text-center">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {error ? (
        <p className="text-xs text-text-subtle">Não foi possível carregar agora.</p>
      ) : boost ? (
        <>
          <img src={boost.imageUrl} alt={boost.name} className="h-16 w-16" />
          <p className="text-sm text-gold">{boost.name}</p>
        </>
      ) : (
        <p className="text-xs text-text-muted">Carregando...</p>
      )}
    </Card>
  )
}

function Home({ onNavigate }) {
  const [boss, setBoss] = useState(null)
  const [bossError, setBossError] = useState(false)
  const [creature, setCreature] = useState(null)
  const [creatureError, setCreatureError] = useState(false)

  useEffect(() => {
    fetchBoostedBoss()
      .then(setBoss)
      .catch(() => setBossError(true))

    fetchBoostedCreature()
      .then(setCreature)
      .catch(() => setCreatureError(true))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BoostCard title="Boss Boostado" boost={boss} error={bossError} />
        <BoostCard title="Criatura Boostada" boost={creature} error={creatureError} />
        <Card className="flex flex-col items-center justify-center gap-2 text-center">
          <h3 className="text-sm font-semibold text-text">Rashid Hoje</h3>
          <p className="text-sm text-gold">{getRashidCityToday()}</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">Ir para</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <button key={card.view} type="button" onClick={() => onNavigate(card.view)} className="text-left">
              <Card className="cursor-pointer transition-colors hover:border-accent/50">
                <h3 className="text-sm font-semibold text-text">{card.label}</h3>
                <p className="mt-1 text-sm text-text-muted">{card.description}</p>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
