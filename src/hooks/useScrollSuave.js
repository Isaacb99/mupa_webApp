import { useEffect } from 'react'
import Lenis from 'lenis'

// Teclas que no scrollean por sí solas: no cortan la inercia (Shift o Ctrl apretados mientras la rueda desliza).
const MODIFICADORES = ['Shift', 'Control', 'Alt', 'Meta']
// ms que dura, como mucho, el scroll nativo animado de una tecla (Fin, AvPág, Espacio, flechas).
const SCROLL_TECLA = 300

// El ancla de la URL se atiende una sola vez por carga (no en cada Fast Refresh ni en el doble montaje de StrictMode).
let anclaAtendida = false

// Instancia activa, para los efectos que cambian el alto de la página por encima de lo que se ve (useAcordeonScroll).
let lenisActual = null

// true mientras Lenis está deslizando la rueda (inercia en curso).
export function scrollSuaveEnCurso() {
  return lenisActual?.isScrolling === 'smooth'
}

// Después de cambiar el alto de algo que está por encima de `referencia`, deja a `referencia` donde estaba (topAntes,
// medido con el scroll en yAntes): si el navegador ya lo compensó con su anclaje de scroll no mueve nada, y si no,
// mueve el scroll lo que falta. En los dos casos corre el destino y la posición de Lenis lo mismo que se movió el
// scroll, así la inercia de la rueda sigue su curva desde el lugar nuevo (con reset se cortaba de golpe).
export function mantenerEnPantalla(referencia, topAntes, yAntes) {
  const falta = referencia.getBoundingClientRect().top - topAntes
  if (Math.abs(falta) >= 0.5) window.scrollTo({ top: window.scrollY + falta, behavior: 'instant' })
  const movido = window.scrollY - yAntes
  if (lenisActual && movido) {
    lenisActual.animatedScroll += movido
    lenisActual.targetScroll += movido
    // La animación en curso de Lenis guarda su propio valor y destino: si no se corren, el frame siguiente devuelve el
    // scroll a las coordenadas viejas (salto de ~1000 px medido con la rueda, 22/09/2026).
    const animacion = lenisActual.animate
    if (animacion?.isRunning) {
      animacion.value += movido
      animacion.from += movido
      animacion.to += movido
    }
  }
}

