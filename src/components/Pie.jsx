import { pie, site, ui } from '../content.js'
import { redesConocidas } from './datosMuseo.js'
import { marcaActual, seccionesDelSitio } from './navegacion.js'

// Pie de todas las páginas (plan 6.7; el del tablero "Web" de la diseñadora, Figma, 02/11/2026, decisión D5).
// - Arriba, la fila del tablero: a la izquierda la marca MuPa de 120x40 y, 16 px debajo, "© <año> MUPA - Museo
//   Paleontológico de San Juan" (Google Sans Flex 12/16 en gris); a la derecha, los logos de la UNSJ y de Gobierno con su
//   texto, de 42 px de alto y 24 entre sí. Borde de 1 px #2c2c2c arriba, 40 de padding arriba y abajo y 80 a los
//   costados (contenido de 1280 a 1440, como las secciones). El año lo pone el servidor en el estado (estado.anio, la
//   fecha de San Juan): nunca se calcula en el navegador (la hidratación compararía dos años distintos el 31/12).
// - Debajo, una fila discreta que el tablero no tiene (desvío a confirmar con la diseñadora): la navegación "Secciones
//   del sitio (pie de página)" con todas las páginas que existen (navegacion.js: desde el 06/11/2026 las ocho, las cinco
//   del menú más Exposiciones, Novedades y Contacto; una nueva se suma sola) y las redes que cargó el museo
//   (estado.museo.redes; si no hay, nada), en Roboto Mono 14 gris. Desde lg van en una fila si entran (desde ~1240 px
//   con tres redes); si no, las redes pasan enteras al renglón de abajo, contra el borde derecho (lg:flex-wrap y
//   lg:ml-auto: hasta el cierre de E6.3 las dos listas se achicaban a la vez, iban en dos renglones cada una y las redes
//   terminaban antes del borde, BDIS-01 del barrido de diseño, 09/11/2026). Andan sin JavaScript y antes de que cargue, cuando el botón "Menú" del celular todavía no abre nada
//   (A11Y-03 de la verificación de E4). Sin dirección, horario, teléfono ni correo: los muestran Visitas y Contacto.
// - La línea de privacidad (content.js), solo cuando el museo mande el texto.
// - La marca va sin alt (alt=""): repite el nombre que dice el © de al lado. Los logos sí lo llevan (son información).
//   Las tres, lazy y con prioridad baja (la convención del sitio: en una página corta asoman en el primer pantallazo,
//   y sin fetchPriority Chrome les subía la prioridad; BCOD-02 del barrido de código del cierre).
// Es el único <footer> de la página: lo busca la analítica (ver_pie, en la Home). Sin fondo propio: va sobre el del
// sitio. En la rama landing lo buscaba también el acordeón de Áreas en el iPhone (deslizarAparicion.js, que le ponía
// el fondo mientras bajaba) y su alto era el final de la página del acordeón; master ya no los usa.
// Los enlaces miden 44 px de alto y de ancho, el mínimo para el dedo (A11Y-01 y A11Y-07); lo largo se parte en vez de
// ensanchar la página (PAG-01). La navegación de las secciones se llama distinto que la del header y la de la 404
// (A11Y-07). Las imágenes blancas llevan data-logo-blanco: con colores forzados en un tema claro, index.css las
// invierte (A11Y-04).

const ENLACE_BASE =
  'inline-flex min-h-11 min-w-11 max-w-full items-center rounded-sm font-mono text-sm leading-5 wrap-anywhere ' +
  'decoration-1 underline-offset-4 transition-colors hover:text-paper hover:underline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-paper'
const ENLACE = `${ENLACE_BASE} text-muted`
// La sección de la página: en crema y subrayada en naranja, como en el menú.
const ENLACE_ACTUAL = `${ENLACE_BASE} text-paper underline decoration-naranja decoration-2`

/**
 * @param {{ museo: object | null | undefined, ruta?: string | null, anio?: number | null }} props  museo: estado.museo
 *   (museoComun, server/museo.js: el pie usa solo las redes); ruta: la de la página, para aria-current (null en la 404,
 *   como en el header); anio: estado.anio (el año en San Juan, del servidor)
 */
export default function Pie({ museo, ruta = null, anio = null }) {
  const redes = redesConocidas(museo?.redes)
  const instituciones = (pie.instituciones ?? []).filter((i) => i.logo)
  const secciones = seccionesDelSitio()
  const legal = Number.isInteger(anio) ? `© ${anio} ${pie.legal}` : `© ${pie.legal}`

  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-tablero px-6 py-10 md:px-10 lg:px-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-4">
            <img
              src={site.logo.marca}
              alt=""
              width={120}
              height={40}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              data-logo-blanco=""
              className="block h-10 w-30"
            />
            <p className="text-xs leading-4 text-muted">{legal}</p>
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
                    decoding="async"
                    fetchPriority="low"
                    data-logo-blanco=""
                    className="h-[2.625rem] w-auto"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {secciones.length > 0 || redes.length > 0 ? (
          <div className="mt-8 flex flex-col gap-x-12 gap-y-2 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
            {secciones.length > 0 ? (
              <nav aria-label={pie.secciones} className="min-w-0">
                <ul className="flex flex-wrap gap-x-6">
                  {secciones.map((s) => {
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
            ) : null}

            {redes.length > 0 ? (
              <ul aria-label={pie.redes} className="flex min-w-0 flex-wrap gap-x-6 lg:ml-auto">
                {redes.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} className={ENLACE}>
                      {r.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {pie.privacidad ? <p className="mt-6 text-xs leading-4 text-muted">{pie.privacidad}</p> : null}
      </div>
    </footer>
  )
}
