// Botones del panel: 44 px de alto como mínimo en todos los tamaños (objetivos táctiles de 2.5.8 con margen, plan
// 5.6) y el foco grueso de panel.css.
// - variante: 'primario' (la acción principal de la pantalla, una sola), 'secundario', 'peligro' (eliminar) o
//   'enlace' (un botón que se ve como enlace: "Mostrar", "Cancelar" en una línea de texto).
// - ocupado: mientras se envía. NO se deshabilita (un botón deshabilitado pierde el foco y el lector deja de
//   anunciarlo): queda aria-disabled y no hace nada; el texto lo cambia quien lo usa ("Guardando…").
// clasesBoton() da las mismas clases para un <Link> que tiene que verse como botón.
const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-semibold no-underline ' +
  'aria-disabled:cursor-wait aria-disabled:opacity-70'

const VARIANTES = {
  primario: 'border-2 border-accion bg-accion text-blanco hover:border-accion-fuerte hover:bg-accion-fuerte hover:text-blanco',
  secundario: 'border-2 border-linea bg-blanco text-tinta hover:bg-fondo-2 hover:text-tinta',
  peligro: 'border-2 border-error bg-error text-blanco hover:bg-blanco hover:text-error',
  enlace: 'min-h-11 px-1 font-normal text-accion underline underline-offset-2 hover:text-accion-fuerte',
}

export function clasesBoton(variante = 'primario', extra = '') {
  const base = variante === 'enlace' ? 'inline-flex items-center gap-2 aria-disabled:opacity-70' : BASE
  return `${base} ${VARIANTES[variante] ?? VARIANTES.primario} ${extra}`.trim()
}

/**
 * @param {{ variante?: 'primario' | 'secundario' | 'peligro' | 'enlace', ocupado?: boolean, type?: 'button' | 'submit' } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Boton({ variante = 'primario', ocupado = false, type = 'button', className = '', onClick, ...resto }) {
  return (
    <button
      type={type}
      className={clasesBoton(variante, className)}
      aria-disabled={ocupado || undefined}
      onClick={(e) => {
        if (ocupado) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
      {...resto}
    />
  )
}
