// Las secciones del sitio que se dibujan en el menú, el menú del celular, el pie y la 404, y cuál es la de la página.
// Código puro (nada de React ni del DOM): lo mismo en el servidor y en el navegador.
// Una sección se dibuja solo si su página existe (src/tablaDePaginas.js): navegacion.menu de src/content.js tiene las
// cinco del tablero "Web" (02/11/2026) y existen todas: Visitas y, desde el 06/11/2026, El Museo, Divulgación, Educación
// y Circuitos.
import { navegacion } from '../content.js'
import { existePagina } from '../tablaDePaginas.js'

/** Las secciones del menú del header (y del menú del celular) que existen, en el orden del tablero. */
export const seccionesDelMenu = () => navegacion.menu.filter((s) => existePagina(s.pagina))

/** Todas las secciones que existen: las del menú y después las que van solo en el pie y en la 404. */
export const seccionesDelSitio = () => [...navegacion.menu, ...navegacion.otras].filter((s) => existePagina(s.pagina))

/**
 * La sección de una página ({ pagina, ruta, texto }), solo si la página existe; si no, null. La usan los accesos de la
 * Home (HeroHome.jsx): "Recursos educativos" aparece solo el día que exista Educación, con su dirección del menú.
 */
export const seccionDe = (pagina) => seccionesDelSitio().find((s) => s.pagina === pagina) ?? null

/**
 * Cuándo un enlace es el de la página: aria-current="page" en la página misma y "true" dentro de su sección (la ficha
 * de una muestra está dentro de Exposiciones). Con la ruta del estado: igual en el servidor y en el navegador.
 */
export function marcaActual(ruta, destino) {
  if (ruta === destino) return 'page'
  if (typeof ruta === 'string' && ruta.startsWith(`${destino}/`)) return 'true'
  return undefined
}

/**
 * El texto de "Comprar entradas" (BotonCompra.jsx): el que cargó el museo o el de content.js. Sin uso desde la Visitas
 * del tablero (03/11/2026, V1: ninguna página dibuja ese botón), como BotonCompra.jsx: se decide al cierre (D1).
 */
export const textoCompra = (compra) => compra?.texto || navegacion.comprar
