import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HuntsFeed from './pages/HuntsFeed'

function App() {
  const { user, loading, signOut } = useAuth()
  const [view, setView] = useState('dashboard')

  if (loading) return null

  if (!user) return <Login />

  return (
    <div>
      <header className="app-header">
        <h1>Tibia Hunt Tracker</h1>
        <nav className="app-nav">
          <button
            type="button"
            className={view === 'dashboard' ? 'app-nav-active' : ''}
            onClick={() => setView('dashboard')}
          >
            Minhas Hunts
          </button>
          <button
            type="button"
            className={view === 'feed' ? 'app-nav-active' : ''}
            onClick={() => setView('feed')}
          >
            Feed
          </button>
        </nav>
        <button type="button" onClick={signOut}>
          Sair
        </button>
      </header>
      {view === 'dashboard' ? <Dashboard /> : <HuntsFeed />}
    </div>
  )
}

export default App
