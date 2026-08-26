// Dev-only utility: manually confirms an existing (unconfirmed) user's email via Admin API.
// Use when a real signup is stuck waiting on a confirmation email that can't be delivered yet
// (e.g. Resend sandbox mode without a verified domain).
// Run with: node --env-file=.env scripts/dev-confirm-user.mjs <email>

import { createClient } from '@supabase/supabase-js'

const [, , email] = process.argv
if (!email) {
  console.error('Usage: node --env-file=.env scripts/dev-confirm-user.mjs <email>')
  process.exit(1)
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, serviceKey)

const { data: list, error: listError } = await admin.auth.admin.listUsers()
if (listError) throw new Error(listError.message)

const user = list.users.find((u) => u.email === email)
if (!user) {
  console.error(`No user found with email: ${email}`)
  process.exit(1)
}

if (user.email_confirmed_at) {
  console.log(`User ${email} is already confirmed (since ${user.email_confirmed_at}).`)
  process.exit(0)
}

const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
if (error) throw new Error(error.message)

console.log(`Confirmed: ${email}. You can now log in with the password you signed up with.`)
