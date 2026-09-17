import { ui } from '../content.js'

export default function Placeholder({ alt, className = '' }) {
  const nombre = alt || ui.pendiente
  return (
    <div
      role="img"
      aria-label={nombre}
      className={`flex items-end bg-ink-soft border border-line p-3 text-xs text-muted ${className}`}
    >
      <span>{nombre}</span>
    </div>
  )
}
