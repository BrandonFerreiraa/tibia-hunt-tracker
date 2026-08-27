const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/20',
  secondary:
    'bg-surface-hover text-text border border-border hover:border-text-subtle',
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
  ghost: 'bg-transparent text-text-muted hover:text-text',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}

export default Button
