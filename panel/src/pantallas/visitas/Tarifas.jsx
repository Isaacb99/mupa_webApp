// Las tarifas de Visitas (plan 5.3 y 5.4): la lista en el orden del sitio, con Editar, Subir, Bajar y Eliminar en
// cada una y "Agregar una tarifa" (un diálogo con el formulario). Cada acción se guarda en el momento y se anuncia en
// una región role="status" ("«General» quedó en el lugar 1 de 3"). El orden va con botones, sin arrastrar (WCAG
// 2.5.7); después de mover una, el foco se queda en su botón (o en el otro, si ese ya no se puede usar).
// Eliminar pregunta antes y propone ocultarla en vez de borrarla: el id de la tarifa lo va a usar la venta de entradas
// (plan 3.6).
// Una oculta tiene "Mostrar en el sitio" (el mismo cambio que Editar → "Visible en el sitio", en un botón).
// Lo escrito en el diálogo de una tarifa cuenta como cambio sin guardar de la pantalla (alCambiarSucio): irse a otra
// pantalla pregunta, cerrar o recargar la pestaña lo avisa el navegador y Escape pregunta antes de cerrar el diálogo.
// Cancelar lo descarta a propósito.
// Si un alta se queda sin respuesta (sin conexión o un error del servidor de por medio), puede haberse guardado igual:
// antes de mandarla de nuevo, el formulario mira la lista y, si ya está, no la repite (si no, quedaba dos veces). Si
// la persona cierra el diálogo, la lista se vuelve a pedir.
import { useCallback, useEffect, useRef, useState } from 'react'
import { esquemaTarifa } from '../../../../compartido/esquemas/tarifas.js'
import { leerPrecio, textoPrecio } from '../../../../compartido/precios.js'
import { api, quizasGuardo } from '../../api.js'
import { Aviso } from '../../componentes/Aviso.jsx'
import { Boton } from '../../componentes/Boton.jsx'
import { Campo } from '../../componentes/Campo.jsx'
import { Casilla } from '../../componentes/Casilla.jsx'
import { Confirmar } from '../../componentes/Confirmar.jsx'
import { Modal } from '../../componentes/Modal.jsx'
import { ResumenErrores, useEnvio } from '../../componentes/formulario.jsx'
import { aTexto, iguales, validarCon } from '../../formato.js'

const PREFIJO = 't-'
const ETIQUETAS = {
  nombre: 'Nombre',
  precio: 'Precio',
  condicion: 'Condición',
  gratuita: 'Gratuita',
  visible: 'Visible',
}
const MENSAJE_PRECIO = 'Escribí el precio en pesos, sin centavos (por ejemplo 3000).'

/**
 * El formulario de una tarifa (nueva o existente), dentro del diálogo (se monta al abrirse).
 * idsAntes: las tarifas que había al abrirlo (para reconocer un alta que se guardó sin respuesta); alQuizas: avisa que
 * un alta quedó sin respuesta.
 */
