import { useCreature } from '../hooks/useCreature'

// Mesmos ícones do bestiário do TibiaWiki (tabela "Damage Taken From
// Elements" de qualquer página de criatura) — ícones fixos e compartilhados
// entre todas as criaturas, confirmado comparando Demon/Grimeleech/Hellflayer.
const ELEMENTS = [
  {
    key: 'physical',
    label: 'Físico',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/c/c1/Bestiary_Physical_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210614055117&path-prefix=en',
  },
  {
    key: 'fire',
    label: 'Fogo',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/7/71/Burning_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210618053011&path-prefix=en',
  },
  {
    key: 'energy',
    label: 'Energia',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/9/9b/Electrified_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210618053008&path-prefix=en',
  },
  {
    key: 'earth',
    label: 'Terra',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/8/82/Poisoned_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210618053010&path-prefix=en',
  },
  {
    key: 'ice',
    label: 'Gelo',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/b/b4/Freezing_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210618052446&path-prefix=en',
  },
  {
    key: 'holy',
    label: 'Sagrado',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/8/80/Dazzled_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210618053006&path-prefix=en',
  },
  {
    key: 'death',
    label: 'Morte',
    iconUrl:
      'https://static.wikia.nocookie.net/tibia/images/c/c1/Cursed_Icon_Big.gif/revision/latest/scale-to-width-down/16?cb=20210618053007&path-prefix=en',
  },
]

const STATUS_STYLES = {
  immune: 'bg-surface-hover text-text-subtle border-border',
  strong: 'bg-success/10 text-success border-success/30',
  weakness: 'bg-danger/10 text-danger border-danger/30',
}

const STATUS_LABEL = {
  immune: 'Imune',
  strong: 'Resistente',
  weakness: 'Fraco',
}

function qualitativeStatus(creature, key) {
  if (creature.immune?.includes(key)) return 'immune'
  if (creature.strong?.includes(key)) return 'strong'
  if (creature.weakness?.includes(key)) return 'weakness'
  return null
}

// Percentual exato (TibiaWiki) tem prioridade sobre a categoria da TibiaData
// (immune/strong/weakness) — cai pro qualitativo só quando a wiki não tem o
// campo pra esse elemento específico.
function elementBadge(creature, key) {
  const pct = creature.resistancePct?.[key]

  if (typeof pct === 'number') {
    if (pct === 100) return null // neutro, não vale mostrar
    const status = pct === 0 ? 'immune' : pct < 100 ? 'strong' : 'weakness'
    return { status, text: `${pct}%` }
  }

  const status = qualitativeStatus(creature, key)
  if (!status) return null
  return { status, text: STATUS_LABEL[status] }
}

function formatNumber(n) {
  return (n ?? 0).toLocaleString('pt-BR')
}

function MonsterMiniCard({ monsterName, quantity }) {
  const { creature, loading } = useCreature(monsterName)

  const badges = creature
    ? ELEMENTS.map(({ key, label, iconUrl }) => ({ key, label, iconUrl, badge: elementBadge(creature, key) })).filter(
        (e) => e.badge
      )
    : []
  const showWikiCredit = creature?.hasWikiData && badges.some((e) => e.badge.text.endsWith('%'))

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-hover">
          {creature?.imageUrl ? (
            <img src={creature.imageUrl} alt={creature.name} className="h-full w-full object-contain" />
          ) : (
            <span aria-hidden="true">🐾</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text">
            {formatNumber(quantity)}x {creature?.name ?? monsterName}
          </div>
          {creature && (
            <div className="text-xs text-text-subtle">
              HP {formatNumber(creature.hitpoints)} · XP {formatNumber(creature.experiencePoints)}
            </div>
          )}
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {badges.map(({ key, label, iconUrl, badge }) => (
            <span
              key={key}
              title={`${label}: ${badge.text}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[badge.status]}`}
            >
              <img
                src={iconUrl}
                alt=""
                className="h-3.5 w-3.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {badge.text}
            </span>
          ))}
        </div>
      )}

      {showWikiCredit && <p className="mt-1 text-[10px] text-text-subtle">Resistências: TibiaWiki</p>}

      {creature?.lootList?.length > 0 && (
        <p className="mt-2.5 text-xs text-text-muted">
          <strong className="text-text-subtle">Loot conhecido: </strong>
          {creature.lootList.join(', ')}
        </p>
      )}

      {!loading && !creature && (
        <p className="mt-2 text-xs text-text-subtle">Sem dados desta criatura na TibiaData.</p>
      )}
    </div>
  )
}

export default MonsterMiniCard
