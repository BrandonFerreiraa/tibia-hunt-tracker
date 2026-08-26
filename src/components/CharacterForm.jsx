import { useState } from 'react'

function CharacterForm({ onAddCharacter }) {
  const [name, setName] = useState('')
  const [world, setWorld] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !world) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await onAddCharacter({ name, world })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setName('')
    setWorld('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Novo Personagem</h3>

      <input
        type="text"
        placeholder="Nome do personagem"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Mundo"
        value={world}
        onChange={(e) => setWorld(e.target.value)}
      />

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        Adicionar Personagem
      </button>
    </form>
  )
}

export default CharacterForm
