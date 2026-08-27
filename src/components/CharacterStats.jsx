import { useState } from 'react'
import {
  useCharacterStats,
  getAutoSkillCategory,
  isKnight,
  SKILL_CATEGORY_LABELS,
  formatRelativeTime,
} from '../hooks/useCharacterStats'

const KNIGHT_CATEGORIES = ['swordfighting', 'axefighting', 'clubfighting', 'shielding']

function CharacterStats({ character, onSynced }) {
  const { busy, syncProfile, syncSkill } = useCharacterStats()
  const [error, setError] = useState(null)
  const [knightCategory, setKnightCategory] = useState(KNIGHT_CATEGORIES[0])

  if (!character.verified) return null

  async function handleSyncProfile() {
    setError(null)
    const result = await syncProfile(character.id)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSynced()
  }

  async function handleSyncSkill() {
    setError(null)
    const category = isKnight(character.stats_vocation)
      ? knightCategory
      : getAutoSkillCategory(character.stats_vocation)

    if (!category) {
      setError('Não foi possível determinar a categoria de skill para essa vocação.')
      return
    }

    const result = await syncSkill(character.id, category)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSynced()
  }

  return (
    <div className="character-stats">
      {!character.stats_updated_at ? (
        <p>Perfil ainda não sincronizado.</p>
      ) : (
        <p>
          Level {character.stats_level} · {character.stats_vocation}
          {character.stats_guild_name ? ` · ${character.stats_guild_name}` : ''} ·{' '}
          {character.stats_achievement_points} achievement points
          <br />
          <span className="character-stats-timestamp">
            atualizado {formatRelativeTime(character.stats_updated_at)}
          </span>
        </p>
      )}

      <div className="session-form-actions">
        <button type="button" onClick={handleSyncProfile} disabled={busy}>
          Sincronizar perfil
        </button>

        {character.stats_vocation && (
          <>
            {isKnight(character.stats_vocation) && (
              <select value={knightCategory} onChange={(e) => setKnightCategory(e.target.value)}>
                {KNIGHT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {SKILL_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={handleSyncSkill} disabled={busy}>
              Sincronizar skill
            </button>
          </>
        )}
      </div>

      {character.stats_skill_category && (
        <p>
          {SKILL_CATEGORY_LABELS[character.stats_skill_category]}:{' '}
          {character.stats_skill_value != null ? (
            <>
              {character.stats_skill_value} (Top {character.stats_skill_rank})
            </>
          ) : (
            'fora do top 1.000'
          )}
        </p>
      )}

      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}

export default CharacterStats
