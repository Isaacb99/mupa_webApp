import { useEffect, useId, useRef, useState } from 'react'
import { crearAvisador } from '../components/avisoCarrusel.js'

// La lógica de un carrusel con scroll horizontal nativo: una fila (<ul>) que se desliza con el dedo, el trackpad o
// Mayús + rueda, y Anterior y Siguiente (abajo de la fila, ControlesCarrusel.jsx, o a sus costados, FlechasCarrusel.jsx,
// desde el 16/11/2026: el hook no cambió). La usan el carrusel de Novedades de la Home y de
// Divulgación (CarruselNovedades.jsx) y los documentales de El Museo en el celular (src/paginas/ElMuseo.jsx). Salió
// tal cual de CarruselNovedades.jsx (10/11/2026): el HTML de esas páginas no cambió.
// - estado.listo: ya se midió en el navegador. El estado inicial es el mismo en el servidor y en el navegador (sin
//   diferencias de hidratación): lo demás se mide después, en un efecto. Antes de eso, y sin JavaScript, quien lo usa
//   no pone el snap y deja los controles invisibles (ocupan su lugar: nada se corre al aparecer).
// - estado.desborda: las tarjetas no entran sin scroll (si entran, los controles quedan invisibles).
// - estado.actual: la primera tarjeta que se ve entera desde la izquierda, desde 1 (el contador "n/total" de los
//   controles de abajo y el aviso de la región viva; el carrusel de Novedades, con las flechas a los costados, no
//   dibuja el contador desde el 17/11/2026, pero sigue avisando).
// - estado.alInicio y estado.alFinal: Anterior o Siguiente no tienen adónde ir (van con aria-disabled, no disabled: el
//   foco no se pierde).
// - aviso: lo que dice la región viva (aria-live polite): vacío hasta el primer Anterior o Siguiente, y después
//   contador(n, total) cuando la fila quedó quieta (scrollend, o 150 ms sin scroll: en Chrome el scrollend de un
//   elemento no siempre llega, medido en Chrome 156 sin ventana; el de la página sí). Con el scroll de la mano o el foco
//   en una tarjeta no avisa nada (el enlace ya dice cuál es: A11Y-03 de la verificación del 02/11/2026); cada botón
//   vacía la región y el aviso se escribe después, así suena aunque repita el anterior, y si la fila se mueve por otra
//   causa la región se vacía (avisoCarrusel.js; R1-01 de la re-verificación).
// - Con Tab, el navegador trae a la vista el título enfocado lo justo y el snap obligatorio puede devolver la fila a la
//   tarjeta anterior (en el celular, con una tarjeta por vez, la enfocada quedaba afuera): si la tarjeta del foco no se
//   ve entera, la fila va a ella.
// - Anterior y Siguiente llevan la fila a la tarjeta anterior o siguiente, apoyada en su borde izquierdo (sin animar
//   con reduced-motion).
// La fila tiene 8 px de margen por dentro a la izquierda (MARGEN_FILA: donde se apoyan las tarjetas al deslizar) y los
// mismos afuera, en negativo, para que el contorno del foco no quede cortado.

/** El margen por dentro de la fila a la izquierda (pl-2 / scroll-pl-2: 8 px): donde se apoyan las tarjetas al deslizar. */
const MARGEN_FILA = 8

/** Desliza la fila `f` hasta la tarjeta `li`, apoyada en su borde izquierdo (sin animar con reduced-motion). */
function llevarA(f, li) {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
  f.scrollTo({ left: li.offsetLeft - MARGEN_FILA, behavior: quieto ? 'instant' : 'smooth' })
}

/**
 * @param {{ total: number, contador: (n: number, total: number) => string }} opciones
 *   total: cuántas tarjetas tiene la fila; contador: el texto de la región viva ("Novedad 2 de 6"). Tiene que ser una
 *   función estable (la de src/content.js): va en las dependencias del efecto.
 * @returns {{ fila: import('react').RefObject<HTMLUListElement | null>, idFila: string,
 *   estado: { listo: boolean, desborda: boolean, actual: number, alInicio: boolean, alFinal: boolean },
 *   aviso: string, anterior: () => void, siguiente: () => void }}
 *   fila: el ref de la <ul>; idFila: su id (lo nombran los botones con aria-controls).
 */
