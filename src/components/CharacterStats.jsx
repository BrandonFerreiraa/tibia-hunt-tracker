import { useState } from 'react'
import {
  useCharacterStats,
  getAutoSkillCategory,
  isKnight,
  SKILL_CATEGORY_LABELS,
  formatRelativeTime,
} from '../hooks/useCharacterStats'
import Button from './ui/Button'
import { Select } from './ui/Input'
import Badge from './ui/Badge'

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
    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
      {!character.stats_updated_at ? (
        <p className="text-sm text-text-muted">Perfil ainda não sincronizado.</p>
      ) : (
        <div className="text-sm text-text">
          <span className="font-medium">Level {character.stats_level}</span>
          <span className="text-text-muted"> · {character.stats_vocation}</span>
          {character.stats_guild_name && (
            <span className="text-text-muted"> · {character.stats_guild_name}</span>
          )}
          <span className="text-text-muted"> · {character.stats_achievement_points} AP</span>
          <p className="mt-0.5 text-xs text-text-subtle">
            atualizado {formatRelativeTime(character.stats_updated_at)}
          </p>
        </div>
      )}

      {character.stats_skill_category && (
        <div>
          {character.stats_skill_value != null ? (
            <Badge variant="gold">
              🏆 {SKILL_CATEGORY_LABELS[character.stats_skill_category]}: {character.stats_skill_value}{' '}
              (Top {character.stats_skill_rank})
            </Badge>
          ) : (
            <Badge variant="neutral">
              {SKILL_CATEGORY_LABELS[character.stats_skill_category]}: fora do top 1.000
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleSyncProfile} disabled={busy}>
          Sincronizar perfil
        </Button>

        {character.stats_vocation && (
          <>
            {isKnight(character.stats_vocation) && (
              <Select
                value={knightCategory}
                onChange={(e) => setKnightCategory(e.target.value)}
                className="w-auto py-1.5 text-xs"
              >
                {KNIGHT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {SKILL_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </Select>
            )}
            <Button variant="secondary" size="sm" onClick={handleSyncSkill} disabled={busy}>
              Sincronizar skill
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}

export default CharacterStats
