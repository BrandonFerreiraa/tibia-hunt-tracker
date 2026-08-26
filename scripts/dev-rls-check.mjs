// Dev-only utility for Story 1.1 Task 5 — validates RLS isolation between 2 accounts.
// Run with: node --env-file=.env scripts/dev-rls-check.mjs
// Not part of the app bundle. Uses the service_role key ONLY to create/delete
// pre-confirmed test users; all data reads/writes go through the anon key + a
// real session, so RLS policies are genuinely exercised.

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey)

const users = [
  { email: 'rls-test-a@tibia-hunt-tracker.local', password: 'senha123456', charName: 'RLS-Test-A' },
  { email: 'rls-test-b@tibia-hunt-tracker.local', password: 'senha123456', charName: 'RLS-Test-B' },
]

async function deleteIfExists(email) {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw new Error(`listUsers failed: ${error.message}`)
  const existing = data.users.find((x) => x.email === email)
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id)
    console.log(`Removed leftover user from a previous run: ${email}`)
  }
}

async function main() {
  const createdIds = []

  for (const u of users) {
    await deleteIfExists(u.email)
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })
    if (error) throw new Error(`createUser(${u.email}) failed: ${error.message}`)
    u.id = data.user.id
    createdIds.push(u.id)
    console.log(`Created confirmed user: ${u.email} (${u.id})`)
  }

  for (const u of users) {
    const client = createClient(url, anonKey)
    const { error: signInError } = await client.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    })
    if (signInError) throw new Error(`signIn(${u.email}) failed: ${signInError.message}`)

    const { error: insertError } = await client
      .from('characters')
      .insert({ name: u.charName, world: 'Vunira', user_id: u.id })
    if (insertError) throw new Error(`insert character for ${u.email} failed: ${insertError.message}`)

    u.client = client
    console.log(`${u.email} inserted character "${u.charName}"`)
  }

  let pass = true
  for (const u of users) {
    const { data, error } = await u.client.from('characters').select('name')
    if (error) throw new Error(`select for ${u.email} failed: ${error.message}`)
    const names = data.map((r) => r.name)
    const other = users.find((x) => x !== u)
    const seesOwn = names.includes(u.charName)
    const seesOther = names.includes(other.charName)
    console.log(`${u.email} sees characters: [${names.join(', ')}]`)
    if (!seesOwn || seesOther) pass = false
  }

  console.log(pass ? '\nPASS — RLS isolation confirmed.' : '\nFAIL — RLS is leaking data between accounts!')

  for (const id of createdIds) {
    await admin.auth.admin.deleteUser(id)
  }
  console.log('Cleaned up test users (characters cascade-deleted).')

  if (!pass) process.exitCode = 1
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