// Scroll suavizado en toda la página (pedido del desarrollador el 21/09/2026, con https://www.dhk.co.za/ de referencia,
// que usa Lenis): la rueda y el trackpad no saltan de golpe, el scroll se acerca al destino con inercia (lerp 0,1 por
// frame). Lenis mueve el scroll nativo del documento, así que sticky, IntersectionObserver y los eventos scroll de los
// efectos siguen funcionando igual; el scroll con el dedo queda nativo (syncTouch apagado) y con "reducir movimiento"
// Lenis mismo deja de suavizar (respectReducedMotion). anchors: los enlaces internos (#main del "Ir al contenido")
// también van suaves.
//
// Arreglos de la revisión adversarial del 22/09/2026:
// - naiveDimensions: el límite de scroll se lee en vivo en cada scrollTo. Con el ResizeObserver de Lenis (250 ms de
//   espera, que se posterga mientras dura una transición de alto) la rueda frenaba en el final viejo de la página al
//   abrir o cerrar una banda de Áreas.
// - Lenis no escucha el teclado: durante la inercia de la rueda (~1 s) pisaba en cada frame el scroll de una tecla
//   (Espacio, AvPág, Fin, flechas), el del foco con Tab (el foco quedaba fuera de pantalla) y el de buscar en la página.
//   Se corta la inercia con la tecla o el foco, antes de que el navegador haga su scroll, y con cualquier scroll que
//   no sea el que puso Lenis (el Enter del buscador no llega a la página como tecla).
// - Una muesca durante el scroll animado de una tecla se deja nativa: si no, Lenis la sumaba a un destino atrasado y la
//   página iba y volvía cientos de px.
// - El ancla de la URL (mupa.ar/#areas): el navegador la busca antes de que React pinte las secciones y la página
//   quedaba arriba. Solo en navegación nueva: al recargar o volver atrás manda la restauración del navegador.
//
// Rendimiento en celular (medición con CPU ralentizada x4/x6, 22/09/2026): Lenis registra touchstart/touchmove/touchend
// no pasivos en window aunque con syncTouch apagado no hace nada con el dedo, así que el navegador esperaba al hilo
// principal antes de empezar cada gesto (la página quedaba quieta 40-115 ms y después saltaba hasta 130 px), y su
// autoRaf ocupaba el 16 % del hilo principal con la página quieta. Por eso:
// - Sin puntero fino (celulares y tablets táctiles) no se crea Lenis: el scroll era y sigue siendo el nativo.
// - Con puntero fino y pantalla táctil a la vez (notebooks táctiles), sus listeners de touch se vuelven a registrar
//   pasivos (con syncTouch apagado Lenis solo llama a preventDefault en touch si está detenido o bloqueado, y el sitio
//   no usa ninguna de las dos). La rueda sigue no pasiva: el suavizado necesita preventDefault.
export default function useScrollSuave() {
  useEffect(() => {
    if (!matchMedia('(any-pointer: fine)').matches) {
      const dejarDeSeguir = atenderAncla((destino) => destino.scrollIntoView())
      return dejarDeSeguir
    }
    let ultimaTecla = -Infinity
    let lenis = null
    lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      stopInertiaOnNavigate: true,
      naiveDimensions: true,
      virtualScroll: ({ event }) =>
        !(event.type === 'wheel' && lenis?.isScrolling === 'native' && performance.now() - ultimaTecla < SCROLL_TECLA),
    })
    lenisActual = lenis
    const vs = lenis.virtualScroll
    if (vs?.element) {
      for (const [tipo, manejador] of [
        ['touchstart', vs.onTouchStart],
        ['touchmove', vs.onTouchMove],
        ['touchend', vs.onTouchEnd],
      ]) {
        vs.element.removeEventListener(tipo, manejador)
        vs.element.addEventListener(tipo, manejador, { passive: true })
      }
    }
    const cortar = () => {
      if (lenis.isScrolling === 'smooth') lenis.reset()
    }
    const alTeclear = (e) => {
      if (MODIFICADORES.includes(e.key)) return
      ultimaTecla = performance.now()
      cortar()
    }
    const alScroll = () => {
      if (lenis.isScrolling === 'smooth' && Math.abs(window.scrollY - lenis.animatedScroll) > 2) lenis.reset()
    }
    window.addEventListener('keydown', alTeclear, true)
    window.addEventListener('focusin', cortar, true)
    window.addEventListener('scroll', alScroll, { passive: true })

    const dejarDeSeguir = atenderAncla((destino) => lenis.scrollTo(destino, { immediate: true, force: true }))

    return () => {
      window.removeEventListener('keydown', alTeclear, true)
      window.removeEventListener('focusin', cortar, true)
      window.removeEventListener('scroll', alScroll)
      dejarDeSeguir()
      if (lenisActual === lenis) lenisActual = null
      lenis.destroy()
    }
  }, [])
}

// Lleva la página al ancla de la URL con `ir(destino)` una sola vez por carga y solo en navegación nueva (al recargar o
// volver atrás manda la restauración del navegador), y vuelve a hacerlo cuando cargan las fuentes si la persona no
// scrolleó (corren el ancla unos px: 26 medidos a 375x812). Devuelve la limpieza.
function atenderAncla(ir) {
  if (anclaAtendida) return () => {}
  anclaAtendida = true
  const nav = performance.getEntriesByType('navigation')[0]
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id || nav?.type !== 'navigate') return () => {}
  const saltar = () => {
    const destino = document.getElementById(id)
    if (destino) ir(destino)
  }
  saltar()
  let movio = false
  const marcar = () => {
    movio = true
  }
  const gestos = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  for (const g of gestos) window.addEventListener(g, marcar, { once: true, passive: true })
  document.fonts.ready.then(() => {
    if (!movio) saltar()
  })
  return () => {
    for (const g of gestos) window.removeEventListener(g, marcar)
  }
}
