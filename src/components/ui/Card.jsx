function Card({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={`rounded-xl border border-border bg-surface p-5 ${className}`} {...props}>
      {children}
    </Component>
  )
}

export default Card
