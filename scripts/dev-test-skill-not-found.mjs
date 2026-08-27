import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

const email = 'skill-not-found-test@tibia-hunt-tracker.local'
const password = 'senha123456'

const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find((u) => u.email === email)
if (existing) await admin.auth.admin.deleteUser(existing.id)

const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })

const client = createClient(url, anonKey)
await client.auth.signInWithPassword({ email, password })

const { data: character } = await client
  .from('characters')
  .insert({ name: 'Xyz Nonexistent Player Zzz', world: 'Vunira', user_id: created.user.id })
  .select()
  .single()

// Pre-seed with a stale (fake) skill value to confirm it gets cleared, not left stale.
await admin
  .from('characters')
  .update({
    stats_vocation: 'Master Sorcerer',
    stats_world: 'Vunira',
    stats_skill_category: 'magiclevel',
    stats_skill_value: 999,
    stats_skill_rank: 1,
  })
  .eq('id', character.id)

const result = await client.rpc('sync_character_skill', { p_character_id: character.id, p_category: 'magiclevel' })
console.log('RPC result:', JSON.stringify(result.data ?? result.error))

const { data: after } = await admin
  .from('characters')
  .select('stats_skill_category, stats_skill_value, stats_skill_rank')
  .eq('id', character.id)
  .single()
console.log('DB state after sync:', JSON.stringify(after))

const pass =
  result.data?.found === false &&
  after.stats_skill_category === null &&
  after.stats_skill_value === null &&
  after.stats_skill_rank === null

console.log(pass ? '\nPASS — not found, stale fields cleared, no error.' : '\nFAIL')

await admin.auth.admin.deleteUser(created.user.id)
if (!pass) process.exitCode = 1
