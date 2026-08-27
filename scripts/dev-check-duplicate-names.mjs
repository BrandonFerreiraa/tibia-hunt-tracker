import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await admin.from('characters').select('id, name, user_id')
if (error) throw new Error(error.message)

const byLowerName = new Map()
for (const c of data) {
  const key = c.name.toLowerCase()
  if (!byLowerName.has(key)) byLowerName.set(key, [])
  byLowerName.get(key).push(c)
}

const duplicates = [...byLowerName.entries()].filter(([, rows]) => rows.length > 1)

console.log(`Total characters: ${data.length}`)
if (duplicates.length === 0) {
  console.log('No duplicate names (case-insensitive) — safe to add unique index.')
} else {
  console.log('Duplicate names found:')
  for (const [name, rows] of duplicates) {
    console.log(`  "${name}": ${rows.length} rows`, JSON.stringify(rows))
  }
}
