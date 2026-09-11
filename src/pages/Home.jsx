import { useEffect, useState } from 'react'
import { fetchBoostedBoss, fetchBoostedCreature } from '../lib/tibiaDataClient'
import { getRashidCityToday, RASHID_IMAGE_URL } from '../lib/rashid'
import Card from '../components/ui/Card'

const NAV_CARDS = [
  { view: 'dashboard', icon: '🗡️', label: 'Minhas Hunts', description: 'Registre e acompanhe suas hunts' },
  { view: 'feed', icon: '🌐', label: 'Hunts Compartilhadas', description: 'Veja o que a comunidade está caçando' },
  { view: 'profit', icon: '💰', label: 'Meu Profit', description: 'Profit diário, semanal e mensal' },
  { view: 'metas', icon: '🎯', label: 'Metas', description: 'Acompanhe suas metas de profit' },
  { view: 'settings', icon: '⚙️', label: 'Configurações', description: 'Personagens, conta e tema' },
]

function BoostCard({ title, boost, error }) {
  return (
    <Card className="flex flex-col items-center gap-2 text-center">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {error ? (
        <p className="text-xs text-text-subtle">Não foi possível carregar agora.</p>
      ) : boost ? (
        <>
          <img src={boost.imageUrl} alt={boost.name} className="h-16 w-16 object-contain" />
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
        <Card className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-sm font-semibold text-text">Rashid Hoje</h3>
          <img src={RASHID_IMAGE_URL} alt="Rashid" className="h-16 w-16 object-contain" />
          <p className="text-sm text-gold">{getRashidCityToday()}</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">Ir para</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => (
            <button key={card.view} type="button" onClick={() => onNavigate(card.view)} className="flex h-full text-left">
              <Card className="flex h-full w-full cursor-pointer items-start gap-3 transition-colors hover:border-accent/50">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {card.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-text">{card.label}</h3>
                  <p className="mt-1 text-sm text-text-muted">{card.description}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
