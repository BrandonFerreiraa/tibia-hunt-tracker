import { useCreature } from '../hooks/useCreature'

const MAX_VISIBLE = 5

function MonsterIcon({ name }) {
  const { creature } = useCreature(name)

  return (
    <span
      title={creature?.name ?? name}
      className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-hover"
    >
      {creature?.imageUrl ? (
        <img src={creature.imageUrl} alt={creature.name} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <span className="text-xs" aria-hidden="true">
          🐾
        </span>
      )}
    </span>
  )
}

function MonsterIconStrip({ monsterNames }) {
  if (!monsterNames || monsterNames.length === 0) return null

  const visible = [...new Set(monsterNames)].slice(0, MAX_VISIBLE)
  const extra = monsterNames.length - visible.length

  return (
    <div className="mt-3 flex items-center gap-1.5">
      {visible.map((name) => (
        <MonsterIcon key={name} name={name} />
      ))}
      {extra > 0 && <span className="text-xs font-medium text-text-subtle">+{extra}</span>}
    </div>
  )
}

export default MonsterIconStrip
