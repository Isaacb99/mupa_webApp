import { navegacion } from '../content.js'

// Aspecto provisorio hasta el diseño del header y el menú (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// El menú del sitio en pantallas anchas (plan 6.7): Exposiciones, Visitas, Novedades, Contacto y "Comprar entradas" si
// la compra externa está activa. Va a la derecha del logo, en el header (Header.jsx); debajo de xl va el botón "Menú"
// (MenuMovil.jsx), porque los cinco no entran al lado del logo de 458 px: medido el 19/10/2026 en Chrome con la fuente
// del sitio, los cuatro enlaces y "Comprar entradas" ocupan 595,5 px, y entre el logo y el margen derecho quedan 401 a
// 1024 de ancho (lg) y 657 a 1280 (xl: 62 px libres entre el logo y el menú). Un texto de compra largo (el panel admite
// 40 caracteres) corta en dos renglones dentro de su recuadro (max-w de 13rem): el menú mide como mucho 629 px y entra
// igual a 1280. Con la letra del navegador agrandada, el que se achica es el logo (Logo.jsx, min-w-0).

// Cuándo un enlace del menú es el de la página: aria-current="page" en la página misma y "true" dentro de su sección
// (la ficha de una muestra está dentro de Exposiciones). Con la ruta del estado: igual en el servidor y en el navegador.
export function marcaActual(ruta, destino) {
  if (ruta === destino) return 'page'
  if (typeof ruta === 'string' && ruta.startsWith(`${destino}/`)) return 'true'
  return undefined
}

// El texto del enlace de compra: el que cargó el museo o el de content.js.
export const textoCompra = (compra) => compra?.texto || navegacion.comprar

// Sombra detrás del texto: en la Home el menú va sobre la foto del hero, arriba del degradé (Hero.jsx), y con ella se
// lee también donde el cielo es claro. En las otras páginas va sobre el fondo y no se ve.
const SOBRE_FOTO = '[text-shadow:0_0_0.75rem_rgb(14_16_13/0.85),0_1px_2px_rgb(14_16_13/0.7)]'

const ENLACE =
  'block rounded-sm py-2 text-[1.0625rem] leading-6 text-paper underline-offset-[0.4em] decoration-1 transition-colors ' +
  'hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper'
const ACTUAL = 'underline decoration-naranja decoration-2'

/**
 * @param {{ ruta: string | null, compra: { url: string, texto: string | null } | null, className?: string }} props
 *   ruta: la de la página (estado.ruta; null en la 404); compra: estado.museo.compra (solo viene si está activa)
 */
export default function Menu({ ruta, compra, className = '' }) {
  return (
    <nav aria-label={navegacion.etiqueta} className={`${SOBRE_FOTO} ${className}`}>
      <ul className="flex items-center gap-x-7">
        {navegacion.secciones.map((s) => {
          const actual = marcaActual(ruta, s.ruta)
          return (
            <li key={s.ruta} className="shrink-0">
              <a href={s.ruta} aria-current={actual} className={actual ? `${ENLACE} ${ACTUAL}` : ENLACE}>
                {s.texto}
              </a>
            </li>
          )
        })}
        {compra ? (
          <li>
            {/* data-entradas: el clic lo mide la analítica (clic_entradas, plan 6.6). */}
            <a
              href={compra.url}
              data-entradas=""
              className="block max-w-[13rem] rounded-md border-[1.5px] border-naranja px-4 py-2 text-center text-[1.0625rem] leading-6 text-balance text-paper transition-colors hover:bg-naranja hover:text-ink hover:[text-shadow:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
            >
              {textoCompra(compra)}
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
