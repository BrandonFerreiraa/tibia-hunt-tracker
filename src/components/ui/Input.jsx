export const baseClass =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-subtle outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50'

export function Input({ className = '', ...props }) {
  return <input className={`${baseClass} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${baseClass} font-mono ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${baseClass} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Label({ className = '', children, ...props }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-text-muted ${className}`} {...props}>
      {children}
    </label>
  )
}
