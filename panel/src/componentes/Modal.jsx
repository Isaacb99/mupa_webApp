// Un diálogo con un formulario adentro (editar una tarifa): un <dialog> nativo con showModal() (el resto de la página
// queda inerte y el foco vuelve a donde estaba al cerrarse; Escape lo cierra). Lo de adentro se monta al abrirse, así
// cada vez arranca de cero; el navegador pone el foco en el primer control. Controlado, como Confirmar: abierto lo
// maneja quien lo usa y alCerrar avisa que la persona lo cerró (Escape).
// Con sucio (hay algo escrito sin guardar), Escape (o el gesto de Atrás de Android) no lo cierra de una: pregunta,
// como irse a otra pantalla. El botón "Cancelar" de adentro sigue descartando a propósito, sin preguntar. Un Escape
// seguido de otro sin tocar nada en el medio (después de "Seguir editando" con Escape) lo cierra el navegador sin
// dejar preguntar: es su regla para que una página no atrape a nadie (igual que en ClaveTemporal).
// La pregunta va al lado del diálogo y no adentro: los eventos close y cancel de un <dialog> anidado le llegan en React
// también al de afuera.
import { useEffect, useId, useRef, useState } from 'react'
import { Confirmar, Dialogo } from './Confirmar.jsx'

/**
 * @param {{ abierto: boolean, titulo: string, alCerrar: () => void, sucio?: boolean,
 *   children?: import('react').ReactNode }} props
 */
export function Modal({ abierto, titulo, alCerrar, sucio = false, children }) {
  const dialogo = useRef(null)
  const sigueAbierto = useRef(abierto)
  sigueAbierto.current = abierto
  const [preguntar, setPreguntar] = useState(false)
  const idTitulo = useId()
  useEffect(() => {
    const d = dialogo.current
    if (abierto && !d.open) d.showModal()
    else if (!abierto && d.open) d.close()
    if (!abierto) setPreguntar(false)
  }, [abierto])
  return (
    <>
      <Dialogo
        ref={dialogo}
        aria-labelledby={idTitulo}
        onCancel={(e) => {
          if (!sucio) return
          e.preventDefault()
          setPreguntar(true)
        }}
        onClose={() => {
          if (sigueAbierto.current) alCerrar()
        }}
      >
        <h2 id={idTitulo} className="text-xl font-bold wrap-anywhere">
          {titulo}
        </h2>
        {abierto ? <div className="mt-4">{children}</div> : null}
      </Dialogo>
      <Confirmar
        abierto={abierto && preguntar}
        titulo="¿Descartar lo que escribiste?"
        cancelar="Seguir editando"
        confirmar="Descartar"
        peligro
        alCancelar={() => setPreguntar(false)}
        alConfirmar={() => {
          setPreguntar(false)
          alCerrar()
        }}
      >
        Todavía no lo guardaste. Si lo descartás, se pierde.
      </Confirmar>
    </>
  )
}
