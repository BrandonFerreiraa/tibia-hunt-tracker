import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) return null

  if (!user) return <Login />

  return (
    <div>
      <header className="app-header">
        <h1>Tibia Hunt Tracker</h1>
        <button type="button" onClick={signOut}>
          Sair
        </button>
      </header>
      <Dashboard />
    </div>
  )
}

export default App