function FormularioTarifa({ tarifa, idsAntes, alGuardar, alCancelar, alCambiarSucio, alQuizas }) {
  const [inicial] = useState(() => ({
    nombre: aTexto(tarifa?.nombre),
    gratuita: tarifa?.gratuita ?? false,
    precio: tarifa?.precio != null ? String(tarifa.precio) : '',
    condicion: aTexto(tarifa?.condicion),
    visible: tarifa?.visible ?? true,
  }))
  const [v, setV] = useState(inicial)
  const sucio = !iguales(v, inicial)
  useEffect(() => {
    alCambiarSucio?.('tarifa', sucio)
  }, [sucio, alCambiarSucio])
  // Al cerrarse el diálogo (guardada, cancelada o con Escape), lo que tenía ya no está.
  useEffect(() => () => alCambiarSucio?.('tarifa', false), [alCambiarSucio])
  const envio = useEnvio(null)
  const poner = (campo, valor) => setV((x) => ({ ...x, [campo]: valor }))
  const [antes] = useState(() => new Set(idsAntes))
  const sinRespuesta = useRef(false)

  async function alEnviar(e) {
    e.preventDefault()
    const precio = v.gratuita ? null : leerPrecio(v.precio)
    if (Number.isNaN(precio)) {
      envio.mostrar({ precio: MENSAJE_PRECIO })
      return
    }
    const r0 = validarCon(esquemaTarifa, { ...v, precio })
    if (!r0.ok) {
      envio.mostrar(r0.errores, r0.general)
      return
    }
    const r = await envio.enviar(async () => {
      if (tarifa) return { tarifa: await api.put(`/tarifas/${tarifa.id}`, r0.datos) }
      if (sinRespuesta.current) {
        // El alta anterior no tuvo respuesta: si se guardó igual, ya está en la lista.
        const lista = await api.get('/tarifas')
        const ya = lista.find((t) => !antes.has(t.id) && t.nombre === r0.datos.nombre)
        if (ya) return { tarifa: ya, lista }
      }
      return { tarifa: await api.post('/tarifas', r0.datos) }
    })
    if (r.ok) {
      alGuardar(r.datos.tarifa, r.datos.lista)
      return
    }
    if (!tarifa && quizasGuardo(r.error)) {
      sinRespuesta.current = true
      alQuizas?.()
    }
  }

  return (
    <form onSubmit={alEnviar} noValidate className="grid gap-5">
      <ResumenErrores envio={envio} prefijo={PREFIJO} etiquetas={ETIQUETAS} />
      <Campo
        id={`${PREFIJO}nombre`}
        etiqueta="Nombre"
        obligatorio
        ayuda="Por ejemplo «General», «Estudiantes y jubilados» o «Menores de 6 años»."
        maxLength={80}
        autoComplete="off"
        value={v.nombre}
        onChange={(e) => poner('nombre', e.target.value)}
        error={envio.errores.nombre}
      />
      <Casilla
        id={`${PREFIJO}gratuita`}
        etiqueta="Gratuita"
        checked={v.gratuita}
        onChange={(e) => poner('gratuita', e.target.checked)}
        error={envio.errores.gratuita}
      />
      {v.gratuita ? null : (
        <Campo
          id={`${PREFIJO}precio`}
          etiqueta="Precio en pesos"
          obligatorio
          ayuda="Sin centavos, por ejemplo 3000 o 3.000."
          inputMode="numeric"
          autoComplete="off"
          className="max-w-60"
          value={v.precio}
          onChange={(e) => poner('precio', e.target.value)}
          error={envio.errores.precio}
        />
      )}
      <Campo
        id={`${PREFIJO}condicion`}
        etiqueta="Condición"
        ayuda="Opcional: quién la puede usar, por ejemplo «Con credencial»."
        maxLength={160}
        autoComplete="off"
        value={v.condicion}
        onChange={(e) => poner('condicion', e.target.value)}
        error={envio.errores.condicion}
      />
      <Casilla
        id={`${PREFIJO}visible`}
        etiqueta="Visible en el sitio"
        ayuda="Si la desmarcás, queda guardada pero el sitio no la muestra."
        checked={v.visible}
        onChange={(e) => poner('visible', e.target.checked)}
        error={envio.errores.visible}
      />
      <div className="mt-2 flex flex-wrap justify-end gap-3">
        <Boton variante="secundario" onClick={alCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" ocupado={envio.enviando}>
          {envio.enviando ? 'Guardando…' : 'Guardar la tarifa'}
        </Boton>
      </div>
    </form>
  )
}

/** @param {{ tarifas: object[], alCambiarSucio?: (clave: string, sucio: boolean) => void }} props */
export function Tarifas({ tarifas: iniciales, alCambiarSucio }) {
  const [tarifas, setTarifas] = useState(iniciales)
  // Lo escrito en el diálogo: para la pantalla (la pregunta al irse) y para el diálogo (la pregunta con Escape).
  const [formularioSucio, setFormularioSucio] = useState(false)
  const marcarSucio = useCallback(
    (clave, sucio) => {
      setFormularioSucio(sucio)
      alCambiarSucio?.(clave, sucio)
    },
    [alCambiarSucio],
  )
  // Un alta quedó sin respuesta: al cerrar el diálogo, la lista se vuelve a pedir (puede haberse guardado).
  const altaDudosa = useRef(false)
  const [anuncio, setAnuncio] = useState('')
  const [error, setError] = useState(null)
  const [editando, setEditando] = useState(null) // null | 'nueva' | tarifa
  const [borrando, setBorrando] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  // A dónde va el foco después del próximo dibujo: después de que el diálogo se cerró (si no, el foco volvería al
  // botón Eliminar de una tarifa que ya no está) y de que la lista se reordenó.
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    if (!foco) return
    document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco])

  const idBoton = (accion, t) => `${PREFIJO}${accion}-${t.id}`

  async function recargar() {
    try {
      setTarifas(await api.get('/tarifas'))
    } catch {
      // Ya se mostró el error del pedido anterior.
    }
  }

  async function mover(t, delta) {
    if (ocupado) return
    const i = tarifas.findIndex((x) => x.id === t.id)
    const j = i + delta
    if (j < 0 || j >= tarifas.length) return
    const ids = tarifas.map((x) => x.id)
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    setOcupado(true)
    setError(null)
    try {
      const lista = await api.put('/tarifas/orden', { ids })
      setTarifas(lista)
      const lugar = lista.findIndex((x) => x.id === t.id)
      setAnuncio(`«${t.nombre}» quedó en el lugar ${lugar + 1} de ${lista.length}.`)
      // El foco, en el mismo botón; si ya no se puede usar (llegó arriba o abajo de todo), en el otro.
      const mismo = delta < 0 ? 'subir' : 'bajar'
      const otro = delta < 0 ? 'bajar' : 'subir'
      const extremo = delta < 0 ? lugar === 0 : lugar === lista.length - 1
      setFoco(idBoton(extremo ? otro : mismo, t))
    } catch (err) {
      setError(err?.message ?? 'No se pudo cambiar el orden.')
      if (err?.status === 409) await recargar()
    } finally {
      setOcupado(false)
    }
  }

  // Al cerrarse el diálogo, el foco vuelve solo a "Editar" o a "Agregar una tarifa".
  // lista: la que se leyó para reconocer un alta sin respuesta (ya la trae). Si hubo un alta sin respuesta y después
  // se guardó otra (p. ej. con el nombre cambiado), la lista se vuelve a pedir: la primera puede estar guardada.
  function alGuardarTarifa(t, lista) {
    const nueva = editando === 'nueva'
    const dudosa = altaDudosa.current
    altaDudosa.current = false
    setEditando(null)
    setTarifas((l) => lista ?? (nueva ? [...l, t] : l.map((x) => (x.id === t.id ? t : x))))
    if (dudosa && !lista) recargar()
    setAnuncio(nueva ? `Se agregó la tarifa «${t.nombre}» al final de la lista.` : `Se guardó la tarifa «${t.nombre}».`)
  }

  function cerrarFormulario() {
    setEditando(null)
    if (altaDudosa.current) {
      altaDudosa.current = false
      recargar()
    }
  }

  async function eliminar(t) {
    setOcupado(true)
    setError(null)
    try {
      await api.delete(`/tarifas/${t.id}`)
      setBorrando(null)
      setTarifas((lista) => lista.filter((x) => x.id !== t.id))
      setAnuncio(`Se eliminó la tarifa «${t.nombre}».`)
      setFoco(`${PREFIJO}agregar`)
    } catch (err) {
      setBorrando(null)
      setError(err?.message ?? 'No se pudo eliminar la tarifa.')
      if (err?.status === 404) await recargar()
    } finally {
      setOcupado(false)
    }
  }

  /** Ocultar (desde Eliminar) o volver a mostrar (el botón de una oculta): el PUT con la tarifa completa. */
  async function cambiarVisible(t, visible) {
    if (ocupado) return
    setOcupado(true)
    setError(null)
    try {
      const { id, orden, ...datos } = t
      const cambiada = await api.put(`/tarifas/${id}`, { ...datos, visible })
      setBorrando(null)
      setTarifas((lista) => lista.map((x) => (x.id === t.id ? cambiada : x)))
      if (visible) {
        setAnuncio(`La tarifa «${t.nombre}» se volvió a mostrar en el sitio.`)
        // El botón que tenía el foco ya no está.
        setFoco(idBoton('editar', t))
      } else {
        setAnuncio(`La tarifa «${t.nombre}» quedó oculta: sigue guardada, pero el sitio no la muestra.`)
      }
    } catch (err) {
      setBorrando(null)
      setError(err?.message ?? (visible ? 'No se pudo mostrar la tarifa.' : 'No se pudo ocultar la tarifa.'))
      if (err?.status === 404) await recargar()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-tenue">
        El sitio las muestra en este orden. Las ocultas quedan guardadas pero no se muestran.
      </p>
      <p>
        Cada cambio en las tarifas se guarda en el momento: al apretar «Guardar la tarifa», «Subir», «Bajar» o
        «Eliminar». La nota de las tarifas, más abajo, tiene su propio botón.
      </p>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {tarifas.length ? (
        <ol className="grid gap-3">
          {tarifas.map((t, i) => (
            <li
              key={t.id}
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border-2 p-3 ${t.visible ? 'border-suave' : 'border-dashed border-linea bg-fondo-2'}`}
            >
              <div className="min-w-0 flex-1 basis-60">
                <p className="font-bold break-words">
                  {t.nombre}
                  {t.visible ? null : (
                    <span className="ml-2 rounded-sm bg-blanco px-1.5 text-sm font-semibold text-tenue">Oculta</span>
                  )}
                </p>
                <p>
                  {t.gratuita ? 'Gratuita' : textoPrecio(t.precio)}
                  {t.condicion ? <span className="text-tenue"> · {t.condicion}</span> : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.visible ? null : (
                  <Boton variante="secundario" ocupado={ocupado} onClick={() => cambiarVisible(t, true)}>
                    Mostrar en el sitio<span className="sr-only"> «{t.nombre}»</span>
                  </Boton>
                )}
                <Boton id={idBoton('editar', t)} variante="secundario" onClick={() => setEditando(t)}>
                  Editar<span className="sr-only"> «{t.nombre}»</span>
                </Boton>
                <Boton
                  id={idBoton('subir', t)}
                  variante="secundario"
                  disabled={i === 0}
                  ocupado={ocupado}
                  onClick={() => mover(t, -1)}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Subir<span className="sr-only"> «{t.nombre}»</span>
                </Boton>
                <Boton
                  id={idBoton('bajar', t)}
                  variante="secundario"
                  disabled={i === tarifas.length - 1}
                  ocupado={ocupado}
                  onClick={() => mover(t, 1)}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Bajar<span className="sr-only"> «{t.nombre}»</span>
                </Boton>
                <Boton variante="secundario" onClick={() => setBorrando(t)}>
                  Eliminar<span className="sr-only"> «{t.nombre}»</span>
                </Boton>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p>Todavía no hay tarifas.</p>
      )}
      <p role="status" className="min-h-6 font-semibold text-ok">
        {anuncio}
      </p>
      <div>
        <Boton id={`${PREFIJO}agregar`} onClick={() => setEditando('nueva')}>
          Agregar una tarifa
        </Boton>
      </div>

      <Modal
        abierto={editando !== null}
        titulo={editando === 'nueva' ? 'Agregar una tarifa' : `Editar la tarifa «${editando?.nombre ?? ''}»`}
        alCerrar={cerrarFormulario}
        sucio={formularioSucio}
      >
        <FormularioTarifa
          tarifa={editando === 'nueva' ? null : editando}
          idsAntes={tarifas.map((t) => t.id)}
          alGuardar={alGuardarTarifa}
          alCancelar={cerrarFormulario}
          alCambiarSucio={marcarSucio}
          alQuizas={() => {
            altaDudosa.current = true
          }}
        />
      </Modal>

      <Confirmar
        abierto={borrando !== null}
        titulo={`¿Eliminar la tarifa «${borrando?.nombre ?? ''}»?`}
        confirmar="Eliminar"
        peligro
        ocupado={ocupado}
        alCancelar={() => setBorrando(null)}
        alConfirmar={() => eliminar(borrando)}
      >
        <p>Se borra para siempre.</p>
        {borrando?.visible ? (
          <>
            <p>
              Si solo querés que no se vea en el sitio, ocultala: queda guardada y la podés volver a mostrar cuando
              quieras, con «Mostrar en el sitio».
            </p>
            <div>
              <Boton variante="secundario" ocupado={ocupado} onClick={() => cambiarVisible(borrando, false)}>
                Ocultarla en vez de eliminarla
              </Boton>
            </div>
          </>
        ) : (
          <p>Ya está oculta: el sitio no la muestra aunque no la elimines.</p>
        )}
      </Confirmar>
    </div>
  )
}
