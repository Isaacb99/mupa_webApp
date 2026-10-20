import { resumirHorario } from '../../compartido/horarios.js'
import { navegacion, pie, site, ui } from '../content.js'
import { correoPublico, enlaceTelefono, redesConocidas, renglonesDireccion } from './datosMuseo.js'
import { marcaActual } from './Menu.jsx'

// Aspecto provisorio hasta el diseño del pie (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// Pie de todas las páginas (plan 6.7). Arriba, como hasta E4.1: el nombre del museo a la izquierda y los logos de la
// UNSJ y de Gobierno a la derecha. Debajo, las secciones del sitio (las del menú, con aria-current como en el header):
// andan sin JavaScript y antes de que cargue, cuando el botón "Menú" del celular todavía no abre nada (A11Y-03 de la
// verificación de E4). Después, los datos que el museo carga en el panel (estado.museo, server/museo.js):
// dirección, horario resumido (compartido/horarios.js), teléfono (tel:), correo público (mailto:) y redes, con su
// nombre como texto del enlace (datosMuseo.js). Al final, el © y la línea de privacidad (content.js, solo si existe).
// Lo que no está cargado no se dibuja, ni su rótulo (plan 6.1: nunca "Contenido pendiente"): con el museo vacío queda
// el pie de la landing. Probado con el museo máximo y con el vacío (SIN_BASE=maximo / vacio).
// Es el único <footer> de la página: lo buscan la analítica (ver_pie, solo en la Home) y el acordeón de Áreas en el
// iPhone (deslizarAparicion.js), y su alto es el final de la página del acordeón (plan 6.7: cada cambio del pie,
// acordeon-dedo y areas-check otra vez). Sin fondo propio: deslizarAparicion le pone el del sitio mientras baja.
// Los enlaces miden 44 px de alto (el mínimo para el dedo, como en el panel: A11Y-01) y lo largo (una dirección, una
// nota) se parte en vez de ensanchar la página (PAG-01). Los logos blancos llevan data-logo-blanco: con colores
// forzados en un tema claro, index.css los invierte (A11Y-04).

const ENLACE_BASE =
  'inline-flex min-h-11 max-w-full items-center rounded-sm underline underline-offset-4 transition-colors ' +
  'hover:decoration-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper'
const ENLACE = `${ENLACE_BASE} decoration-paper/40`
// La sección de la página, subrayada en naranja como en el menú.
const ENLACE_ACTUAL = `${ENLACE_BASE} decoration-naranja decoration-2`

// "9:00 a 13:00" no se parte en dos renglones (sí entre una franja y otra).
const sinCortes = (horas) => horas.replace(/(\d+:\d\d) a (\d+:\d\d)/g, '$1\u00a0a\u00a0$2')

function Bloque({ titulo, children }) {
  return (
    <div className="min-w-0">
      <h2 className="font-mono text-xs font-medium tracking-[0.14em] text-muted uppercase">{titulo}</h2>
      <div className="mt-3 text-[0.9375rem] leading-relaxed font-light text-paper wrap-anywhere">{children}</div>
    </div>
  )
}

/**
 * @param {{ museo: object | null | undefined, ruta?: string | null }} props  museo: estado.museo, con la forma de
 *   MUSEO_VACIO; ruta: la de la página, para aria-current (null en la 404, como en el header)
 */
export default function Pie({ museo, ruta = null }) {
  const direccion = renglonesDireccion(museo)
  const horario = resumirHorario(museo?.horarios)
  const telefono = enlaceTelefono(museo?.telefono)
  const correo = correoPublico(museo?.emailPublico)
  const redes = redesConocidas(museo?.redes)
  const instituciones = (pie.instituciones ?? []).filter((i) => i.logo)
  const hayDatos = direccion.length > 0 || horario.lineas.length > 0 || telefono || correo || redes.length > 0

  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-sitio px-6 py-10 md:px-10">
        {/* lg:items-center: los logos miden 32 px y el bloque de la izquierda 76, así que alineados arriba se veían
            más altos (lo notó el desarrollador el 25/09/2026); centrados quedan a la altura del bloque. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-2xl tracking-tight text-paper">{site.nombre}</p>
            <p className="mt-1 text-sm text-muted">
              <span className="block">{site.nombreCompleto}</span>
              <span className="block">{site.lugar}</span>
            </p>
          </div>

          {instituciones.length > 0 ? (
            <ul aria-label={ui.instituciones} className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {instituciones.map(({ nombre, logo, ancho, alto }) => (
                <li key={nombre}>
                  <img
                    src={logo}
                    alt={nombre}
                    width={ancho}
                    height={alto}
                    loading="lazy"
                    data-logo-blanco=""
                    className="h-8 w-auto"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label={pie.secciones} className="mt-8">
          <ul className="flex flex-wrap gap-x-6 text-[0.9375rem] font-light">
            {navegacion.secciones.map((s) => {
              const actual = marcaActual(ruta, s.ruta)
              return (
                <li key={s.ruta}>
                  <a href={s.ruta} aria-current={actual} className={actual ? ENLACE_ACTUAL : ENLACE}>
                    {s.texto}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {hayDatos ? (
          <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {direccion.length > 0 ? (
              <Bloque titulo={pie.direccion}>
                <address className="not-italic">
                  {direccion.map((renglon, i) => (
                    <span key={i} className="block">
                      {renglon}
                    </span>
                  ))}
                </address>
              </Bloque>
            ) : null}

            {horario.lineas.length > 0 ? (
              <Bloque titulo={pie.horario}>
                <ul>
                  {horario.lineas.map((l, i) => (
                    <li key={i}>
                      {l.dias}: {l.horas ? sinCortes(l.horas) : pie.cerrado}
                    </li>
                  ))}
                </ul>
                {horario.notas.length > 0 ? (
                  <ul className="mt-2 text-sm text-muted">
                    {horario.notas.map((n, i) => (
                      <li key={i}>
                        {n.dias}: {n.texto}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Bloque>
            ) : null}

            {telefono || correo ? (
              <Bloque titulo={pie.contacto}>
                <ul>
                  {telefono ? (
                    <li>
                      {telefono.href ? (
                        <a href={telefono.href} className={ENLACE}>
                          {telefono.texto}
                        </a>
                      ) : (
                        telefono.texto
                      )}
                    </li>
                  ) : null}
                  {correo ? (
                    <li>
                      <a href={`mailto:${correo}`} className={ENLACE}>
                        {correo}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </Bloque>
            ) : null}

            {redes.length > 0 ? (
              <Bloque titulo={pie.redes}>
                <ul className="flex flex-wrap gap-x-5">
                  {redes.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} className={ENLACE}>
                        {r.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              </Bloque>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-2 text-xs text-muted md:flex-row md:justify-between md:gap-8">
          <p>{pie.legal}</p>
          {pie.privacidad ? <p>{pie.privacidad}</p> : null}
        </div>
      </div>
    </footer>
  )
}
