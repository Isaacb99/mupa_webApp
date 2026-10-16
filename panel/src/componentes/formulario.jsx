// El patrón de los formularios del panel (plan 5.1, 5.4 y 5.6), sin librería de formularios:
//
//   const CAMPOS = ['direccion', 'telefono']                  // fuera del componente (los que muestra la pantalla)
//   const [valores, setValores] = useState(inicial)            // estado controlado
//   const envio = useEnvio(CAMPOS)
//   const { dialogo, liberar } = useCambiosSinGuardar(!iguales(valores, inicial))
//   async function alEnviar(e) {
//     e.preventDefault()
//     const r = await envio.enviar(() => api.put('/museo', valores))
//     if (r.ok) { ... }                                        // r.datos: lo que devolvió la API
//   }
//   <form onSubmit={alEnviar} noValidate>
//     <ResumenErrores envio={envio} etiquetas={{ direccion: 'Dirección', telefono: 'Teléfono' }} />
//     <Campo id="direccion" etiqueta="Dirección" error={envio.errores.direccion} value=… onChange=… />
//     <Boton type="submit" ocupado={envio.enviando}>{envio.enviando ? 'Guardando…' : 'Guardar'}</Boton>
//   </form>
//   {dialogo}
//
// - useEnvio: corre el pedido, reparte el error de la API (repartirError: cada mensaje a su campo y lo demás arriba) y
//   después de un error pone el foco en el resumen. Un segundo envío mientras corre el primero no hace nada. Si la
//   sesión venció, api.js abre el diálogo de reingreso y repite el pedido: el formulario no se pierde. Sin conexión:
//   "Sin conexión, reintentá." arriba y los valores como estaban.
// - ResumenErrores: arriba del formulario, con un enlace a cada campo con error (el id del campo es prefijo + nombre).
//   Si ese id es de un grupo (las franjas de un día, el rol), el enlace lleva al primer control del grupo. El cuadro
//   que recibe el foco es un role="group" con el título como nombre (un div sin rol no se puede nombrar).
// - useCambiosSinGuardar(sucio): con cambios sin guardar, pregunta antes de ir a otra pantalla del panel (useBlocker,
//   también "Salir") y el navegador avisa antes de cerrar o recargar la pestaña (beforeunload). Para guardar e irse
//   en el mismo clic: liberar() y después navigate(), porque el estado "ya no está sucio" llega recién en el próximo
//   dibujo. Una sola pantalla a la vez puede usarlo (React Router admite un bloqueo por vez). Con detalle (un texto),
//   la pregunta dice además qué falta guardar: Visitas, con cuatro formularios en una pantalla larga, pasa "Falta
//   guardar: Horario semanal y Aviso general.".
// - descartarCambiosSinGuardar(): ya no hay nada que guardar (la contraseña temporal venció): ni la pregunta ni el
//   aviso del navegador, en ninguna pantalla, hasta que se recargue la página.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router'
import { repartirError } from '../api.js'
import { Confirmar } from './Confirmar.jsx'

/** El primer control de un grupo (o el elemento mismo, si ya es un control). */
const CONTROL = 'input:not([type="hidden"]), select, textarea, button'
function controlDe(id) {
  const elemento = document.getElementById(id)
  if (!elemento || elemento.matches(CONTROL)) return elemento
  return elemento.querySelector(CONTROL) ?? elemento
}

let descartado = false
/** Lo que haya sin guardar ya no importa (ver arriba). */
export function descartarCambiosSinGuardar() {
  descartado = true
}

/**
 * @param {string[] | null} [conocidos]  los campos del formulario (los que no estén van al mensaje general)
 */
