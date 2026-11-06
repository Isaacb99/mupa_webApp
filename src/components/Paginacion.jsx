import { paginas } from '../content.js'
import { FlechaDerecha, FlechaIzquierda } from './Iconos.jsx'
import { ENLACE_FLECHA } from './tablero.js'

// Las páginas de un listado (Novedades: ?pagina=, plan 6.1): "Anterior", "Página 2 de 5" y "Siguiente". La primera
// página es la dirección sin ?pagina= (con ?pagina=1 el servidor manda ahí con un 301). Enlaces comunes: andan sin
// JavaScript.
// Con el lenguaje del tablero "Web" (decisión R4 del desarrollador, 04/11/2026), cerca del "← 1/6 →" del carrusel de
// Novedades de la Home (el tablero no tiene un listado con páginas: desvío a confirmar con la diseñadora):
// - "Página 2 de 5", como el contador del carrusel: Roboto Mono Medium 24/28,8 en blanco (no es un enlace);
// - "Anterior" y "Siguiente", enlaces con flecha (ENLACE_FLECHA: Roboto Mono 16 en blanco, la flecha de 20 a 8 del
//   texto, 44 de alto);
// - y cada cosa siempre en el mismo lugar, como las flechas del carrusel: desde sm, en tres columnas a lo ancho del
//   contenido, "Anterior" contra el borde izquierdo, el contador en el medio y "Siguiente" contra el derecho (cada uno en
//   su columna, esté o no el otro). El carrusel atenúa la flecha que no aplica; acá no se dibuja: un "Anterior" que no
//   lleva a ningún lado sería un texto más en la página. Debajo de sm (sin diseño, D2), uno al lado del otro, en
//   varios renglones si no entran.
// 64 debajo de la grilla de tarjetas. Hasta la corrección del rediseño (EST-04 de su verificación, 05/11/2026) el
// contador iba en Roboto Mono 16 en gris, todo junto a la izquierda, y el contador y "Siguiente" se corrían de la primera
// página a las demás.
const t = paginas.novedades

/** @param {{ base: string, pagina: number, paginas: number }} props  base: la dirección del listado ("/novedades") */
export default function Paginacion({ base, pagina, paginas: total }) {
  const enlace = (n) => (n === 1 ? base : `${base}?pagina=${n}`)
  return (
    <nav
      aria-label={t.paginas}
      className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-1 sm:grid sm:grid-cols-[1fr_auto_1fr]"
    >
      {pagina > 1 ? (
        <a href={enlace(pagina - 1)} rel="prev" className={`${ENLACE_FLECHA} sm:col-start-1 sm:justify-self-start`}>
          <FlechaIzquierda />
          {t.anterior}
        </a>
      ) : null}
      <p className="font-mono text-2xl leading-[1.2] font-medium text-blanco sm:col-start-2">{t.pagina(pagina, total)}</p>
      {pagina < total ? (
        <a href={enlace(pagina + 1)} rel="next" className={`${ENLACE_FLECHA} sm:col-start-3 sm:justify-self-end`}>
          {t.siguiente}
          <FlechaDerecha />
        </a>
      ) : null}
    </nav>
  )
}
