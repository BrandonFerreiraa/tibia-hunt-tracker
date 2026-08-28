import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      <img src="/logo.png" alt="TibiaHunt" className="w-full max-w-sm" />

      <Card className="w-full max-w-sm">
        <h2 className="mb-4 text-lg font-semibold text-text">
          {mode === 'signin' ? 'Entrar na conta' : 'Criar conta'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Label>
            Email
            <Input
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Label>

          <Label>
            Senha
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Label>

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
      </Card>

      <button
        type="button"
        className="cursor-pointer text-sm text-text-muted underline decoration-dotted hover:text-accent"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
      </button>
    </div>
  )
}

export default Login
