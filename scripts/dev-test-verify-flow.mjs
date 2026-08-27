import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

const email = 'verify-flow-test@tibia-hunt-tracker.local'
const password = 'senha123456'

const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find((u) => u.email === email)
if (existing) await admin.auth.admin.deleteUser(existing.id)

const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })

const client = createClient(url, anonKey)
await client.auth.signInWithPassword({ email, password })

const { data: character } = await client
  .from('characters')
  .insert({ name: 'Verify Flow Test', world: 'Vunira', user_id: created.user.id })
  .select()
  .single()

console.log('1) No code generated yet — calling verify_character should return no_code:')
const r1 = await client.rpc('verify_character', { p_character_id: character.id })
console.log('  ', JSON.stringify(r1.data ?? r1.error))

console.log('\n2) Generating code, then calling verify_character (API is currently down, expect api_unavailable):')
await client
  .from('characters')
  .update({
    verification_code: 'THT-FLOW01',
    verification_code_expires_at: new Date(Date.now() + 86400000).toISOString(),
  })
  .eq('id', character.id)

const r2 = await client.rpc('verify_character', { p_character_id: character.id })
console.log('  ', JSON.stringify(r2.data ?? r2.error))

console.log('\n3) Testing expired code path:')
await client
  .from('characters')
  .update({ verification_code_expires_at: new Date(Date.now() - 1000).toISOString() })
  .eq('id', character.id)

const r3 = await client.rpc('verify_character', { p_character_id: character.id })
console.log('  ', JSON.stringify(r3.data ?? r3.error))

const checks = [
  r1.data?.error === 'no_code',
  r2.data?.error === 'api_unavailable',
  r3.data?.error === 'code_expired',
]
console.log(checks.every(Boolean) ? '\nPASS' : '\nSome checks failed:', checks)

await admin.auth.admin.deleteUser(created.user.id)
if (!checks.every(Boolean)) process.exitCode = 1
