// Novedades (plan 5.2 y 5.4; E3.3), para cualquier rol: el listado de noticias y actividades, con filtros por estado
// y tipo, búsqueda (título, dirección y resumen) y de a 20 por página (GET /novedades?estado=&tipo=&q=&pagina=).
// - Los filtros van en la dirección del panel (/novedades?estado=borrador&q=taller): Atrás vuelve al listado como
//   estaba y se puede guardar en marcadores. Lo que no sirve en la dirección (tocada a mano) se descarta
//   (contenidos.js, leerFiltros).
// - En pantallas medianas, una tabla; en el celular, tarjetas (plan 5.2). Cada una con el título (lleva a su ficha),
//   el tipo, el estado (Borrador o Publicada, y "Realizada" en una actividad que ya pasó), la fecha (la de la
//   actividad o la de publicación) y la última edición.
// - Al filtrar o cambiar de página se anuncia cuántas hay (role="status"); al cambiar de página, el foco va a esa
//   cuenta (el enlace que se apretó puede no estar en la página nueva).
// - "Nueva novedad" lleva al alta (/novedades/nueva). El aviso con que se llega (después de eliminar una) se ve arriba.
import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useLocation, useNavigate } from 'react-router'
import { PAGINAS_PUBLICAS_DE_CONTENIDO } from '../../../compartido/contenidos.js'
import { BUSQUEDA_MAX, TIPOS_NOVEDAD } from '../../../compartido/esquemas/contenido.js'
import { api } from '../api.js'
import { AvisoDeLlegada } from '../componentes/Aviso.jsx'
import { Boton, clasesBoton } from '../componentes/Boton.jsx'
import { Campo } from '../componentes/Campo.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { EstadoContenido } from '../componentes/EstadoContenido.jsx'
import { CONTENIDOS, consultaDe, leerFiltros } from '../contenidos.js'
import { fechaHora, fechaHoraLocal } from '../formato.js'
import { borrarAviso, leerAviso } from '../sesion.jsx'

const C = CONTENIDOS.novedades
const TIPOS = Object.fromEntries(C.tipos.map((t) => [t.valor, t.texto]))

/** El loader (rutas.jsx lo envuelve con la sesión): una página del listado, con los filtros de la dirección. */
export async function cargarNovedades({ request }) {
  const filtros = leerFiltros(new URL(request.url).searchParams, TIPOS_NOVEDAD)
  const pagina = await api.get(`/novedades${consultaDe(filtros)}`, { signal: request.signal })
  return { ...pagina, filtros }
}

/** La fecha que importa de una novedad: la de la actividad o la de publicación (null si no tiene). */
function fechaDe(n) {
  if (n.tipo === 'actividad') return n.eventoInicio ? `Es el ${fechaHoraLocal(n.eventoInicio)}` : 'Sin fecha todavía'
  return n.publicadoEn ? `Publicada el ${fechaHora(n.publicadoEn)}` : null
}

const ultimaEdicion = (n) =>
  `${n.ultimaEdicion.nombre ?? 'una cuenta que ya no existe'}, ${fechaHora(n.ultimaEdicion.fecha)}`

