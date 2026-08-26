function parseNumber(str) {
  return parseInt(str.replace(/,/g, ''), 10)
}

function parseDateTime(datePart, timePart) {
  // "2026-08-26" + "06:44:35" -> ISO string, local time
  const iso = `${datePart}T${timePart}`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const FIELD_PATTERNS = {
  rawXpGain: /^Raw XP Gain:\s*([\d,]+)/m,
  xpGain: /^XP Gain:\s*([\d,]+)/m,
  rawXpPerHour: /^Raw XP\/h:\s*([\d,]+)/m,
  xpPerHour: /^XP\/h:\s*([\d,]+)/m,
  loot: /^Loot:\s*([\d,]+)/m,
  supplies: /^Supplies:\s*([\d,]+)/m,
  balance: /^Balance:\s*(-?[\d,]+)/m,
  damage: /^Damage:\s*([\d,]+)/m,
  damagePerHour: /^Damage\/h:\s*([\d,]+)/m,
  healing: /^Healing:\s*([\d,]+)/m,
  healingPerHour: /^Healing\/h:\s*([\d,]+)/m,
}

const SESSION_DATA_RE =
  /Session data:\s*From\s*(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})\s*to\s*(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})/

function parseListSection(text, sectionName, nextSectionNames) {
  const startMarker = `${sectionName}:`
  const startIdx = text.indexOf(startMarker)
  if (startIdx === -1) return []

  let endIdx = text.length
  for (const next of nextSectionNames) {
    const idx = text.indexOf(`${next}:`, startIdx + startMarker.length)
    if (idx !== -1 && idx < endIdx) endIdx = idx
  }

  const block = text.slice(startIdx + startMarker.length, endIdx)
  const lines = block.split('\n')
  const entries = []

  for (const line of lines) {
    const match = line.match(/^\s*([\d,]+)x\s+(.+?)\s*$/)
    if (match) {
      entries.push({ quantity: parseNumber(match[1]), name: match[2] })
    }
  }

  return entries
}

export function parseSessionText(text) {
  if (!text || typeof text !== 'string') return null

  const sessionMatch = text.match(SESSION_DATA_RE)
  if (!sessionMatch) return null

  const startedAt = parseDateTime(sessionMatch[1], sessionMatch[2])
  const endedAt = parseDateTime(sessionMatch[3], sessionMatch[4])
  if (!startedAt || !endedAt) return null

  const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
  if (durationSeconds <= 0) return null

  const fields = {}
  for (const [key, pattern] of Object.entries(FIELD_PATTERNS)) {
    const match = text.match(pattern)
    if (!match) return null
    fields[key] = parseNumber(match[1])
  }

  const monsters = parseListSection(text, 'Killed Monsters', ['Looted Items'])
  const items = parseListSection(text, 'Looted Items', [])

  return {
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSeconds,
    ...fields,
    monsters,
    items,
  }
}
