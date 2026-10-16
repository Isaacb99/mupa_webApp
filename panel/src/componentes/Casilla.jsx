// Una casilla de verificación con su etiqueta a la derecha (plan 5.6): toda la fila es el objetivo táctil (44 px de
// alto), con ayuda y error debajo, enlazados con aria-describedby. El id es obligatorio: ResumenErrores enlaza a él.

/**
 * @param {{ id: string, etiqueta: import('react').ReactNode, ayuda?: import('react').ReactNode, error?: string | null,
 *   checked: boolean, onChange: (e: any) => void, className?: string }} props
 */
export function Casilla({ id, etiqueta, ayuda, error, checked, onChange, className = '' }) {
  const idAyuda = ayuda ? `${id}-ayuda` : null
  const idError = error ? `${id}-error` : null
  return (
    <div className={`grid gap-1 ${className}`}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
        <input
          id={id}
          type="checkbox"
          className="size-6 shrink-0 cursor-pointer accent-accion"
          checked={checked}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
        />
        <span>{etiqueta}</span>
      </label>
      {error ? (
        <p id={idError} className="text-sm font-semibold text-error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
      {ayuda ? (
        <p id={idAyuda} className="text-sm text-tenue">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}