export function useEnvio(conocidos = null) {
  const [estado, setEstado] = useState({ enviando: false, errores: {}, mensaje: null, intento: 0 })
  const enCurso = useRef(false)
  const lista = useRef(conocidos)
  lista.current = conocidos
  const resumenRef = useRef(null)

  useEffect(() => {
    if (estado.intento > 0) resumenRef.current?.focus()
  }, [estado.intento])

  /**
   * @template T
   * @param {() => Promise<T>} pedido
   * @returns {Promise<{ ok: true, datos: T } | { ok: false, error?: unknown }>}
   */
  const enviar = useCallback(async (pedido) => {
    if (enCurso.current) return { ok: false }
    enCurso.current = true
    setEstado((e) => ({ ...e, enviando: true }))
    try {
      const datos = await pedido()
      setEstado((e) => ({ enviando: false, errores: {}, mensaje: null, intento: e.intento }))
      return { ok: true, datos }
    } catch (error) {
      const { errores, mensaje } = repartirError(error, lista.current)
      setEstado((e) => ({ enviando: false, errores, mensaje, intento: e.intento + 1 }))
      return { ok: false, error }
    } finally {
      enCurso.current = false
    }
  }, [])

  /** Saca los errores (p. ej. al reabrir un diálogo). */
  const limpiar = useCallback(() => setEstado((e) => ({ ...e, errores: {}, mensaje: null })), [])

  /** Muestra un error propio (una validación del panel antes de mandar), con el mismo resumen y foco. */
  const mostrar = useCallback(
    (errores, mensaje = null) => setEstado((e) => ({ ...e, enviando: false, errores, mensaje, intento: e.intento + 1 })),
    [],
  )

  return { ...estado, enviar, limpiar, mostrar, resumenRef }
}

/**
 * @param {{ envio: ReturnType<typeof useEnvio>, etiquetas?: Record<string, string>, prefijo?: string }} props
 *   prefijo: el del id de los campos (id = prefijo + nombre del campo), si la pantalla tiene más de un formulario
 */
export function ResumenErrores({ envio, etiquetas = {}, prefijo = '' }) {
  const campos = Object.entries(envio.errores)
  if (!envio.mensaje && campos.length === 0) return null
  const idTitulo = `${prefijo}resumen-errores`
  return (
    <div
      ref={envio.resumenRef}
      tabIndex={-1}
      role="group"
      aria-labelledby={campos.length ? idTitulo : undefined}
      // wrap-anywhere: un mensaje con una dirección larga (https://www.google.com/maps/embed?) desbordaba a 320 px.
      className="mb-6 rounded-md border-2 border-error bg-error-fondo p-4 wrap-anywhere"
    >
      <div role="alert">
        {campos.length ? (
          <>
            <h2 id={idTitulo} className="text-lg font-bold text-error">
              {campos.length === 1 ? 'Revisá este dato' : 'Revisá estos datos'}
            </h2>
            {envio.mensaje ? <p className="mt-1 text-tinta">{envio.mensaje}</p> : null}
            {/* Cada enlace, de 44 px de alto (la meta del panel para lo que se toca). */}
            <ul className="mt-1 grid list-disc pl-5">
              {campos.map(([campo, texto]) => (
                <li key={campo}>
                  <a
                    href={`#${prefijo}${campo}`}
                    className="block py-2.5 font-semibold text-error"
                    onClick={(e) => {
                      // A mano: un cambio de "#" en la URL lo tomaría el router como una navegación.
                      e.preventDefault()
                      controlDe(`${prefijo}${campo}`)?.focus()
                    }}
                  >
                    {etiquetas[campo] ? `${etiquetas[campo]}: ` : ''}
                    {texto}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="font-semibold text-error">{envio.mensaje}</p>
        )}
      </div>
    </div>
  )
}

/**
 * @param {boolean} sucio  hay cambios sin guardar
 * @param {string | null} [detalle]  qué falta guardar (una oración), antes del texto de siempre
 * @returns {{ dialogo: import('react').ReactNode, liberar: () => void }}
 */
export function useCambiosSinGuardar(sucio, detalle = null) {
  const libre = useRef(false)
  useEffect(() => {
    libre.current = false
  }, [sucio])
  const bloqueo = useBlocker(
    ({ currentLocation, nextLocation }) =>
      sucio && !libre.current && !descartado && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!sucio) return undefined
    const avisar = (e) => {
      if (libre.current || descartado) return
      e.preventDefault()
      // Chrome viejo y Safari todavía lo necesitan para mostrar el aviso.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio])
  const dialogo = (
    <Confirmar
      abierto={bloqueo.state === 'blocked'}
      titulo="Hay cambios sin guardar"
      cancelar="Seguir editando"
      confirmar="Salir sin guardar"
      peligro
      alCancelar={() => bloqueo.reset?.()}
      alConfirmar={() => bloqueo.proceed?.()}
    >
      {detalle ? <p>{detalle}</p> : null}
      <p>Si salís de esta pantalla, se pierde lo que cambiaste y no guardaste.</p>
    </Confirmar>
  )
  return {
    dialogo,
    liberar: () => {
      libre.current = true
    },
  }
}
