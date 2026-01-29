function HuntList({ hunts }) {
  if (hunts.length === 0) {
    return <p>Nenhuma hunt registrada ainda.</p>
  }

  return (
    <ul>
      {hunts.map((hunt) => (
        <li key={hunt.id}>
          EXP: {hunt.exp} | Profit: {hunt.profit} | Supplies: {hunt.supplies}
        </li>
      ))}
    </ul>
  )
}

export default HuntList
