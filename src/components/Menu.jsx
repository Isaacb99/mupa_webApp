import { navegacion } from '../content.js'
import { marcaActual, seccionesDelMenu } from './navegacion.js'
import { BOTON_NARANJA } from './tablero.js'

// El menú del sitio en pantallas anchas (plan 6.7; el del tablero "Web" de la diseñadora, Figma, 02/11/2026): El Museo,
// Visitas, Divulgación, Educación y Circuitos, en ese orden, cada una solo si su página existe (navegacion.js: desde el
// 06/11/2026 existen las cinco), y el botón naranja de entradas si la compra externa
// está activa (estado.museo.compra), con el texto fijo de content.js ("Tickets"). Sin el selector de idioma del tablero
// (fuera del alcance).
// - Roboto Mono Regular 16/28,8 en blanco, 24 px entre ítems; el botón, Roboto Mono 14/28 sobre el naranja (texto
//   #010101 y no blanco: tablero.js, BOTON_NARANJA). Cada enlace mide 44 px de alto (el tablero los dibuja de 65 con 18
//   de padding: el texto queda en el mismo lugar porque el header centra la fila en sus 128).
// - El tablero no dibuja ni la sección actual, ni el paso del puntero, ni el foco: aria-current lleva un subrayado
//   naranja de 2 px (marca sutil que no cambia nada de lugar), el puntero un subrayado de 1 px y el foco un contorno
//   blanco.
// - El subrayado naranja lleva un borde de 1 px en #010101 arriba y abajo (A11Y-01 de la verificación de Visitas,
//   03/11/2026): sobre una foto (el header va encima del hero en Visitas y en las páginas internas que vengan) el naranja
//   quedaba con poco contraste donde la foto es clara (la mano: bajo 3:1 desde ~2200 px en la verificación y, con el
//   encuadre de FID-01, en 6 de sus 134 píxeles a 1920). Con el borde, lo que está pegado al naranja es siempre #010101
//   (6,3:1); sobre el fondo oscuro no se ve. Son dos subrayados anidados: el del enlace, de 4 px en #010101 y 1 px más
//   arriba, y el del texto (un <span>), el naranja de 2 px en su lugar de siempre, que se pinta encima (desvío a
//   confirmar con la diseñadora, como el halo del h1). El menú del celular no lo necesita: va sobre su fondo (#010101).
// - Va desde xl (Header.jsx): con las cinco secciones y el botón el menú mide ~643 px y, con el logo de 272 y los
//   márgenes de 64, necesita ~1060 de pantalla (a 1024 no entra; a 1280 sobran ~220). Debajo de xl, MenuMovil.jsx.

const ENLACE_BASE =
  'flex min-h-11 items-center rounded-sm font-mono text-base leading-[1.8] text-blanco focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-blanco'
const ENLACE = ENLACE_BASE + ' decoration-1 underline-offset-[0.4em] hover:underline'
// La sección actual: el borde oscuro (el subrayado del enlace) y el naranja (el del texto, ACTUAL_TEXTO).
const ACTUAL = ENLACE_BASE + ' underline decoration-ink decoration-4 underline-offset-[calc(0.4em-1px)]'
const ACTUAL_TEXTO = 'underline decoration-naranja decoration-2 underline-offset-[0.4em]'

/**
 * @param {{ ruta: string | null, compra: { url: string } | null, className?: string }} props
 *   ruta: la de la página (estado.ruta; null en la 404); compra: estado.museo.compra (solo viene si está activa)
 */
export default function Menu({ ruta, compra, className = '' }) {
  const secciones = seccionesDelMenu()
  if (secciones.length === 0 && !compra) return null
  return (
    <nav aria-label={navegacion.etiqueta} className={className}>
      <ul className="flex items-center gap-x-6">
        {secciones.map((s) => {
          const actual = marcaActual(ruta, s.ruta)
          return (
            <li key={s.ruta} className="shrink-0">
              <a href={s.ruta} aria-current={actual} className={actual ? ACTUAL : ENLACE}>
                {actual ? <span className={ACTUAL_TEXTO}>{s.texto}</span> : s.texto}
              </a>
            </li>
          )
        })}
        {compra ? (
          <li className="shrink-0">
            {/* data-entradas: el clic lo mide la analítica (clic_entradas, plan 6.6). */}
            <a href={compra.url} data-entradas="" className={BOTON_NARANJA}>
              {navegacion.entradas}
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
