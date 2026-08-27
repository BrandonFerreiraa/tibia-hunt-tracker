const VARIANTS = {
  success: 'bg-success/10 text-success border-success/30',
  gold: 'bg-gold/10 text-gold border-gold/30',
  neutral: 'bg-surface-hover text-text-muted border-border',
  danger: 'bg-danger/10 text-danger border-danger/30',
}

function Badge({ variant = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
