// Verifies the security fix: an authenticated client (anon key) must NOT be able to
// set `verified = true` directly via a normal UPDATE — only via verify_character() RPC.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

// Reuse a fresh confirmed test user + character owned by them.
const email = 'security-test@tibia-hunt-tracker.local'
const password = 'senha123456'

const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find((u) => u.email === email)
if (existing) await admin.auth.admin.deleteUser(existing.id)

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (createError) throw new Error(createError.message)

const client = createClient(url, anonKey)
const { error: signInError } = await client.auth.signInWithPassword({ email, password })
if (signInError) throw new Error(signInError.message)

const { data: character, error: insertError } = await client
  .from('characters')
  .insert({ name: 'Security Test Char', world: 'Vunira', user_id: created.user.id })
  .select()
  .single()
if (insertError) throw new Error(insertError.message)

console.log('Character created, verified =', character.verified)

// The attack: try to set verified = true directly, bypassing verify_character().
const { error: attackError } = await client
  .from('characters')
  .update({ verified: true })
  .eq('id', character.id)

console.log('\nDirect UPDATE attempt result:')
console.log('  error:', attackError ? attackError.message : '(none)')

const { data: after } = await admin.from('characters').select('verified').eq('id', character.id).single()
console.log('  verified in DB after attempt:', after.verified)

const blocked = !!attackError || after.verified === false
console.log(blocked ? '\nPASS — client cannot self-verify.' : '\nFAIL — SECURITY HOLE, client set verified=true directly!')

await admin.auth.admin.deleteUser(created.user.id)
console.log('Cleaned up test user (character cascade-deleted).')

if (!blocked) process.exitCode = 1
