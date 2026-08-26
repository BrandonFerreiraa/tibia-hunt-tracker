import { parseSessionText } from '../src/lib/sessionParser.js'

const sample = `Session data: From 2026-08-26, 06:44:35 to 2026-08-26, 09:23:08
Session: 02:38h
Raw XP Gain: 18,005,805
XP Gain: 18,005,805
Raw XP/h: 6,812,273
XP/h: 6,812,273
Loot: 7,320,378
Supplies: 1,085,048
Balance: 6,235,330
Damage: 24,231,461
Damage/h: 9,168,592
Healing: 4,838,936
Healing/h: 1,830,935
Killed Monsters:
  854x demon
  662x grimeleech
  224x hellflayer
  760x vexclaw
Looted Items:
  1153x a great mana potion
  361x a great health potion
  12x a giant shimmering pearl
  2x magma boots
  7x magma legs
  14x a purple tome
  144x a small diamond
  515x a small ruby
  105450x a gold coin
  429x a small emerald
  468x a small amethyst
  31x a talon
  6148x a platinum coin
  2x a violet gem
  32x a yellow gem
  1x a green gem
  70x a red gem
  2x a blue gem
  4x a might ring
  20x a stealth ring
  18x an energy ring
  7x a platinum amulet
  16x an orb
  19x a gold ring
  28x a ring of healing
  30x a giant sword
  32x an ice rapier
  13x a golden sickle
  61x a fire axe
  18x a devil helmet
  1x a golden armor
  4x golden legs
  2x a magic plate armor
  12x a mastermind shield
  15x a demon shield
  3x steel boots
  1129x a fire mushroom
  262x a green mushroom
  2x a skull helmet
  155x a demon horn
  436x demonic essence
  124x a flask of demonic blood
  2x a demonrage sword
  2x a vile axe
  1x a titan axe
  1x an abyss hammer
  2x a nightmare blade
  1227x a great spirit potion
  704x an ultimate health potion
  36x an underworld rod
  23x a wand of voodoo
  490x a small topaz
  18x a gold ingot
  8x a rift shield
  9x a rift lance
  85x a vexclaw talon
  33x a pair of hellflayer horns
  98x some grimeleech wings
  3x a rift bow
  4x a rift crossbow
  1x a basic reap scroll
  1x a basic swiftness scroll
  2x a lesser proficiency catalyst`

const result = parseSessionText(sample)

const expectedMonsterLines = sample
  .split('\n')
  .filter((l) => /^\s*[\d,]+x\s+\S/.test(l) && sample.indexOf(l) < sample.indexOf('Looted Items'))
const expectedItemLines = sample
  .split('\n')
  .filter((l) => /^\s*[\d,]+x\s+\S/.test(l) && sample.indexOf(l) >= sample.indexOf('Looted Items'))
const expectedMonsterTotal = expectedMonsterLines.reduce(
  (sum, l) => sum + parseInt(l.match(/^\s*([\d,]+)x/)[1].replace(/,/g, ''), 10),
  0
)

if (!result) {
  console.error('FAIL — parser returned null for a valid sample')
  process.exitCode = 1
} else {
  const startedAt = new Date(result.startedAt)
  const endedAt = new Date(result.endedAt)
  const recomputedDuration = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)

  console.log('durationSeconds:', result.durationSeconds, '| recomputed from ISO dates:', recomputedDuration)
  console.log('xpGain:', result.xpGain, '(expected 18005805)')
  console.log('loot:', result.loot, '(expected 7320378)')
  console.log('balance:', result.balance, '(expected 6235330)')
  console.log(
    'monsters total killed:',
    result.monsters.reduce((s, m) => s + m.quantity, 0),
    '(expected',
    expectedMonsterTotal,
    ')'
  )
  console.log('monsters lines:', result.monsters.length, '/ raw lines in text:', expectedMonsterLines.length)
  console.log('items lines:', result.items.length, '/ raw lines in text:', expectedItemLines.length)
  console.log('first monster:', JSON.stringify(result.monsters[0]))
  console.log('last item:', JSON.stringify(result.items[result.items.length - 1]))

  const checks = [
    result.durationSeconds === recomputedDuration,
    result.xpGain === 18005805,
    result.loot === 7320378,
    result.balance === 6235330,
    result.monsters.length === expectedMonsterLines.length,
    result.items.length === expectedItemLines.length,
    result.monsters.reduce((s, m) => s + m.quantity, 0) === expectedMonsterTotal,
  ]
  console.log(checks.every(Boolean) ? '\nPASS' : '\nFAIL — some values did not match')
  if (!checks.every(Boolean)) process.exitCode = 1
}

// Negative case: unrelated text should fail gracefully
const garbage = parseSessionText('this is not a tibia analyser text')
console.log('\nGarbage input parsed to:', garbage, '(expected null)')
if (garbage !== null) process.exitCode = 1
