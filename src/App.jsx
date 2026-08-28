import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HuntsFeed from './pages/HuntsFeed'
import Profit from './pages/Profit'
import Settings from './pages/Settings'
import Button from './components/ui/Button'

function App() {
  const { user, loading, signOut } = useAuth()
  const [view, setView] = useState('dashboard')

  if (loading) return null

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-base font-bold tracking-tight text-text">
              Tibia<span className="text-accent">Hunt</span>
            </h1>

            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  view === 'dashboard'
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Minhas Hunts
              </button>
              <button
                type="button"
                onClick={() => setView('feed')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  view === 'feed' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                Hunts Compartilhadas
              </button>
              <button
                type="button"
                onClick={() => setView('profit')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  view === 'profit' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                Meu Profit
              </button>
              <button
                type="button"
                onClick={() => setView('settings')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  view === 'settings' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                Configurações
              </button>
            </nav>
          </div>

          <Button variant="secondary" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {view === 'dashboard' && <Dashboard />}
        {view === 'feed' && <HuntsFeed />}
        {view === 'profit' && <Profit />}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  )
}

export default App
