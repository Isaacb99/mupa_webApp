import { useRef } from 'react'
import { FlechaDerecha, FlechaIzquierda } from './Iconos.jsx'

// Las flechas a los costados de un carrusel (src/hooks/useCarrusel.js) y su región viva: los controles del carrusel de
// Novedades (CarruselNovedades.jsx: la Home y Divulgación) desde el 16/11/2026, en todos los anchos (pedido del
// desarrollador: «una flecha al costado del carrusel de novedades para el diseño mobile y de escritorio»; eligió
// «Siguiente» a la derecha y «Anterior» a la izquierda, sobre la foto de la tarjeta, cada una visible solo si hay más
// para ese lado, «sin las flechas en el contador de abajo»). El 17/11/2026, después de probarlo en su teléfono, pidió
// sacar también ese contador, porque dejaba demasiado espacio hasta la sección siguiente (decisión Q): desde entonces,
// abajo de la fila no queda nada. Es un desvío del tablero y del cuadro de celular, que dibujan ← "1/6" → debajo de la
// fila: así siguen los documentales de El Museo, con ControlesCarrusel.jsx, que no cambió.
//
// FlechasCarrusel: una capa sobre la fila (va después de la <ul>, dentro de un envoltorio `relative` que mide lo que
// la fila; no toma el puntero: los clics de fuera de los botones llegan a las tarjetas), con una sola celda:
// - La guía: una caja vacía con el ancho de la tarjeta y la proporción de su foto (las clases las da quien la usa, las
//   mismas de su tarjeta). Le da a la capa el alto de la foto, y los botones se centran en él: el centro sale del CSS,
//   sin medir con JavaScript, y es el de la FOTO, no el de la tarjeta (los títulos miden distinto). Como todas las
//   fotos de la fila miden lo mismo, un botón nunca tapa el título, el resumen ni "leer más" de ninguna tarjeta (por
//   eso las flechas a los costados van solo si todas las tarjetas tienen foto: CarruselNovedades.jsx).
// - «Anterior» contra el borde izquierdo de la zona visible de la fila y «Siguiente» contra el derecho (la fila se
//   corta en el borde del contenido), a 8 px del borde debajo de lg y a 16 desde lg. Botones de 44x44 con su nombre
//   (la flecha es dibujo) y aria-controls a la fila, en el mismo orden de siempre en el HTML y en el Tab: la lista,
//   «Anterior» y «Siguiente» (después, la región viva, que no toma el foco).
// - Cuándo se ven: «Anterior» solo si hay tarjetas hacia la izquierda y «Siguiente» solo si hay hacia la derecha (al
//   principio, solo «Siguiente»; al final, solo «Anterior»). Antes de hidratar, si todas las tarjetas entran sin
//   scroll, sin JavaScript y al imprimir, ninguna. Aparecen y desaparecen con un fundido de 200 ms (sin fundido con
//   reduced-motion: la regla de base de index.css); como van posicionadas sobre la fila, no mueven nada. La que no
//   se ve va con visibility: hidden (no solo transparente): no toma el foco ni figura para el lector de pantalla.
// - El clic de más: la que se oculta ya no se ve a los 200 ms, pero pasa a visibility: hidden recién 0,8 s después
//   (el retardo de la transición de visibility, también con reduced-motion). Mientras tanto sigue recibiendo los clics
//   y los toques, que no hacen nada: sin eso, quien aprieta «Siguiente» varias veces seguidas hasta el final abría,
//   con el clic de más, la novedad que queda debajo de la flecha (medido el 16/11/2026: con un clic cada 0,5 s, el
//   primero después de llegar al final ya caía en el enlace de la tarjeta).
// - El foco del teclado no se pierde: si el botón que tiene el foco visible (:focus-visible) es el que tendría que
//   ocultarse (se llegó a una punta con Enter), se queda a la vista, con la flecha tenue y aria-disabled, y se oculta
//   cuando pierde el foco. Lo hace el CSS (focus-visible:visible le gana a invisible). Con el mouse o el dedo el botón
//   no queda con el foco visible y se oculta al llegar. Tenue es la flecha al 45 % (solo la flecha: el contorno del
//   foco se ve entero), que sigue dando 3:1 contra el círculo: medido en píxeles (17/11/2026), 3,49:1 sobre una
//   portada blanca (la flecha en rgb(151,151,151) y el círculo en rgb(65,65,65): el peor caso) y de 3,7 a 3,9:1 en el
//   peor píxel sobre las portadas de prueba. Hasta la corrección de ese día iba al 35 %, como los controles de abajo,
//   y daba 2,73:1 sobre la blanca (VFU-02 de la verificación); al 40 %, 3,12:1, con poco margen.
// - El aspecto: un círculo del fondo del sitio (#010101) al 75 % (al 90 % con el puntero encima), con la flecha
//   blanca: medido en píxeles (16/11/2026), sobre una portada blanca el círculo queda en rgb(65,65,65) y la flecha da
//   10,2:1 contra él; sobre una negra, 20,9:1. El foco: un contorno blanco de 2 px por fuera del círculo y, por fuera
//   de él, un aro de 2 px del fondo del sitio (una sombra de 4 px: el contorno se pinta encima de sus 2 px de
//   adentro), así el contorno blanco tiene oscuro a los dos lados sobre una foto clara (10,2:1 contra el círculo y
//   20,9:1 contra el aro, y el aro, 20,9:1 contra la foto) y se ve solo sobre una oscura (21:1), como la marca de la
//   sección actual del menú (A11Y-01 de Visitas). Con colores forzados, el fondo de botón del sistema y el borde
//   (transparente fuera de ese modo), como los botones de ícono del menú (MenuMovil.jsx). El cursor es la mano, como
//   sobre la foto de alrededor (el enlace estirado de la tarjeta), y el común si el botón está deshabilitado: Tailwind
//   4 deja los botones con el cursor común y sobre el círculo parecía que no había nada para apretar (VFU-05).
// - La capa va por encima del enlace estirado de la tarjeta (z-10): un clic o un toque en una flecha mueve la fila y
//   no abre la novedad.
// - El dedo que desliza justo sobre una flecha: el botón no está dentro de la fila, así que el navegador no la
//   desliza (medido con toques por CDP: la fila no se movía, y es donde suele apoyarse el pulgar). Por eso el botón
//   deja al navegador solo el desplazamiento vertical de la página (touch-action: pan-y, y el zoom con dos dedos) y
//   toma él los gestos horizontales: un deslizamiento con el dedo de 24 px o más hacia la izquierda es «Siguiente» y
//   hacia la derecha, «Anterior» (una tarjeta, como un deslizamiento corto sobre la fila; la cuenta, en gestoDelDedo).
//   Solo cuenta el dedo: con el mouse y con el lápiz no hace nada (son un clic común). El dedo tiene captura implícita
//   (el pointerup llega al botón donde se apoyó) y no hace clic después de moverse; el lápiz y el mouse, no: con un
//   lápiz, un arrastre dentro del botón disparaba el deslizamiento y además el clic, y si soltaba fuera del botón el
//   punto de apoyo quedaba guardado para el pointerup siguiente (VFC-04 de la verificación, medido por CDP). La rueda
//   horizontal sobre una flecha mueve la fila (Chrome).
//
// AvisoCarrusel: la región viva (aria-live polite, solo para el lector de pantalla) con el aviso del hook: «Novedad 2
// de 6» después de Anterior o Siguiente, cuando la fila quedó quieta (useCarrusel.js y avisoCarrusel.js). Va en el
// HTML del servidor desde el principio, vacía y una sola vez, dentro del envoltorio de la fila y después de la capa de
// las flechas (CarruselNovedades.jsx): no ocupa lugar (sr-only la saca del flujo) ni toma el foco, así el orden del
// Tab sigue siendo la lista, «Anterior» y «Siguiente». Con una sola tarjeta no va (no hay botones que la hagan hablar).
// Hasta el 17/11/2026 iba en la fila de abajo, ContadorCarrusel, con el contador "n/total" (dibujo, aria-hidden; n: la
// primera tarjeta que se ve entera desde la izquierda) contra el borde derecho del contenido: una fila de 28,8 px a 24
// de la de tarjetas, invisible hasta que la página hidrataba (y con ella la región viva, fuera del árbol de
// accesibilidad hasta entonces). El desarrollador la sacó (decisión Q, arriba): lo que sigue en la página subió esos
// 52,8 px. El número sigue en el estado del hook (estado.actual), que arma el aviso y que usan los controles de abajo.

