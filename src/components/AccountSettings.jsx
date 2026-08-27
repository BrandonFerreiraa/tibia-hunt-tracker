import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { translateAuthError } from '../lib/authErrors'
import Button from './ui/Button'
import { Input, Label } from './ui/Input'

function AccountSettings() {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação não bate com a nova senha.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await updatePassword(newPassword)
    setSubmitting(false)

    if (updateError) {
      setError(translateAuthError(updateError.message))
      return
    }

    setSuccess('Senha atualizada com sucesso.')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text">Trocar Senha</h3>

      <Label>
        Nova senha
        <Input
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
        />
      </Label>

      <Label>
        Confirmar nova senha
        <Input
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
        />
      </Label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <Button type="submit" disabled={submitting} className="w-fit">
        Salvar nova senha
      </Button>
    </form>
  )
}

export default AccountSettings