export default function useCarrusel({ total, contador }) {
  const idFila = useId()
  const fila = useRef(null)
  // listo: ya se midió en el navegador (antes, y sin JavaScript, la fila de los botones queda invisible).
  const [estado, setEstado] = useState({ listo: false, desborda: false, actual: 1, alInicio: true, alFinal: false })
  // Lo que avisa la región viva: vacío hasta el primer Anterior o Siguiente; lo maneja el avisador (avisoCarrusel.js),
  // que vive en el efecto. avisar: la fila se está moviendo por un botón, hacia `destino` (su scrollLeft), hasta que
  // quede quieta ahí (o 2 s como mucho, por si el navegador no llega a moverla); null si no.
  const [aviso, setAviso] = useState('')
  const avisar = useRef(null)
  const avisador = useRef(null)

  useEffect(() => {
    const f = fila.current
    if (!f) return undefined
    const av = crearAvisador({ escribir: setAviso })
    avisador.current = av
    let cuadro = 0
    // La primera tarjeta que se ve entera desde la izquierda (1 px de tolerancia: el snap redondea), desde 1.
    const primeraEntera = () => {
      const i = [...f.children].findIndex((li) => li.offsetLeft - f.scrollLeft >= MARGEN_FILA - 1)
      return i < 0 ? total : i + 1
    }
    let quieta = 0
    const medir = () => {
      cuadro = 0
      const max = f.scrollWidth - f.clientWidth
      const x = f.scrollLeft
      const siguiente = {
        listo: true,
        desborda: max > 1,
        actual: primeraEntera(),
        alInicio: x <= 1,
        alFinal: x >= max - 1,
      }
      setEstado((antes) =>
        Object.keys(siguiente).every((k) => antes[k] === siguiente[k]) ? antes : siguiente,
      )
    }
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir)
    }
    // La fila quedó quieta: si la movió un botón y llegó adonde iba, la región viva dice en qué tarjeta quedó.
    const alQuedarQuieta = () => {
      clearTimeout(quieta)
      quieta = 0
      const pedido = avisar.current
      if (!pedido) return
      if (performance.now() > pedido.hasta) {
        avisar.current = null
        return
      }
      if (Math.abs(f.scrollLeft - pedido.destino) > 2) return
      avisar.current = null
      av.llegada(contador(primeraEntera(), total), f.scrollLeft)
    }
    const alScroll = () => {
      pedir()
      // Mientras la mueve un botón: quieta después de 150 ms sin scroll (o con scrollend, lo que llegue primero). Si la
      // mueve otra cosa (la mano, el foco), el aviso que quedaba en la región ya no vale.
      if (avisar.current) {
        clearTimeout(quieta)
        quieta = setTimeout(alQuedarQuieta, 150)
      } else av.movida(f.scrollLeft)
    }
    // Con Tab: si la tarjeta del foco no se ve entera, la fila va a ella (el snap la devolvía a la anterior).
    const alEnfocar = (e) => {
      const li = e.target.closest?.('li')
      if (!li || li.parentElement !== f) return
      const desde = li.offsetLeft - f.scrollLeft
      if (desde >= MARGEN_FILA - 1 && desde + li.offsetWidth <= f.clientWidth + 1) return
      llevarA(f, li)
    }
    medir()
    f.addEventListener('scroll', alScroll, { passive: true })
    f.addEventListener('scrollend', alQuedarQuieta)
    f.addEventListener('focusin', alEnfocar)
    const observador = new ResizeObserver(pedir)
    observador.observe(f)
    return () => {
      f.removeEventListener('scroll', alScroll)
      f.removeEventListener('scrollend', alQuedarQuieta)
      f.removeEventListener('focusin', alEnfocar)
      observador.disconnect()
      if (cuadro) cancelAnimationFrame(cuadro)
      clearTimeout(quieta)
      av.cerrar()
      avisador.current = null
    }
  }, [total, contador])

  /**
   * Lleva la fila a la tarjeta `indice` (desde 0), apoyada en su borde izquierdo (el navegador la frena en el final), y
   * le pide a la región viva que avise dónde quedó cuando termine de moverse (si se mueve: 2 s como mucho). La región se
   * vacía ya: así el aviso vuelve a sonar aunque sea el mismo texto (R1-01).
   */
  const ir = (indice) => {
    const f = fila.current
    const li = f?.children[Math.min(Math.max(indice, 0), total - 1)]
    if (!li) return
    const destino = Math.min(Math.max(li.offsetLeft - MARGEN_FILA, 0), f.scrollWidth - f.clientWidth)
    if (Math.abs(destino - f.scrollLeft) < 1) return
    avisar.current = { destino, hasta: performance.now() + 2000 }
    avisador.current?.pedido()
    llevarA(f, li)
  }
  const anterior = () => {
    if (!estado.alInicio) ir(estado.actual - 2)
  }
  const siguiente = () => {
    if (!estado.alFinal) ir(estado.actual)
  }

  return { fila, idFila, estado, aviso, anterior, siguiente }
}
