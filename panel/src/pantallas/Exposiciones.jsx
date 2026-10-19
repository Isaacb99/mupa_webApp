// Exposiciones (plan 5.2 y 5.4; E3.4), para cualquier rol: las muestras y las salas, en dos pestañas, cada una en el
// orden del sitio, con "Subir" y "Bajar" (PUT /muestras/orden y /salas/orden, con todas: se guarda en el momento) y
// "Nueva muestra" / "Nueva sala". El título de cada una lleva a su ficha (/muestras/:id, /salas/:id).
// - Pestañas con el patrón de ARIA (role="tablist"): una sola parada de Tab, las flechas, Inicio y Fin cambian de
//   pestaña. La elegida va en la dirección (?pestana=salas), así volver de la ficha de una sala vuelve a las salas;
//   cambiar de pestaña no vuelve a pedir las listas (revalidarExposiciones).
// - El orden va con botones, sin arrastrar (WCAG 2.5.7); cada cambio se anuncia en una región role="status"
//   («"Sala 2" quedó en el lugar 1 de 4.») y el foco se queda en su botón (o en el otro, si ese ya no se puede usar),
//   como en las tarifas. Si alguien agregó o eliminó una mientras tanto (409), la lista se vuelve a pedir y el aviso
//   dice que ya está al día; la cantidad de cada pestaña sale de la lista que se ve (corrección de E3, 16/10/2026:
//   quedaba la del loader y el aviso pedía recargar algo que ya se había recargado).
// - Cada muestra con su estado (Borrador o Publicada) y su situación (Actual, Próxima, Finalizada o Permanente), sus
//   fechas y su sala; cada sala, con su estado.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { PAGINAS_PUBLICAS_DE_CONTENIDO } from '../../../compartido/contenidos.js'
import { api } from '../api.js'
import { Aviso, AvisoDeLlegada } from '../componentes/Aviso.jsx'
import { Boton, clasesBoton } from '../componentes/Boton.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { EstadoContenido } from '../componentes/EstadoContenido.jsx'
import { CONTENIDOS, traerTodas } from '../contenidos.js'
import { fechaLarga } from '../formato.js'
import { borrarAviso, leerAviso } from '../sesion.jsx'

const PESTANAS = [
  { valor: 'muestras', texto: 'Muestras' },
  { valor: 'salas', texto: 'Salas' },
]

/** El loader (rutas.jsx lo envuelve con la sesión): las muestras y las salas, enteras (el orden se cambia con todas). */
export async function cargarExposiciones({ request }) {
  const opciones = { signal: request.signal }
  const [muestras, salas] = await Promise.all([
    traerTodas(api, '/muestras', opciones),
    traerTodas(api, '/salas', opciones),
  ])
  return { muestras, salas }
}

/** Cambiar solo de pestaña (?pestana=) no vuelve a pedir las listas. */
export function revalidarExposiciones({ currentUrl, nextUrl, defaultShouldRevalidate }) {
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    const sinPestana = (url) => {
      const p = new URLSearchParams(url.search)
      p.delete('pestana')
      return p.toString()
    }
    if (sinPestana(currentUrl) === sinPestana(nextUrl)) return false
  }
  return defaultShouldRevalidate
}

/** Las fechas de una muestra, en palabras. */
function fechasDe(m) {
  if (m.tipo === 'permanente') return null
  if (!m.fechaInicio) return 'Sin fecha de inicio todavía'
  return m.fechaFin ? `Del ${fechaLarga(m.fechaInicio)} al ${fechaLarga(m.fechaFin)}` : `Desde el ${fechaLarga(m.fechaInicio)}`
}

