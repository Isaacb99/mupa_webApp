// Diálogo de confirmación (plan 5.4): un <dialog> nativo con showModal(), que deja el resto de la página inerte y
// devuelve el foco a donde estaba al cerrarse. El foco arranca en "cancelar" (lo que no rompe nada). Escape cancela.
// Controlado: abierto lo maneja quien lo usa; alConfirmar y alCancelar avisan, y quien lo usa lo cierra.
// El texto (las consecuencias: "Se borra para siempre") es la descripción del diálogo: el lector la dice al abrirse,
// junto con el título, aunque el foco esté en "Cancelar".
import { useEffect, useId, useRef } from 'react'
import { Boton } from './Boton.jsx'

/**
 * @param {{ abierto: boolean, titulo: string, children?: import('react').ReactNode, confirmar?: string,
 *   cancelar?: string, peligro?: boolean, ocupado?: boolean, alConfirmar: () => void, alCancelar: () => void }} props
 */
export function Confirmar({
  abierto,
  titulo,
  children,
  confirmar = 'Confirmar',
  cancelar = 'Cancelar',
  peligro = false,
  ocupado = false,
  alConfirmar,
  alCancelar,
}) {
  const dialogo = useRef(null)
  const botonCancelar = useRef(null)
  const sigueAbierto = useRef(abierto)
  sigueAbierto.current = abierto
  const idTitulo = useId()
  const idTexto = useId()
  useEffect(() => {
    const d = dialogo.current
    if (abierto && !d.open) {
      d.showModal()
      botonCancelar.current?.focus()
    } else if (!abierto && d.open) {
      d.close()
    }
  }, [abierto])
  return (
    <Dialogo
      ref={dialogo}
      aria-labelledby={idTitulo}
      aria-describedby={idTexto}
      // Escape (o el navegador) lo cerró sin pasar por los botones: es cancelar.
      onClose={() => {
        if (sigueAbierto.current) alCancelar()
      }}
    >
      <h2 id={idTitulo} className="text-xl font-bold wrap-anywhere">
        {titulo}
      </h2>
      <div id={idTexto} className="mt-3 grid gap-2">
        {typeof children === 'string' ? <p>{children}</p> : children}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Boton ref={botonCancelar} variante="secundario" onClick={alCancelar}>
          {cancelar}
        </Boton>
        <Boton variante={peligro ? 'peligro' : 'primario'} ocupado={ocupado} onClick={alConfirmar}>
          {confirmar}
        </Boton>
      </div>
    </Dialogo>
  )
}

/** El <dialog> con el estilo del panel (también lo usa ReingresoDialogo). */
export function Dialogo({ className = '', ...props }) {
  return (
    <dialog
      className={
        'm-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100svh-2rem)] overflow-auto rounded-lg border-2 ' +
        `border-linea bg-blanco p-6 text-tinta shadow-xl ${className}`
      }
      {...props}
    />
  )
}