// La capa: sobre la fila, a 8 px de su borde de arriba (el margen por dentro de la fila: donde empieza la foto).
const CAPA = 'pointer-events-none absolute inset-x-0 top-2 z-10 grid noscript:hidden print:hidden'
// La guía: en la celda de los botones, arriba y a la izquierda; su alto (el de la foto) es el de la capa.
const GUIA = 'col-start-1 row-start-1 self-start justify-self-start'
// Las clases de un botón. El aro oscuro del foco y el touch-action van como propiedades sueltas (entre corchetes) y no
// con las utilidades de Tailwind de anillo y de gestos: esas traen sus variables y sus @property al CSS de todo el
// sitio (unos 2,4 kB más, medido el 16/11/2026). Con reduced-motion no se apagan las transiciones (se perdería el
// retardo de visibility de la que se oculta): index.css ya las deja en 0,01 ms.
const FLECHA =
  'pointer-events-auto col-start-1 row-start-1 grid size-11 place-items-center self-center rounded-full border ' +
  'border-transparent bg-ink/75 text-blanco cursor-pointer [touch-action:pan-y_pinch-zoom] ' +
  'transition-[opacity,visibility,background-color] duration-200 hover:bg-ink/90 focus-visible:outline-2 ' +
  'focus-visible:outline-blanco focus-visible:[box-shadow:0_0_0_4px_var(--color-ink)] ' +
  'forced-colors:bg-[ButtonFace] aria-disabled:cursor-default aria-disabled:[&>svg]:opacity-45'
