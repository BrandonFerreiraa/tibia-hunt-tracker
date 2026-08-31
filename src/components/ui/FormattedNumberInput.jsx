import { baseClass } from './Input'

export function FormattedGoldInput({ value, onValueChange, className = '', ...props }) {
  const display = value === '' || value == null ? '' : Number(value).toLocaleString('pt-BR')

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '')
    onValueChange(digits === '' ? '' : Number(digits))
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={`${baseClass} ${className}`}
      value={display}
      onChange={handleChange}
      {...props}
    />
  )
}

export function FormattedCurrencyInput({ value, onValueChange, className = '', ...props }) {
  const display =
    value === '' || value == null
      ? ''
      : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '')
    onValueChange(digits === '' ? '' : Number(digits) / 100)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`${baseClass} ${className}`}
      value={display}
      onChange={handleChange}
      {...props}
    />
  )
}
