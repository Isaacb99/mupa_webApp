// El diálogo de la contraseña temporal (plan 4.4 y 5.2): la muestra UNA vez, después del alta de una persona o de "Dar
// contraseña temporal". El servidor no la guarda (solo su hash) ni la vuelve a dar: si se cierra sin anotarla, hay
// que dar otra.
// - La temporal va como texto grande, a lo ancho del diálogo y con "Copiar" debajo: en un campo de una línea, en el
//   celular se veía la mitad y se podía dictar incompleta. Un toque la selecciona entera (user-select: all), así
//   también se puede copiar a mano (WCAG 3.3.8). Si no entrara en una línea (letra muy agrandada), corta después de
//   un guion, nunca en el medio de un grupo.
// - "Copiar" la pasa al portapapeles; si el navegador no deja, la deja seleccionada y dice cómo copiarla.
// - Escape (o el gesto de Atrás de Android) no la cierra: solo "Listo, ya la anoté", así no se pierde sin querer. El
//   navegador puede cerrarlo igual con un segundo Escape seguido (lo exige para que una página no atrape a nadie).
// - Dice que con la temporal "puede entrar al panel": es cierto porque solo existe para una cuenta activa (un alta, o
//   "Dar contraseña temporal", que la API rechaza con 409 sobre una desactivada y Usuarios no ofrece ahí).
// El foco arranca en "Copiar". No se guarda en ningún lado del navegador.
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Aviso } from './Aviso.jsx'
import { Boton } from './Boton.jsx'
import { Dialogo } from './Confirmar.jsx'

/**
 * @param {{ datos: { nombre: string, email: string, claveTemporal: string, alta: boolean } | null, alCerrar: () => void }} props
 *   datos: null con el diálogo cerrado; alta: true si es una cuenta nueva, false si es una temporal para una que ya
 *   existía
 */
export function ClaveTemporal({ datos, alCerrar }) {
  const dialogo = useRef(null)
  const copiar = useRef(null)
  const texto = useRef(null)
  const [mensaje, setMensaje] = useState(null)
  const abierto = Boolean(datos)
  const sigueAbierto = useRef(abierto)
  sigueAbierto.current = abierto
  const id = useId()

  useEffect(() => {
    const d = dialogo.current
    if (abierto && !d.open) {
      setMensaje(null)
      d.showModal()
      copiar.current?.focus()
    } else if (!abierto && d.open) {
      d.close()
    }
  }, [abierto])

  function seleccionar() {
    const nodo = texto.current
    const seleccion = window.getSelection()
    if (!nodo || !seleccion) return
    const rango = document.createRange()
    rango.selectNodeContents(nodo)
    seleccion.removeAllRanges()
    seleccion.addRange(rango)
  }

  async function alCopiar() {
    try {
      await navigator.clipboard.writeText(datos.claveTemporal)
      setMensaje('Copiada al portapapeles.')
    } catch {
      seleccionar()
      setMensaje('No se pudo copiar sola: quedó seleccionada, copiala con Ctrl+C (o mantené apretado en el celular).')
    }
  }

  return (
    <Dialogo
      ref={dialogo}
      aria-labelledby={datos ? `${id}-titulo` : undefined}
      aria-describedby={datos ? `${id}-advertencia` : undefined}
      onCancel={(e) => {
        // Escape: no se cierra (se perdería la temporal); se dice cómo cerrarlo.
        e.preventDefault()
        setMensaje('Para cerrar, apretá «Listo, ya la anoté». Anotala antes: no se vuelve a mostrar.')
      }}
      onClose={() => {
        if (sigueAbierto.current) alCerrar()
      }}
    >
      {datos ? (
        <>
          <h2 id={`${id}-titulo`} className="text-xl font-bold">
            Contraseña temporal de {datos.nombre}
          </h2>
          <p className="mt-3">
            {datos.alta ? 'La cuenta quedó creada. ' : 'Su contraseña anterior ya no sirve. '}
            Con esta contraseña y su correo, <strong className="wrap-anywhere">{datos.email}</strong>, puede entrar al
            panel; al entrar, el panel le pide que elija una contraseña propia. Vence en 72 horas.
          </p>
          <div className="mt-4 grid justify-items-start gap-2">
            <p className="font-semibold">Contraseña temporal</p>
            <p
              ref={texto}
              className="w-full rounded-md border-2 border-linea bg-fondo-2 px-3 py-2 font-mono text-lg wrap-anywhere select-all sm:text-xl sm:tracking-wider"
            >
              {/* Si tiene que cortar, que sea después de un guion (sin <wbr>, "-" seguido de una cifra no corta). */}
              {datos.claveTemporal.split('-').map((grupo, i) => (
                <Fragment key={i}>
                  {i > 0 ? (
                    <>
                      -<wbr />
                    </>
                  ) : null}
                  {grupo}
                </Fragment>
              ))}
            </p>
            <Boton ref={copiar} variante="secundario" onClick={alCopiar}>
              Copiar
            </Boton>
          </div>
          <p role="status" className="mt-2 min-h-6 text-sm">
            {mensaje}
          </p>
          <Aviso tipo="atencion" className="mt-3">
            <p id={`${id}-advertencia`} className="font-semibold">
              No se vuelve a mostrar. Dásela en persona o por teléfono.
            </p>
            <p className="mt-1">No la mandes por correo ni por mensaje. Si se pierde o vence, dale otra.</p>
          </Aviso>
          <div className="mt-6 flex justify-end">
            <Boton onClick={alCerrar}>Listo, ya la anoté</Boton>
          </div>
        </>
      ) : null}
    </Dialogo>
  )
}
