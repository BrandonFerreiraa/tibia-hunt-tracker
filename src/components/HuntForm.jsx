import { useState } from 'react'

function HuntForm({ onAddHunt }) {
  const [exp, setExp] = useState('')
  const [profit, setProfit] = useState('')
  const [supplies, setSupplies] = useState('')

  function handleSubmit(e) {
    e.preventDefault()

    if (!exp || !profit || !supplies) return

    const newHunt = {
      id: Date.now(),
      exp: Number(exp),
      profit: Number(profit),
      supplies: Number(supplies),
      date: new Date().toISOString(),
    }

    onAddHunt(newHunt)

    setExp('')
    setProfit('')
    setSupplies('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Nova Hunt</h3>

      <input
        type="number"
        placeholder="EXP Gained"
        value={exp}
        onChange={(e) => setExp(e.target.value)}
      />

      <input
        type="number"
        placeholder="Profit"
        value={profit}
        onChange={(e) => setProfit(e.target.value)}
      />

      <input
        type="number"
        placeholder="Supplies"
        value={supplies}
        onChange={(e) => setSupplies(e.target.value)}
      />

      <button type="submit">Salvar Hunt</button>
    </form>
  )
}

export default HuntForm
