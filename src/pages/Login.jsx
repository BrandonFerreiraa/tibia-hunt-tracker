import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const { error: authError } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)

    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (mode === 'signup') {
      setInfo('Conta criada. Verifique seu email para confirmar antes de entrar.')
    }
  }

  return (
    <div className="auth-page">
      <h1>Tibia Hunt Tracker</h1>
      <form onSubmit={handleSubmit}>
        <h3>{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h3>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button type="submit" disabled={submitting}>
          {mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button
        type="button"
        className="auth-toggle"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
  )
}

export default Login
