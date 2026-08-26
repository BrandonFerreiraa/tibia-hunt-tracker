// Dev-only: inspects the most recent session + its monsters/items for manual verification.
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: session, error } = await admin
  .from('sessions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (error) throw new Error(error.message)
console.log('Session:', JSON.stringify(session, null, 2))

const { data: monsters } = await admin.from('session_monsters').select('*').eq('session_id', session.id)
console.log('\nMonsters:', JSON.stringify(monsters, null, 2))

const { data: items } = await admin.from('session_items').select('*').eq('session_id', session.id)
console.log('\nItems:', JSON.stringify(items, null, 2))
