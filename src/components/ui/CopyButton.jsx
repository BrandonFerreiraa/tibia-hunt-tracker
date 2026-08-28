import { useState } from 'react'

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard permission denied or unavailable — user can still select the text manually.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium text-accent hover:text-accent-hover ${className}`}
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

export default CopyButton
