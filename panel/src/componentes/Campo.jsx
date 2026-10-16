// Campos de formulario (plan 5.6, WCAG 1.3.1, 3.3.1, 3.3.2 y 3.3.8).
// - Campo: etiqueta visible arriba, ayuda y error debajo de la etiqueta, y el control con aria-invalid y
//   aria-describedby (error y ayuda). Por defecto un <input> con el resto de las props (type, value, onChange,
//   autoComplete…). Para otro control (<textarea>, <select>, algo armado), children como función: recibe las props
//   de accesibilidad (id, aria-invalid, aria-describedby, className) para ponerlas en el control.
// - CampoClave: un Campo de contraseña con "Mostrar"/"Ocultar" (se vuelve a ocultar al enviar el formulario, así el
//   gestor de contraseñas la ve como contraseña). Se puede pegar y autocompletar (3.3.8).
// El id es obligatorio y único en la pantalla: ResumenErrores enlaza a él.
// El texto de ejemplo (placeholder) va en el color de los bordes, 4,8:1 sobre blanco (WCAG 1.4.3 pide 4,5): el de
// Tailwind (la mitad del color del texto) daba 3,4.
// Un error que es de un grupo de campos (las franjas de un día) se suma con aria-describedby y aria-invalid en las
// props: se juntan con los del campo.
import { useEffect, useRef, useState } from 'react'

export const clasesControl =
  'block w-full min-h-11 rounded-md border-2 border-linea bg-blanco px-3 py-2 text-base text-tinta ' +
  'placeholder:text-linea aria-invalid:border-error'

/**
 * @param {{
 *   id: string, etiqueta: import('react').ReactNode, ayuda?: import('react').ReactNode, error?: string | null,
 *   obligatorio?: boolean, className?: string,
 *   children?: (props: { id: string, 'aria-invalid'?: true, 'aria-describedby'?: string, className: string }) => import('react').ReactNode,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  obligatorio = false,
  className = '',
  children,
  'aria-describedby': describedbyExtra,
  'aria-invalid': invalidoExtra,
  ...entrada
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : null
  const idError = error ? `${id}-error` : null
  const accesible = {
    id,
    'aria-invalid': error || invalidoExtra ? true : undefined,
    'aria-describedby': [idError, describedbyExtra, idAyuda].filter(Boolean).join(' ') || undefined,
    className: clasesControl,
  }
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-semibold">
        {etiqueta}
        {obligatorio ? <span className="font-normal text-tenue"> (obligatorio)</span> : null}
      </label>
      {ayuda ? (
        <p id={idAyuda} className="text-sm text-tenue wrap-anywhere">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} className="text-sm font-semibold text-error wrap-anywhere">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
      {typeof children === 'function' ? children(accesible) : <input {...accesible} {...entrada} />}
    </div>
  )
}

/**
 * @param {{ id: string, etiqueta: string, ayuda?: import('react').ReactNode, error?: string | null,
 *   autoComplete: 'current-password' | 'new-password', value: string, onChange: (e: any) => void,
 *   entradaRef?: import('react').Ref<HTMLInputElement> } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function CampoClave({ id, etiqueta, ayuda, error, obligatorio, className, entradaRef, ...entrada }) {
  const [visible, setVisible] = useState(false)
  const propia = useRef(null)
  useEffect(() => {
    const formulario = propia.current?.form
    if (!formulario) return undefined
    const ocultar = () => setVisible(false)
    formulario.addEventListener('submit', ocultar)
    return () => formulario.removeEventListener('submit', ocultar)
  }, [])
  const ref = (nodo) => {
    propia.current = nodo
    if (typeof entradaRef === 'function') entradaRef(nodo)
    else if (entradaRef) entradaRef.current = nodo
  }
  return (
    <Campo id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} obligatorio={obligatorio} className={className}>
      {(accesible) => (
        <div className="flex items-stretch gap-2">
          <input
            {...accesible}
            {...entrada}
            ref={ref}
            type={visible ? 'text' : 'password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            aria-controls={id}
            className="min-h-11 shrink-0 rounded-md border-2 border-linea bg-blanco px-3 font-semibold text-tinta hover:bg-fondo-2"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? 'Ocultar' : 'Mostrar'}
            <span className="sr-only"> {etiqueta.toLowerCase()}</span>
          </button>
        </div>
      )}
    </Campo>
  )
}