/** Lo que dice cada pestaña de lo que muestra el sitio (hasta E4, sin prometer que ya se ve). */
const QUE_MUESTRA = PAGINAS_PUBLICAS_DE_CONTENIDO
  ? {
      muestras:
        'Las muestras temporales y permanentes. El sitio muestra las publicadas que están por empezar, las actuales y las permanentes, en este orden; las finalizadas quedan en su página, pero ya no en la lista.',
      salas: 'Las salas del museo. El sitio muestra las publicadas en la página de exposiciones, en este orden.',
    }
  : {
      muestras:
        'Las muestras temporales y permanentes. Cuando esté la página de exposiciones del sitio, va a mostrar las publicadas que están por empezar, las actuales y las permanentes, en este orden; las finalizadas, en su página, pero ya no en la lista.',
      salas:
        'Las salas del museo. Cuando esté la página de exposiciones del sitio, va a mostrar las publicadas, en este orden.',
    }

/**
 * Una lista con su orden (muestras o salas).
 * @param {{ tipo: 'muestras' | 'salas', iniciales: object[], alCambiarCantidad: (tipo: string, n: number) => void }} props
 */
function ListaOrdenada({ tipo, iniciales, alCambiarCantidad }) {
  const c = CONTENIDOS[tipo]
  const [items, setItems] = useState(iniciales)
  useEffect(() => {
    alCambiarCantidad(tipo, items.length)
  }, [tipo, items.length, alCambiarCantidad])
  const [anuncio, setAnuncio] = useState('')
  const [error, setError] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    if (!foco) return
    document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco])
  const idBoton = (accion, x) => `${tipo}-${accion}-${x.id}`
  const nombreDe = (x) => x[c.campoTitulo]

  async function mover(x, delta) {
    if (ocupado) return
    const i = items.findIndex((y) => y.id === x.id)
    const j = i + delta
    if (j < 0 || j >= items.length) return
    const ids = items.map((y) => y.id)
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    setOcupado(true)
    setError(null)
    try {
      const lista = await api.put(`${c.api}/orden`, { ids })
      setItems(lista)
      const lugar = lista.findIndex((y) => y.id === x.id)
      setAnuncio(`«${nombreDe(x)}» quedó en el lugar ${lugar + 1} de ${lista.length}.`)
      const mismo = delta < 0 ? 'subir' : 'bajar'
      const otro = delta < 0 ? 'bajar' : 'subir'
      const extremo = delta < 0 ? lugar === 0 : lugar === lista.length - 1
      setFoco(idBoton(extremo ? otro : mismo, x))
    } catch (err) {
      setError(err?.message ?? 'No se pudo cambiar el orden.')
      if (err?.status === 409) {
        try {
          setItems(await traerTodas(api, c.api))
          setError('La lista cambió mientras tanto (alguien agregó o eliminó una): ya está actualizada. Probá de nuevo.')
        } catch {
          // Queda el error del pedido anterior.
        }
      }
    } finally {
      setOcupado(false)
    }
  }

  const vacio = tipo === 'muestras' ? 'Todavía no hay muestras.' : 'Todavía no hay salas.'
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl">
          {QUE_MUESTRA[tipo]} El orden se guarda en el momento, con «Subir» y «Bajar».
        </p>
        <Link to={c.nueva} className={clasesBoton('primario')}>
          {c.nuevaTexto}
        </Link>
      </div>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {items.length ? (
        <ol className="grid gap-3">
          {items.map((x, i) => (
            <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border-2 border-suave p-3">
              <div className="grid min-w-0 flex-1 basis-60 gap-1">
                <Link to={c.ficha(x.id)} className="inline-flex min-h-11 items-center font-bold wrap-anywhere">
                  {nombreDe(x)}
                </Link>
                <p className="flex flex-wrap items-center gap-2">
                  <EstadoContenido tipo={tipo} item={x} />
                  {tipo === 'muestras' && fechasDe(x) ? <span>{fechasDe(x)}</span> : null}
                  {x.sala ? <span className="text-tenue">· {x.sala.nombre}</span> : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Boton
                  id={idBoton('subir', x)}
                  variante="secundario"
                  disabled={i === 0}
                  ocupado={ocupado}
                  onClick={() => mover(x, -1)}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Subir<span className="sr-only"> «{nombreDe(x)}»</span>
                </Boton>
                <Boton
                  id={idBoton('bajar', x)}
                  variante="secundario"
                  disabled={i === items.length - 1}
                  ocupado={ocupado}
                  onClick={() => mover(x, 1)}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Bajar<span className="sr-only"> «{nombreDe(x)}»</span>
                </Boton>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p>{vacio}</p>
      )}
      <p role="status" className="min-h-6 font-semibold text-ok">
        {anuncio}
      </p>
    </div>
  )
}

export default function Exposiciones() {
  const { muestras, salas } = useLoaderData()
  // Cuántas hay en cada lista, como las muestra cada una (cambia si una lista se vuelve a pedir después de un 409).
  const [cantidades, setCantidades] = useState({ muestras: muestras.length, salas: salas.length })
  const alCambiarCantidad = useCallback(
    (tipo, n) => setCantidades((actual) => (actual[tipo] === n ? actual : { ...actual, [tipo]: n })),
    [],
  )
  const [params, setParams] = useSearchParams()
  const actual = params.get('pestana') === 'salas' ? 'salas' : 'muestras'
  const [aviso] = useState(leerAviso)
  useEffect(() => borrarAviso(), [])
  const base = useId()
  const pestanas = useRef({})
  const idPestana = (valor) => `${base}-pestana-${valor}`
  const idPanel = (valor) => `${base}-panel-${valor}`

  function elegir(valor, { enfocar = false } = {}) {
    setParams(valor === 'muestras' ? {} : { pestana: valor }, { replace: true, preventScrollReset: true })
    if (enfocar) pestanas.current[valor]?.focus()
  }

  function teclas(e) {
    const i = PESTANAS.findIndex((p) => p.valor === actual)
    const destino = {
      ArrowRight: (i + 1) % PESTANAS.length,
      ArrowLeft: (i - 1 + PESTANAS.length) % PESTANAS.length,
      Home: 0,
      End: PESTANAS.length - 1,
    }[e.key]
    if (destino === undefined) return
    e.preventDefault()
    elegir(PESTANAS[destino].valor, { enfocar: true })
  }

  return (
    <>
      <Encabezado titulo="Exposiciones" />
      <AvisoDeLlegada texto={aviso} className="mb-6" />
      <div role="tablist" aria-label="Muestras o salas" className="flex gap-2 border-b-2 border-suave" onKeyDown={teclas}>
        {PESTANAS.map(({ valor, texto }) => {
          const elegida = valor === actual
          return (
            <button
              key={valor}
              ref={(nodo) => {
                pestanas.current[valor] = nodo
              }}
              id={idPestana(valor)}
              type="button"
              role="tab"
              aria-selected={elegida}
              aria-controls={idPanel(valor)}
              tabIndex={elegida ? 0 : -1}
              onClick={() => elegir(valor)}
              className={
                '-mb-0.5 inline-flex min-h-11 items-center rounded-t-md border-2 px-4 text-lg ' +
                (elegida
                  ? 'border-suave border-b-blanco bg-blanco font-bold text-tinta'
                  : 'border-transparent text-tinta hover:bg-fondo-2 hover:text-accion-fuerte')
              }
            >
              {texto} ({cantidades[valor]})
            </button>
          )
        })}
      </div>
      {PESTANAS.map(({ valor }) => (
        <div
          key={valor}
          role="tabpanel"
          id={idPanel(valor)}
          aria-labelledby={idPestana(valor)}
          hidden={valor !== actual}
          className="pt-6"
        >
          <ListaOrdenada
            tipo={valor}
            iniciales={valor === 'muestras' ? muestras : salas}
            alCambiarCantidad={alCambiarCantidad}
          />
        </div>
      ))}
    </>
  )
}
