import { useState } from 'react'
import Button from './ui/Button'
import { Input, Select } from './ui/Input'

function CharacterForm({ onAddCharacter }) {
  const [name, setName] = useState('')
  const [world, setWorld] = useState('')
  const [type, setType] = useState('principal')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !world) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await onAddCharacter({ name, world, type })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setName('')
    setWorld('')
    setType('principal')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text">Novo Personagem</h3>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          placeholder="Nome do personagem"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:flex-1"
        />

        <Input
          type="text"
          placeholder="Mundo"
          value={world}
          onChange={(e) => setWorld(e.target.value)}
          className="sm:w-40"
        />

        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-36">
          <option value="principal">Principal</option>
          <option value="maker">Maker</option>
        </Select>

        <Button type="submit" disabled={submitting}>
          Adicionar
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}

export default CharacterForm
