import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

const email = 'skill-found-test@tibia-hunt-tracker.local'
const password = 'senha123456'

const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find((u) => u.email === email)
if (existing) await admin.auth.admin.deleteUser(existing.id)

const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })

const client = createClient(url, anonKey)
await client.auth.signInWithPassword({ email, password })

// A real, currently top-ranked character on Vunira/magiclevel (confirmed via live highscores fetch).
const { data: character } = await client
  .from('characters')
  .insert({ name: 'Kovel The Eternal', world: 'Vunira', user_id: created.user.id })
  .select()
  .single()

// Simulate a prior successful sync_character_profile (that RPC is blocked by the character
// endpoint outage, but this lets us test sync_character_skill's real "found" path, which
// only depends on the highscores endpoint — currently healthy).
await admin
  .from('characters')
  .update({ stats_vocation: 'Master Sorcerer', stats_world: 'Vunira' })
  .eq('id', character.id)

const result = await client.rpc('sync_character_skill', { p_character_id: character.id, p_category: 'magiclevel' })
console.log('RPC result:', JSON.stringify(result.data ?? result.error))

const { data: after } = await admin
  .from('characters')
  .select('stats_skill_category, stats_skill_value, stats_skill_rank, stats_skill_checked_at')
  .eq('id', character.id)
  .single()
console.log('DB state after sync:', JSON.stringify(after))

const pass = result.data?.found === true && after.stats_skill_value > 0 && after.stats_skill_rank > 0
console.log(pass ? '\nPASS — real character found in real highscores, DB updated correctly.' : '\nFAIL')

await admin.auth.admin.deleteUser(created.user.id)
if (!pass) process.exitCode = 1
