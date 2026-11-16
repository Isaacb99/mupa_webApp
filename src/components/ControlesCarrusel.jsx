import { FlechaDerecha, FlechaIzquierda } from './Iconos.jsx'

// Los controles de un carrusel (src/hooks/useCarrusel.js): ← "n/total" → y la región viva. Salieron tal cual de
// CarruselNovedades.jsx (10/11/2026); los usan Novedades (la Home y Divulgación, a la derecha) y los documentales de
// El Museo en el celular (a la izquierda, como los dibuja el cuadro de celular). Cada uno pasa las clases de su fila
// (estáticas: el lugar, la alineación y cuándo no van).
// - Anterior y Siguiente son botones con su nombre (las flechas son solo dibujo), de 44x44 sin mover las flechas de su
//   lugar, con aria-controls a la fila; en el principio o en el final quedan con aria-disabled y más tenues. Debajo de
//   lg, solo la flecha: el contorno del foco, si está ahí, se ve entero (VA11-04 de la verificación, 11/11/2026). Desde
//   lg, el botón entero, como siempre (desde lg no cambia nada: O1).
// - El contador "n/total" (n: la primera tarjeta que se ve entera desde la izquierda) es dibujo (aria-hidden); para el
//   lector va el aviso del hook en una región que avisa los cambios (aria-live polite). Debajo de lg va en un <span>:
//   el espaciado de texto de WCAG 1.4.12 les suma margen abajo a los párrafos y en un <p> el número quedaba 24 px más
//   arriba que las flechas (VA11-03). Desde lg, el <p> de siempre (O1). Los dos van en el HTML con el mismo número y el
//   CSS muestra uno: así nada decide por el ancho al renderizar.
// - Hasta que la página hidrata, y si todas las tarjetas entran sin scroll, la fila de los controles queda invisible
//   (ocupa su lugar: nada se corre al aparecer). Con una sola tarjeta no van.
// - Foco: contorno blanco, por dentro del botón.

const BOTON =
  '-m-3 grid size-11 shrink-0 place-items-center rounded-full text-blanco max-lg:[&>svg]:transition-opacity ' +
  'lg:transition-opacity focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-blanco ' +
  'max-lg:aria-disabled:[&>svg]:opacity-35 lg:aria-disabled:opacity-35'
const CONTADOR = 'min-w-11 text-center font-mono text-2xl leading-[1.2] font-medium text-blanco'

/**
 * @param {{ carrusel: ReturnType<typeof import('../hooks/useCarrusel.js').default>, total: number,
 *   textos: { anterior: string, siguiente: string }, className: string }} props
 *   carrusel: lo que da useCarrusel; textos: los nombres de los botones; className: las clases de la fila de controles
 */
export default function ControlesCarrusel({ carrusel, total, textos, className }) {
  if (total < 2) return null
  const { estado, idFila, aviso, anterior, siguiente } = carrusel
  const visibles = estado.listo && estado.desborda
  return (
    <div className={[className, visibles ? '' : 'invisible'].filter(Boolean).join(' ')}>
      <button type="button" aria-controls={idFila} aria-disabled={estado.alInicio} onClick={anterior} className={BOTON}>
        <FlechaIzquierda />
        <span className="sr-only">{textos.anterior}</span>
      </button>
      <span aria-hidden="true" className={`${CONTADOR} lg:hidden`}>
        {estado.actual}/{total}
      </span>
      <p aria-hidden="true" className={`hidden ${CONTADOR} lg:block`}>
        {estado.actual}/{total}
      </p>
      <button type="button" aria-controls={idFila} aria-disabled={estado.alFinal} onClick={siguiente} className={BOTON}>
        <FlechaDerecha />
        <span className="sr-only">{textos.siguiente}</span>
      </button>
      <p aria-live="polite" className="sr-only">
        {aviso}
      </p>
    </div>
  )
}
