import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey)

async function makeUserWithSession(emailPrefix, charName, world, isShared) {
  const email = `${emailPrefix}@tibia-hunt-tracker.local`
  const password = 'senha123456'

  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find((u) => u.email === email)
  if (existing) await admin.auth.admin.deleteUser(existing.id)

  const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })

  const client = createClient(url, anonKey)
  await client.auth.signInWithPassword({ email, password })

  const { data: character } = await client
    .from('characters')
    .insert({ name: charName, world, user_id: created.user.id })
    .select()
    .single()

  const now = new Date()
  const { error: sessionError } = await client.from('sessions').insert({
    character_id: character.id,
    hunt_name: `Hunt de ${charName}`,
    started_at: new Date(now.getTime() - 3600000).toISOString(),
    ended_at: now.toISOString(),
    duration_seconds: 3600,
    xp_gain: 1000000,
    raw_xp_gain: 1000000,
    xp_per_hour: 1000000,
    raw_xp_per_hour: 1000000,
    loot: 500000,
    supplies: 100000,
    balance: 400000,
    damage: 0,
    damage_per_hour: 0,
    healing: 0,
    healing_per_hour: 0,
    source: 'manual',
    is_shared: isShared,
  })
  if (sessionError) throw new Error(`session insert failed: ${sessionError.message}`)

  return { userId: created.user.id, client, character }
}

const userA = await makeUserWithSession('feed-test-a', 'Feed Test A Public', 'Vunira', true)
const userB = await makeUserWithSession('feed-test-b', 'Feed Test B Private', 'Vunira', false)

console.log('Fetching feed as user A...')
const { data: feed, error } = await userA.client.from('public_hunts_feed').select('*')
if (error) throw new Error(error.message)

const names = feed.map((f) => f.character_name)
console.log('Characters visible in feed:', names)

const seesOwnPublic = names.includes('Feed Test A Public')
const seesOtherPrivate = names.includes('Feed Test B Private')

console.log('Sees own public session:', seesOwnPublic, '(expected true)')
console.log('Sees other user private session:', seesOtherPrivate, '(expected false)')

const pass = seesOwnPublic && !seesOtherPrivate
console.log(pass ? '\nPASS' : '\nFAIL')

await admin.auth.admin.deleteUser(userA.userId)
await admin.auth.admin.deleteUser(userB.userId)

if (!pass) process.exitCode = 1