export default function Novedades() {
  const { items, total, pagina, paginas, filtros } = useLoaderData()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [aviso] = useState(leerAviso)
  useEffect(() => borrarAviso(), [])
  const hayFiltros = Boolean(filtros.estado || filtros.tipo || filtros.q)
  const cuenta =
    total === 0
      ? hayFiltros
        ? 'Ninguna novedad coincide con la búsqueda.'
        : 'Todavía no hay novedades.'
      : `${total === 1 ? 'Una novedad' : `${total} novedades`}${hayFiltros ? ' con esos filtros' : ''}` +
        `${paginas > 1 ? `: página ${pagina} de ${paginas}` : ''}.`
  // La cuenta se anuncia cuando cambian los filtros o la página (al llegar, no: el foco va al título).
  const [anuncio, setAnuncio] = useState('')
  const busquedaAnterior = useRef(search)
  const enfocarCuenta = useRef(false)
  const cuentaRef = useRef(null)
  useEffect(() => {
    if (busquedaAnterior.current === search) return
    busquedaAnterior.current = search
    setAnuncio(cuenta)
    if (enfocarCuenta.current) {
      enfocarCuenta.current = false
      cuentaRef.current?.focus()
    }
  }, [search, cuenta])

  // Los campos de los filtros: lo de la dirección (también al volver con Atrás o con "Ver todas").
  const [campos, setCampos] = useState(filtros)
  useEffect(() => setCampos(filtros), [filtros])
  const poner = (campo) => (e) => setCampos((f) => ({ ...f, [campo]: e.target.value }))

  function filtrar(e) {
    e.preventDefault()
    navigate(`/novedades${consultaDe({ estado: campos.estado, tipo: campos.tipo, q: campos.q.trim() })}`)
  }

  const aPagina = (n) => `/novedades${consultaDe({ ...filtros, pagina: n })}`
  const sinPagina = pagina > paginas

  return (
    <>
      <Encabezado titulo="Novedades">
        <Link to={C.nueva} className={clasesBoton('primario')}>
          Nueva novedad
        </Link>
      </Encabezado>
      <AvisoDeLlegada texto={aviso} className="mb-6" />
      <p className="max-w-3xl">
        Las noticias y las actividades del museo (talleres, charlas, visitas especiales).{' '}
        {PAGINAS_PUBLICAS_DE_CONTENIDO
          ? 'Las publicadas están en el sitio; los borradores, solo acá.'
          : 'Las publicadas van a estar en el sitio cuando se sume su página; los borradores, solo acá.'}
      </p>

      <form
        role="search"
        aria-label="Buscar novedades"
        onSubmit={filtrar}
        className="mt-6 grid items-end gap-4 rounded-md border-2 border-suave p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]"
      >
        <Campo id="filtro-estado" etiqueta="Estado">
          {(accesible) => (
            <select {...accesible} value={campos.estado} onChange={poner('estado')}>
              <option value="">Todos</option>
              <option value="borrador">Borradores</option>
              <option value="publicado">Publicadas</option>
            </select>
          )}
        </Campo>
        <Campo id="filtro-tipo" etiqueta="Tipo">
          {(accesible) => (
            <select {...accesible} value={campos.tipo} onChange={poner('tipo')}>
              <option value="">Todas</option>
              <option value="noticia">Noticias</option>
              <option value="actividad">Actividades</option>
            </select>
          )}
        </Campo>
        <Campo
          id="filtro-q"
          etiqueta="Buscar"
          type="search"
          autoComplete="off"
          maxLength={BUSQUEDA_MAX}
          value={campos.q}
          onChange={poner('q')}
          placeholder="Una palabra del título o del resumen"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Boton type="submit" variante="secundario">
            Buscar
          </Boton>
          {hayFiltros ? (
            <Link to="/novedades" className="inline-flex min-h-11 items-center">
              Ver todas
            </Link>
          ) : null}
        </div>
      </form>

      <p ref={cuentaRef} tabIndex={-1} className="mt-6 font-semibold">
        {cuenta}
      </p>
      <p role="status" className="sr-only">
        {anuncio}
      </p>

      {sinPagina && total > 0 ? (
        <p className="mt-4">
          Esta página no existe. <Link to={aPagina(1)}>Ir a la primera página</Link>.
        </p>
      ) : null}

      {items.length ? (
        <>
          <table className="mt-4 hidden w-full border-collapse text-left md:table">
            <caption className="sr-only">Novedades{hayFiltros ? ' con los filtros elegidos' : ''}</caption>
            <thead>
              <tr className="border-b-2 border-linea">
                <th scope="col" className="py-2 pr-4">
                  Título
                </th>
                <th scope="col" className="py-2 pr-4">
                  Tipo
                </th>
                <th scope="col" className="py-2 pr-4">
                  Estado
                </th>
                <th scope="col" className="py-2 pr-4">
                  Fecha
                </th>
                <th scope="col" className="py-2">
                  Última edición
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} className="border-b border-suave align-top">
                  <td className="py-2 pr-4">
                    <Link to={C.ficha(n.id)} className="inline-flex min-h-11 items-center font-semibold wrap-anywhere">
                      {n.titulo}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{TIPOS[n.tipo]}</td>
                  <td className="py-3 pr-4">
                    <EstadoContenido tipo="novedades" item={n} />
                  </td>
                  <td className="py-3 pr-4">{fechaDe(n) ?? <span className="text-tenue">Sin publicar</span>}</td>
                  <td className="py-3 text-sm text-tenue">{ultimaEdicion(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-4 grid gap-3 md:hidden">
            {items.map((n) => (
              <li key={n.id} className="grid gap-1.5 rounded-md border-2 border-suave p-3">
                <Link to={C.ficha(n.id)} className="inline-flex min-h-11 items-center text-lg font-semibold wrap-anywhere">
                  {n.titulo}
                </Link>
                <p className="flex flex-wrap items-center gap-2">
                  <span>{TIPOS[n.tipo]}</span>
                  <EstadoContenido tipo="novedades" item={n} />
                </p>
                {fechaDe(n) ? <p>{fechaDe(n)}</p> : null}
                <p className="text-sm text-tenue">Última edición: {ultimaEdicion(n)}.</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {paginas > 1 ? (
        <nav aria-label="Páginas de novedades" className="mt-6 flex flex-wrap items-center gap-4">
          {pagina > 1 && !sinPagina ? (
            <Link
              to={aPagina(pagina - 1)}
              className={clasesBoton('secundario')}
              onClick={() => {
                enfocarCuenta.current = true
              }}
            >
              Anterior
            </Link>
          ) : null}
          <span>
            Página {Math.min(pagina, paginas)} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link
              to={aPagina(pagina + 1)}
              className={clasesBoton('secundario')}
              onClick={() => {
                enfocarCuenta.current = true
              }}
            >
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  )
}
