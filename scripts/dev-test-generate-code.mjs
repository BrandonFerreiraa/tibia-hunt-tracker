import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

const email = 'generate-code-test@tibia-hunt-tracker.local'
const password = 'senha123456'

const { data: list } = await admin.auth.admin.listUsers()
const existing = list.users.find((u) => u.email === email)
if (existing) await admin.auth.admin.deleteUser(existing.id)

const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })

const client = createClient(url, anonKey)
await client.auth.signInWithPassword({ email, password })

const { data: character } = await client
  .from('characters')
  .insert({ name: 'Generate Code Test', world: 'Vunira', user_id: created.user.id })
  .select()
  .single()

const { data: updated, error } = await client
  .from('characters')
  .update({ verification_code: 'THT-ABC123', verification_code_expires_at: new Date(Date.now() + 86400000).toISOString() })
  .eq('id', character.id)
  .select()
  .single()

console.log('error:', error ? error.message : '(none)')
console.log('verification_code set to:', updated?.verification_code)
console.log(!error && updated?.verification_code === 'THT-ABC123' ? '\nPASS' : '\nFAIL')

await admin.auth.admin.deleteUser(created.user.id)
if (error) process.exitCode = 1
