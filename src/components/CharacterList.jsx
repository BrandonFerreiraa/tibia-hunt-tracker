function CharacterList({ characters, activeCharacterId, onSelect, onRemove }) {
  if (characters.length === 0) {
    return <p>Nenhum personagem cadastrado ainda. Adicione o primeiro acima.</p>
  }

  return (
    <ul className="character-list">
      {characters.map((character) => (
        <li
          key={character.id}
          className={character.id === activeCharacterId ? 'character-active' : ''}
        >
          <button type="button" onClick={() => onSelect(character.id)}>
            {character.name} ({character.world})
            {character.id === activeCharacterId ? ' ✓' : ''}
          </button>
          <button type="button" onClick={() => onRemove(character.id)} className="character-remove">
            Remover
          </button>
        </li>
      ))}
    </ul>
  )
}

export default CharacterList
