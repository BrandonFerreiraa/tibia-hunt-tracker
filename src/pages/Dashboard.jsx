import { useState } from 'react'
import HuntForm from '../components/HuntForm'
import HuntList from '../components/HuntList'

function Dashboard() {
  const [hunts, setHunts] = useState(() => {
    const storedHunts = localStorage.getItem('hunts')

    if (!storedHunts) return []

    try {
      const parsedHunts = JSON.parse(storedHunts)
      return Array.isArray(parsedHunts) ? parsedHunts : []
    } catch {
      return []
    }
  })

  function addHunt(newHunt) {
    const updatedHunts = [...hunts, newHunt]
    setHunts(updatedHunts)
    localStorage.setItem('hunts', JSON.stringify(updatedHunts))
  }

  return (
    <div>
      <HuntForm onAddHunt={addHunt} />
      <HuntList hunts={hunts} />
    </div>
  )
}

export default Dashboard
