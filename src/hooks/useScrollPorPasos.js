import { useEffect } from 'react'

// Motor de los efectos "por pasos" ligados al scroll. El scroll no arrastra el elemento: solo decide en qué parada
// tiene que estar (umbral a mitad de cada tramo, con histéresis), y el elemento viaja hasta ella con una animación
// (Web Animations sobre transform) cuya duración no depende de la velocidad del scroll, así las transiciones se ven
// iguales con rueda, trackpad o touch. Sin loop propio: el navegador anima y se apaga solo. Con
// prefers-reduced-motion no se mueve (cada componente arma su versión estática con CSS).
// Lo usan el titular (la palabra baja de fila en fila, eje y: useParallaxPalabra) y los ejes de Identidad (los paneles
// se deslizan, eje x).
//
// refs.elemento -> lo que se mueve.
// refs.bloque   -> el contenedor que se observa: define la visibilidad y el progreso.
// refs.*        -> cualquier otro nodo que necesite medir().
// refs tiene que ser un objeto estable (useMemo), y medir/progreso funciones estables (definidas fuera del componente):
// son dependencias del efecto.
// medir(nodos, tramos) -> { paso, ... }: px con signo entre dos paradas, más lo que use progreso. Se llama al montar y
//   con cada cambio de tamaño (nunca en el frame de scroll).
// progreso(rectBloque, alto, medida) -> 0..1: dónde está el scroll dentro del efecto.

// ms que tarda en recorrer un paso (con más distancia tarda más, pero menos que proporcional: ver parametrosViaje).
export const DURACION = 360
// Margen alrededor de cada umbral, en fracción de tramo, para que el elemento no titile si el scroll queda en el borde
// (0,1 tramo = ~21 px de scroll en el titular a 1366x657).
const HISTERESIS = 0.1
// Eventos que solo produce una persona. Hasta el primero (o hasta ESPERA_CARGA después de load, o del montaje si load
// ya pasó, por si la persona usa algo que no llega a window, como la rueda sobre un iframe) todo scroll es del
// navegador: la restauración al cargar o al volver atrás, que termina ~100 ms después de load. Ese scroll pinta el
// elemento directo en su parada. touchmove cubre un dedo que sigue arrastrando si la página ya escuchaba touch; si se
// apoyó con la página en blanco, Chrome no le entrega el resto del gesto y lo cubre el temporizador.
const GESTOS = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown']
const ESPERA_CARGA = 1000

// Parada de destino (0..tramos) para el progreso p (0..1). Cambia al pasar la mitad de cada tramo, y solo si el
// progreso se alejó de la parada actual más que medio tramo más la histéresis. actual < 0: sin parada previa.
export function filaDestino(p, tramos, actual = -1) {
  const f = Math.min(Math.max(p, 0), 1) * tramos
  if (actual >= 0 && Math.abs(f - actual) <= 0.5 + HISTERESIS) return actual
  return Math.round(f)
}

// El easing es cubic-bezier(1/3, a, 2/3, 1). No cambiar los x: con 1/3 y 2/3 el tiempo es lineal en el parámetro,
// y curva/pendiente están simplificadas para eso (son la posición y la velocidad que usa parar() al interrumpir un
// viaje). a = 0 es smoothstep (arranca y termina quieto); 0 < a <= 1 arranca ya en movimiento.
export const easing = (a) => `cubic-bezier(${1 / 3}, ${a}, ${2 / 3}, 1)`
export const curva = (a, t) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t + t * t * t
export const pendiente = (a, t) => 3 * (1 - t) * (1 - t) * a + 6 * (1 - t) * t * (1 - a)

// Duración y arranque de un viaje de d px (con signo) que empieza a vel px/ms; paso = px entre dos paradas.
// Exportada, como las de arriba, para tools/parallax-check.mjs.
export function parametrosViaje(d, vel, paso, duracion = DURACION) {
  // Más distancia tarda más, pero menos que proporcional (dos pasos: 1,41 veces). El piso 0,4 solo actúa en viajes de
  // menos de un sexto de paso (en el titular, menos de 11 px, invisibles).
  const dur = duracion * Math.min(Math.max(Math.sqrt(Math.abs(d / paso)), 0.4), 1.5)
  // a = velocidad actual / velocidad inicial de la curva: si ya venía hacia el mismo lado, arranca a esa velocidad en
  // vez de frenar en seco. El recorte es lo que garantiza que nunca se pase de la parada: con a < 0 el elemento
  // retrocedería antes de arrancar (a = -1: 28 % de la distancia) y con a > 1 pasaría de largo (a = 1,5: 8 %).
  // Si el scroll se da vuelta, a = 0: frena en un frame y vuelve suave (medido 4,7 -> 0,4 px por frame).
  const a = Math.round(Math.min(Math.max((vel * dur) / d / 3, 0), 1) * 1000) / 1000
  return { dur, a }
}

