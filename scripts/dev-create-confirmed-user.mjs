// Dev-only utility: creates (or reuses) a single pre-confirmed test user for manual UI testing.
// Run with: node --env-file=.env scripts/dev-create-confirmed-user.mjs <email> <password>

import { createClient } from '@supabase/supabase-js'

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node --env-file=.env scripts/dev-create-confirmed-user.mjs <email> <password>')
  process.exit(1)
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, serviceKey)

const { data: list, error: listError } = await admin.auth.admin.listUsers()
if (listError) throw new Error(listError.message)

const existing = list.users.find((u) => u.email === email)
if (existing) {
  console.log(`User already exists and is confirmed: ${email}`)
  process.exit(0)
}

const { error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (error) throw new Error(error.message)

console.log(`Created confirmed user: ${email}`)
