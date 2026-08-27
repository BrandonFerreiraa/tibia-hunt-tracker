import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

const email = 'stats-sync-test@tibia-hunt-tracker.local'
const password = 'senha123456'

const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find((u) => u.email === email)
if (existing) await admin.auth.admin.deleteUser(existing.id)

const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })

const client = createClient(url, anonKey)
await client.auth.signInWithPassword({ email, password })

const { data: character } = await client
  .from('characters')
  .insert({ name: 'Stats Sync Test', world: 'Vunira', user_id: created.user.id })
  .select()
  .single()

const results = []

console.log('1) Direct client write attempt on stats_level (should be blocked):')
const { error: writeError } = await client.from('characters').update({ stats_level: 9999 }).eq('id', character.id)
console.log('  error:', writeError ? writeError.message : '(none — SECURITY HOLE)')
results.push(!!writeError)

console.log('\n2) sync_character_profile — API status may vary during this session:')
const r2 = await client.rpc('sync_character_profile', { p_character_id: character.id })
console.log('  ', JSON.stringify(r2.data ?? r2.error))
// Fake character name: API down -> api_unavailable, API up -> character_not_found. Both are
// correctly-handled outcomes; only an uncaught/raw error would be a real failure.
results.push(r2.data?.error === 'api_unavailable' || r2.data?.error === 'character_not_found')

console.log('\n3) sync_character_skill before profile ever synced — expect profile_not_synced_yet:')
const r3 = await client.rpc('sync_character_skill', { p_character_id: character.id, p_category: 'magiclevel' })
console.log('  ', JSON.stringify(r3.data ?? r3.error))
results.push(r3.data?.error === 'profile_not_synced_yet')

// Manually set stats_vocation/world via admin (simulating a prior successful profile sync)
await admin.from('characters').update({ stats_vocation: 'Master Sorcerer', stats_world: 'Vunira' }).eq('id', character.id)

console.log('\n4) sync_character_skill with invalid category for Sorcerer (swordfighting):')
const r4 = await client.rpc('sync_character_skill', { p_character_id: character.id, p_category: 'swordfighting' })
console.log('  ', JSON.stringify(r4.data ?? r4.error))
results.push(r4.data?.error === 'invalid_category_for_vocation')

console.log('\n5) sync_character_skill with valid category (magiclevel) — API status may vary during this session:')
const r5 = await client.rpc('sync_character_skill', { p_character_id: character.id, p_category: 'magiclevel' })
console.log('  ', JSON.stringify(r5.data ?? r5.error))
// Fake character name, so either outcome is a correctly-handled result: API down -> api_unavailable,
// API up -> a full 20-page scan that legitimately finds nothing (found: false).
results.push(r5.data?.error === 'api_unavailable' || r5.data?.found === false)

console.log('\n6) Cooldown test — call sync_character_profile twice quickly (simulate prior success via admin):')
await admin.from('characters').update({ stats_updated_at: new Date().toISOString() }).eq('id', character.id)
const r6 = await client.rpc('sync_character_profile', { p_character_id: character.id })
console.log('  ', JSON.stringify(r6.data ?? r6.error))
results.push(r6.data?.error === 'cooldown')

console.log('\nResults:', results)
console.log(results.every(Boolean) ? '\nPASS' : '\nFAIL')

await admin.auth.admin.deleteUser(created.user.id)
if (!results.every(Boolean)) process.exitCode = 1
