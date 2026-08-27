import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function generateCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `THT-${random}`
}

const ERROR_MESSAGES = {
  not_found_or_not_owner: 'Personagem não encontrado ou não pertence à sua conta.',
  already_verified: 'Este personagem já está verificado.',
  no_code: 'Gere um código de verificação primeiro.',
  code_expired: 'Código expirado. Gere um novo código e tente de novo.',
  api_unavailable: 'A TibiaData API está indisponível agora. Tente novamente em alguns minutos.',
  character_not_found: 'Personagem não encontrado no Tibia. Confira o nome cadastrado.',
  api_error: 'Erro ao consultar a TibiaData API. Tente novamente.',
  code_not_found_in_comment:
    'Código não encontrado no comment do personagem em tibia.com. Confirme que colou e salvou o código certo.',
}

export function useCharacterVerification() {
  const [busy, setBusy] = useState(false)

  async function generateVerificationCode(characterId) {
    setBusy(true)
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('characters')
      .update({ verification_code: code, verification_code_expires_at: expiresAt })
      .eq('id', characterId)
      .select('verification_code, verification_code_expires_at')
      .single()

    setBusy(false)
    if (error) return { error }
    return { code: data.verification_code, expiresAt: data.verification_code_expires_at }
  }

  async function checkVerification(characterId) {
    setBusy(true)

    // The actual check runs server-side (SECURITY DEFINER RPC): the client cannot set
    // `verified = true` directly, it can only ask the database to verify it for real.
    const { data, error } = await supabase.rpc('verify_character', { p_character_id: characterId })

    setBusy(false)

    if (error) return { error }
    if (data?.error) return { error: new Error(ERROR_MESSAGES[data.error] ?? data.error) }
    return { verified: true }
  }

  return { busy, generateVerificationCode, checkVerification }
}