// La flecha que no tiene adónde ir: transparente a los 200 ms y oculta de verdad 0,8 s después (el retardo es el de
// visibility, la segunda de las tres propiedades de la transición: el clic de más), salvo mientras tenga el foco
// visible.
const OCULTA = 'invisible opacity-0 [transition-delay:0s,800ms,0s] focus-visible:visible focus-visible:opacity-100'
/** Desde cuántos px un dedo que se mueve a lo ancho sobre una flecha cuenta como un deslizamiento (y no como un toque). */
const DESLIZAMIENTO = 24

/**
 * Qué pide un dedo que se apoyó en `desde` y se levantó en `hasta` (puntos de la ventana, en px) sobre una flecha: un
 * deslizamiento de 24 px o más a lo ancho, y más a lo ancho que a lo alto, hacia la izquierda es 'siguiente' y hacia
 * la derecha, 'anterior'. Lo demás no es un deslizamiento (null): un toque, que es el clic del botón, o un gesto
 * vertical o en diagonal de 45° o más, que es de la página. Sin estado ni DOM: lo prueba server/pruebas/layout.test.js
 * (VFC-05 de la verificación).
 * @param {{ x: number, y: number }} desde
 * @param {{ x: number, y: number }} hasta
 * @returns {'anterior' | 'siguiente' | null}
 */
export function gestoDelDedo(desde, hasta) {
  const dx = hasta.x - desde.x
  if (Math.abs(dx) < DESLIZAMIENTO || Math.abs(dx) <= Math.abs(hasta.y - desde.y)) return null
  return dx < 0 ? 'siguiente' : 'anterior'
}

/**
 * El dedo que desliza sobre una flecha (ver arriba): los manejadores de los dos botones. Hacia la izquierda, la tarjeta
 * siguiente; hacia la derecha, la anterior. Un toque (sin moverse) sigue siendo el clic del botón. Solo el dedo
 * (pointerType 'touch') deja guardado dónde se apoyó: con el mouse y con el lápiz no hace nada (VFC-04). Se exporta
 * para su prueba.
 * @param {() => void} anterior
 * @param {() => void} siguiente
 */
export function useDedoSobreLaFlecha(anterior, siguiente) {
  const inicio = useRef(null)
  return {
    onPointerDown: (e) => {
      inicio.current = e.pointerType === 'touch' ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null
    },
    onPointerUp: (e) => {
      const desde = inicio.current
      inicio.current = null
      if (!desde || desde.id !== e.pointerId) return
      const gesto = gestoDelDedo(desde, { x: e.clientX, y: e.clientY })
      if (gesto === 'siguiente') siguiente()
      else if (gesto === 'anterior') anterior()
    },
    onPointerCancel: () => {
      inicio.current = null
    },
  }
}

/**
 * @param {{ carrusel: ReturnType<typeof import('../hooks/useCarrusel.js').default>, total: number,
 *   textos: { anterior: string, siguiente: string }, guia: string }} props
 *   carrusel: lo que da useCarrusel; textos: los nombres de los botones; guia: las clases (estáticas) del ancho de la
 *   tarjeta y de la proporción de su foto
 */
export default function FlechasCarrusel({ carrusel, total, textos, guia }) {
  const { estado, idFila, anterior, siguiente } = carrusel
  const dedo = useDedoSobreLaFlecha(anterior, siguiente)
  if (total < 2) return null
  const hayMas = estado.listo && estado.desborda
  return (
    <div className={CAPA}>
      <div className={`${GUIA} ${guia}`} />
      <button
        type="button"
        aria-controls={idFila}
        aria-disabled={estado.alInicio}
        onClick={anterior}
        {...dedo}
        className={[FLECHA, 'ml-2 justify-self-start lg:ml-4', hayMas && !estado.alInicio ? '' : OCULTA]
          .filter(Boolean)
          .join(' ')}
      >
        <FlechaIzquierda />
        <span className="sr-only">{textos.anterior}</span>
      </button>
      <button
        type="button"
        aria-controls={idFila}
        aria-disabled={estado.alFinal}
        onClick={siguiente}
        {...dedo}
        className={[FLECHA, 'mr-2 justify-self-end lg:mr-4', hayMas && !estado.alFinal ? '' : OCULTA]
          .filter(Boolean)
          .join(' ')}
      >
        <FlechaDerecha />
        <span className="sr-only">{textos.siguiente}</span>
      </button>
    </div>
  )
}

/**
 * La región viva del carrusel (ver AvisoCarrusel, arriba): el aviso del hook, para el lector de pantalla, en un
 * párrafo que no ocupa lugar. Con una sola tarjeta, nada.
 * @param {{ carrusel: ReturnType<typeof import('../hooks/useCarrusel.js').default>, total: number }} props
 */
export function AvisoCarrusel({ carrusel, total }) {
  if (total < 2) return null
  return (
    <p aria-live="polite" className="sr-only">
      {carrusel.aviso}
    </p>
  )
}