export default function useScrollPorPasos(refs, { pasos = 3, medir, progreso, eje = 'y', duracion = DURACION, activo = true }) {
  useEffect(() => {
    // Los nodos se copian una sola vez: React pone ref.current en null antes de ejecutar el cleanup, así que
    // dentro del efecto se trabaja con los nodos, no con los refs.
    const nodos = Object.fromEntries(Object.entries(refs).map(([nombre, ref]) => [nombre, ref.current]))
    const { elemento, bloque } = nodos
    const tramos = pasos - 1
    if (!activo || tramos < 1 || Object.values(nodos).some((nodo) => !nodo)) return

    const trasladar = eje === 'x' ? (px) => `translate(${px}px, 0)` : (px) => `translate(0, ${px}px)`
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Sin hover (celulares y tablets) la barra de direcciones cambia el alto del viewport en pleno gesto: ahí el alto
    // cacheado solo se actualiza con cambios grandes. Con mouse cada cambio de alto cuenta (F11, DevTools, marcadores).
    const sinHover = window.matchMedia('(hover: none)')
    let cancelado = false
    let medida = { paso: 0 } // lo que devolvió medir()
    let alto = 0 // alto del viewport "estable" (ver remedir)
    let ancho = 0
    let visible = true
    let pedido = 0
    let fila = -1 // parada de destino actual (-1: sin pintar)
    let reposo = 0 // px de la parada de destino: donde queda el elemento cuando no viaja
    let viaje = null // animación en curso y sus parámetros (puede quedar apuntando a una terminada: ver parar)
    let sinAnimar = true // el próximo pintado va directo al destino, sin viaje
    let gesto = false // ya hubo un evento de GESTOS (o pasó ESPERA_CARGA desde load)
    let temporizador = 0
    let ultimoScroll = window.scrollY

    // Corta el viaje en curso y devuelve dónde estaba el elemento (px) y a qué velocidad iba (px/ms). Se mide antes de
    // cancel(), que borra currentTime. Si el viaje ya había terminado, curva(a, 1) = 1 y pendiente(a, 1) = 0: devuelve
    // el reposo exacto, por eso no hace falta limpiar viaje al terminar.
    const parar = () => {
      if (!viaje) return [reposo, 0]
      const { anim, desde, hasta, dur, a } = viaje
      const t = Math.min(Math.max(anim.currentTime / dur, 0), 1)
      anim.cancel()
      viaje = null
      return [desde + (hasta - desde) * curva(a, t), ((hasta - desde) * pendiente(a, t)) / dur]
    }

    // Lleva el elemento a `destino` px. Si cambia el destino a mitad de camino, sigue desde donde está.
    const mover = (destino, animar) => {
      const [pos, vel] = parar()
      reposo = destino
      elemento.style.transform = trasladar(destino)
      const d = destino - pos
      if (!animar || Math.abs(d) < 0.5) return
      const { dur, a } = parametrosViaje(d, vel, medida.paso, duracion)
      const anim = elemento.animate([{ transform: trasladar(pos) }, { transform: trasladar(destino) }], {
        duration: dur,
        easing: easing(a),
      })
      // Solo si empalma velocidad arranca en el reloj de este frame: evita un frame quieto entre viaje y viaje, y si el
      // frame llega tarde a pantalla la velocidad tapa el atraso. Desde cero (a = 0: arranque o inversión) arranca
      // cuando el compositor lo muestra: con el reloj fijado, un frame tardío (celular lento) mostraba la animación ya
      // avanzada, como un salto. Costo: al invertir, un frame quieto (~16 ms) en el punto de giro. Esta regla solo se
      // puede verificar en píxeles reales (screencast): el hilo principal ve un frame con el estilo final.
      // Límite conocido: si el hilo principal se traba justo al redirigir o invertir un viaje, el compositor siguió
      // moviendo el viejo y el nuevo arranca desde la posición calculada antes de la traba (medido: hasta ~25 px con
      // 280 ms de traba; reverse() tampoco lo evita).
      if (a > 0) {
        const ahora = document.timeline.currentTime
        if (ahora != null) anim.startTime = ahora
      }
      viaje = { anim, desde: pos, hasta: destino, dur, a }
    }

    const pintar = () => {
      pedido = 0
      if (cancelado) return
      // Directo a la parada, sin viaje: primer pintado, reentrada en vista, cambios de medida, saltos de scroll
      // (sinAnimar, ver alScroll) y todo scroll anterior al primer gesto (restauración del navegador).
      const animar = !sinAnimar && gesto
      sinAnimar = false
      if (reduce.matches) {
        parar()
        fila = -1
        reposo = 0
        elemento.style.transform = ''
        return
      }
      fila = filaDestino(progreso(bloque.getBoundingClientRect(), alto, medida), tramos, fila)
      // Redondeado a píxel entero para que el texto no quede desenfocado en reposo.
      const destino = Math.round(fila * medida.paso)
      // Con animar y el mismo destino no se toca: mover() cortaría el viaje en curso.
      if (!animar || destino !== reposo) mover(destino, animar)
    }

    // forzar: pintar aunque el bloque esté fuera de vista (cambios de tamaño, fuentes, reduced-motion o saltos).
    const pedir = (forzar = false) => {
      if (pedido || (!visible && !forzar)) return
      pedido = requestAnimationFrame(pintar)
    }
    const alScroll = () => {
      const d = window.scrollY - ultimoScroll
      ultimoScroll = window.scrollY
      if (reduce.matches) return
      // Salto desde lejos (Inicio, Fin, Ctrl+F, anclas y AvPág sin scroll suave): más de medio viewport entre dos eventos
      // de scroll, con el bloque fuera de vista antes o después. Se pinta directo, y en este mismo frame aunque el bloque
      // estuviera fuera de vista (esperar al IntersectionObserver mostraba un frame con la parada vieja). Si el bloque
      // estaba a la vista antes y después (una traba del hilo principal que acumuló el scroll, o dos muescas grandes en
      // un frame), la persona vio la parada vieja y el viaje sigue. Los saltos que hace el compositor sin scroll suave
      // (rueda de muescas grandes, clic en el riel) llegan acá un frame tarde: ese frame se ve con la parada vieja.
      let salto = Math.abs(d) > alto / 2
      if (salto) {
        const { top, height } = bloque.getBoundingClientRect()
        const aLaVista = (t) => t < alto && t + height > 0
        salto = !(aLaVista(top) && aLaVista(top + d))
      }
      if (salto) sinAnimar = true
      pedir(salto)
    }
    const alGesto = () => {
      gesto = true
    }
    const alCargar = () => {
      temporizador = setTimeout(alGesto, ESPERA_CARGA)
    }
    const remedir = () => {
      if (cancelado) return
      const pasoAntes = medida.paso
      medida = medir(nodos, tramos)
      const h = window.innerHeight
      if (!alto || window.innerWidth !== ancho || !sinHover.matches || Math.abs(h - alto) > 200) alto = h
      ancho = window.innerWidth
      // Si cambió el paso (alto de las filas o ancho de los paneles: fuentes, ancho), el viaje en curso apunta a un
      // lugar viejo. La barra móvil no lo cambia.
      if (medida.paso !== pasoAntes) sinAnimar = true
      pedir(true)
    }
    const alCambiarMovimiento = () => {
      sinAnimar = true
      remedir()
    }

    const io = new IntersectionObserver(
      (entradas) => {
        // La última del lote: si en un frame largo el bloque salió y volvió a entrar, llegan las dos juntas.
        visible = entradas[entradas.length - 1].isIntersecting
        // Al volver a la vista se pinta en el acto y sin animar, para no mostrar ni recorrer la parada vieja.
        if (visible) {
          if (pedido) cancelAnimationFrame(pedido)
          sinAnimar = true
          pintar()
        }
      },
      { rootMargin: '50% 0px' },
    )
    io.observe(bloque)

    const ro = new ResizeObserver(remedir)
    ro.observe(bloque)

    window.addEventListener('scroll', alScroll, { passive: true })
    window.addEventListener('resize', remedir)
    for (const evento of GESTOS) window.addEventListener(evento, alGesto, { passive: true })
    if (document.readyState === 'complete') alCargar()
    else window.addEventListener('load', alCargar, { once: true })
    reduce.addEventListener('change', alCambiarMovimiento)
    document.fonts?.ready.then(remedir)
    remedir()

    return () => {
      cancelado = true
      if (pedido) cancelAnimationFrame(pedido)
      clearTimeout(temporizador)
      parar()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', alScroll)
      window.removeEventListener('resize', remedir)
      for (const evento of GESTOS) window.removeEventListener(evento, alGesto)
      window.removeEventListener('load', alCargar)
      reduce.removeEventListener('change', alCambiarMovimiento)
      elemento.style.transform = ''
    }
  }, [refs, pasos, medir, progreso, eje, duracion, activo])
}
