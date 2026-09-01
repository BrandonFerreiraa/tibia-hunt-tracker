import { useEffect, useState } from 'react'
import { fetchCharacter, CharacterNotFoundError, TibiaDataUnavailableError } from '../lib/tibiaDataClient'
import { useCharacterVerification } from '../hooks/useCharacterVerification'
import { useCharacterStats, getAutoSkillCategory, isKnight, SKILL_CATEGORY_LABELS } from '../hooks/useCharacterStats'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CopyButton from '../components/ui/CopyButton'
import { Input, Label, Select } from '../components/ui/Input'

const KNIGHT_CATEGORIES = ['swordfighting', 'axefighting', 'clubfighting']

function Onboarding({ addCharacter, refresh, existingCharacter }) {
  const { busy, generateVerificationCode, checkVerification } = useCharacterVerification()
  const { syncProfile, syncSkill } = useCharacterStats()
  const [step, setStep] = useState(existingCharacter ? 'verify' : 'name') // 'name' | 'knight-category' | 'verify'
  const [name, setName] = useState('')
  const [pendingInfo, setPendingInfo] = useState(null)
  const [knightCategory, setKnightCategory] = useState(KNIGHT_CATEGORIES[0])
  const [skillCategory, setSkillCategory] = useState(null)
  const [character, setCharacter] = useState(existingCharacter)
  const [code, setCode] = useState(existingCharacter?.verification_code ?? null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Se já existe um personagem cadastrado mas não verificado (ex.: recarregou a página no
  // meio do onboarding), retoma direto no passo de verificar em vez de tentar cadastrar de
  // novo — reaproveita o código ainda válido, ou gera um novo se estiver expirado/ausente.
  useEffect(() => {
    if (existingCharacter) {
      const codeStillValid =
        existingCharacter.verification_code &&
        existingCharacter.verification_code_expires_at &&
        new Date(existingCharacter.verification_code_expires_at) > new Date()

      if (!codeStillValid) {
        generateVerificationCode(existingCharacter.id).then((result) => {
          if (!result.error) setCode(result.code)
        })
      }
      return
    }

    // Se o nome do personagem já foi informado na tela de cadastro de conta (Login),
    // continua o fluxo automaticamente em vez de pedir de novo.
    const pending = localStorage.getItem('pendingCharacterName')
    if (pending) {
      localStorage.removeItem('pendingCharacterName')
      setName(pending)
      lookupCharacter(pending)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function lookupCharacter(nameValue) {
    setError(null)
    setSubmitting(true)

    let info
    try {
      info = await fetchCharacter(nameValue)
    } catch (err) {
      setSubmitting(false)
      if (err instanceof CharacterNotFoundError) {
        setError('Personagem não encontrado no Tibia. Confira o nome.')
      } else if (err instanceof TibiaDataUnavailableError) {
        setError('A TibiaData API está indisponível agora. Tente novamente em alguns minutos.')
      } else {
        setError('Erro inesperado ao buscar o personagem. Tente novamente.')
      }
      return
    }

    setSubmitting(false)

    if (isKnight(info.vocation)) {
      setPendingInfo(info)
      setStep('knight-category')
      return
    }

    await registerCharacter(info, getAutoSkillCategory(info.vocation))
  }

  async function handleConfirmName(e) {
    e.preventDefault()
    if (!name.trim()) return
    await lookupCharacter(name.trim())
  }

  async function handleConfirmKnightCategory(e) {
    e.preventDefault()
    await registerCharacter(pendingInfo, knightCategory)
  }

  async function registerCharacter(info, category) {
    setError(null)
    setSubmitting(true)

    const { data: newCharacter, error: addError } = await addCharacter({
      name: info.name,
      world: info.world,
      type: 'principal',
    })

    if (addError) {
      setSubmitting(false)
      setError(addError.message)
      return
    }

    const codeResult = await generateVerificationCode(newCharacter.id)
    setSubmitting(false)

    if (codeResult.error) {
      setError(codeResult.error.message)
      return
    }

    setCharacter(newCharacter)
    setCode(codeResult.code)
    setSkillCategory(category)
    setStep('verify')
  }

  async function handleVerify() {
    setError(null)
    const result = await checkVerification(character.id)

    if (result.error) {
      setError(result.error.message)
      return
    }

    // Best-effort: uma falha de sync não deve impedir o acesso já liberado pela verificação.
    await syncProfile(character.id)
    if (skillCategory) await syncSkill(character.id, skillCategory)
    await refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      <img src="/logo.png" alt="TibiaHunt" className="w-full max-w-sm" />

      <Card className="w-full max-w-sm">
        {step === 'name' && (
          <form onSubmit={handleConfirmName} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-text">Cadastre seu personagem</h2>
            <p className="text-sm text-text-muted">
              Pra usar o TibiaHunt, cadastre e verifique seu personagem principal primeiro.
            </p>

            <Label>
              Nome do personagem
              <Input
                type="text"
                placeholder="Nome exatamente como no Tibia"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              Confirmar
            </Button>
          </form>
        )}

        {step === 'knight-category' && (
          <form onSubmit={handleConfirmKnightCategory} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-text">Qual sua skill principal?</h2>
            <p className="text-sm text-text-muted">
              {pendingInfo.name} é {pendingInfo.vocation} — escolha a skill que você mais usa pra hunt.
            </p>

            <Label>
              Skill
              <Select value={knightCategory} onChange={(e) => setKnightCategory(e.target.value)}>
                {KNIGHT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {SKILL_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </Select>
            </Label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              Continuar
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-text">Verifique seu personagem</h2>
            <p className="text-sm text-text-muted">
              Cole{' '}
              <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs font-semibold text-gold">
                {code}
              </code>{' '}
              <CopyButton text={code} />{' '}
              no campo "comment" do personagem em tibia.com, salve, e clique em "Verificar".
            </p>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button onClick={handleVerify} disabled={busy} className="w-full">
              Verificar
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Onboarding
