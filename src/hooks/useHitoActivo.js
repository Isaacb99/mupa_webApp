import { useLayoutEffect, useState } from 'react'
import { medirEnganche, progresoEnganche } from './enganche.js'
import { filaDestino } from './useScrollPorPasos.js'

// Línea de lectura: fracción del alto de la pantalla (desde arriba) que marca el hito actual.
const LINEA = 0.55
// ms que queda encendido, como mínimo, cada hito (= lo que tarda en encenderse del todo: ObraHistorica.jsx).
const PASO = 300

// Margen mínimo entre los bordes de la pantalla y lo enganchado.
const MARGEN = 32
// Debajo de lg, tope del título enganchado: arriba de él hay 128 px vacíos (el final de Identidad y el comienzo de la
// sección) que tapa su fondo mientras el párrafo pasa por debajo (ObraHistorica.jsx), así que nunca queda más abajo.
const TOPE_TITULO = 120
// Entrada de título y párrafo (lg), dentro del bloque alineado: el título viene DESCENSO px más arriba de su lugar y
// baja, y el párrafo SUBIDA px más abajo y sube, ligados al scroll durante los últimos ENTRADA px antes del enganche,
// hasta encontrarse justo en el enganche; ahí queda todo quieto, con el título a la altura del primer hito, y arranca el
// resaltado (pedido del desarrollador, 21/09/2026, en varios pasos: párrafo bajando desde el título; "a la inversa",
// separados y juntándose; el título enganchado también; y el título entrando desde arriba).
const DESCENSO = 80
const SUBIDA = 120
const ENTRADA = 480
// Como en useScrollPorPasos: hasta el primer gesto de la persona (o 1 s después de load) el scroll es del navegador
// (restauración al recargar) y se pinta directo, sin recorrer los hitos.
const GESTOS = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown']
const ESPERA_CARGA = 1000

// Hito actual de la línea de tiempo de Obra histórica. Dos modos:
// - Lista enganchada (`enganche.fijo` es sticky dentro de `enganche.bloque`, que mide la lista más un tramo de scroll
//   por hito): el hito es la parada del recorrido, como en los paneles (umbral a mitad de cada tramo, con histéresis).
//   Así el scroll no pasa la lista de largo: cada hito ocupa su tramo. El top del sticky lo pone el hook: centrada en la
//   pantalla, a MARGEN como mínimo; `enganche.alineado` (título + párrafo, en lg) recibe el mismo top y el alto de la
//   lista; `enganche.titulo` baja y `enganche.parrafo` sube hasta encontrarse antes del enganche.
//   Debajo de lg se engancha también lo de arriba de la lista (pedidos del desarrollador del 22/09/2026: "que no se
//   mueva hacia arriba sino que se quede, y cuando se terminan los hitos recién sube todo junto", y después que se quede
//   también el párrafo): si entran título, párrafo y lista, el envoltorio de los dos (data-obra="trio"); si no, solo el
//   título (data-obra="titulo") y el párrafo pasa por debajo. El hook pone los top y deja en la sección --cola, que
//   ObraHistorica.jsx usa para que todo se suelte en el mismo scroll.
// - Lista suelta (variante hitos-libres: reduced-motion, impresión, o si lo enganchado no entra en la pantalla con
//   MARGEN arriba y abajo, que mide este hook y marca con data-hitos-libres en la sección): el último hito cuya parte de
//   arriba ya pasó la línea de lectura; antes de que el primero llegue, el primero (como en el Figma).
// En los dos modos cada hito queda encendido al menos PASO ms: si el scroll va más rápido, el resaltado va detrás
// recorriendo los hitos de a uno, así todos se ven iluminarse. Con reduced-motion va directo. Solo mide mientras la
// lista está cerca de la pantalla, y como mucho una vez por frame.
export default function useHitoActivo(lista, enganche = {}) {
  const [activo, setActivo] = useState(0)
  const { bloque: bloqueRef, fijo: fijoRef, alineado: alineadoRef, titulo: tituloRef, parrafo: parrafoRef } = enganche

  useLayoutEffect(() => {
    const el = lista.current
    const bloque = bloqueRef?.current
    const fijo = fijoRef?.current
    const alineado = alineadoRef?.current
    const titulo = tituloRef?.current
    const parrafo = parrafoRef?.current
    if (!el) return
    const moviles = [titulo, parrafo].filter(Boolean)
    const seccion = el.closest('section')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const escritorio = matchMedia('(width >= 64rem)')
    // Sin hover (celular) la barra del navegador cambia el alto en pleno gesto: el alto cacheado solo se actualiza si
    // cambia el ancho (giro), así el top del sticky no salta.
    const sinHover = matchMedia('(hover: none)').matches
    let alto = 0
    let ancho = 0
    let medida = { enganchado: false }
    let pedido = 0
    let reloj = 0
    let objetivo = 0
    let mostrado = 0
    let primera = true
    let gesto = false
    let temporizador = 0
    // La lista acaba de acercarse a la pantalla (o volvió): la próxima medida va directa, como la reentrada en vista del
    // motor, así un salto desde lejos (Fin, ancla) no muestra el recorrido desde el hito viejo.
    let entrando = true

    // Hito que corresponde a la posición actual del scroll.
    const calcular = () => {
      if (medida.enganchado && bloque) {
        const p = progresoEnganche(bloque.getBoundingClientRect(), 0, medida)
        return filaDestino(p, el.children.length - 1, objetivo)
      }
      const linea = window.innerHeight * LINEA
      let actual = 0
      for (let i = 0; i < el.children.length; i++) {
        if (el.children[i].getBoundingClientRect().top <= linea) actual = i
      }
      return actual
    }

    // Un paso hacia el objetivo y PASO ms de espera en que solo se actualiza el objetivo; al vencer, otro paso si falta.
    // Vuelve a medir antes de dar el paso: si el scroll se invirtió en el último frame y la medida en rAF todavía no
    // corrió, no da un paso de más en la dirección vieja.
    const avanzar = () => {
      reloj = 0
      objetivo = calcular()
      if (mostrado === objetivo) return
      mostrado += Math.sign(objetivo - mostrado)
      setActivo(mostrado)
      reloj = setTimeout(avanzar, PASO)
    }
    const directo = () => {
      clearTimeout(reloj)
      reloj = 0
      mostrado = objetivo
      setActivo(objetivo)
    }

    // Encuentro de título y párrafo antes del enganche: separados a ENTRADA px o más, juntos (translate 0) cuando la
    // lista llega a su top y de ahí en adelante.
    const acercar = () => {
      if (!moviles.length || !medida.alineadoEnganchado) return
      const falta = fijo.getBoundingClientRect().top - medida.topFijo
      const q = Math.min(Math.max(falta / ENTRADA, 0), 1)
      if (titulo) titulo.style.translate = q > 0 ? `0px ${-Math.round(DESCENSO * q)}px` : ''
      if (parrafo) parrafo.style.translate = q > 0 ? `0px ${Math.round(SUBIDA * q)}px` : ''
    }

    const medir = () => {
      pedido = 0
      acercar()
      objetivo = calcular()
      // Sin recorrido: la primera medida, la entrada en vista, todo scroll anterior al primer gesto (restauración del
      // navegador) y reduced-motion.
      if (primera || entrando || !gesto || reduce.matches) {
        primera = false
        entrando = false
        directo()
        return
      }
      if (!reloj) avanzar()
    }
    const alGesto = () => {
      gesto = true
    }
    const alCargar = () => {
      temporizador = setTimeout(alGesto, ESPERA_CARGA)
    }
    const pedir = () => {
      if (!pedido) pedido = requestAnimationFrame(medir)
    }
    // Enganchado o no (cambia con el tamaño de la pantalla y con reduced-motion) y a qué altura: se mide fuera del frame
    // de scroll.
    const remedir = () => {
      if (!alto || !sinHover || window.innerWidth !== ancho) alto = window.innerHeight
      ancho = window.innerWidth
      if (fijo) {
        const lista = fijo.offsetHeight
        // Centrado en la pantalla. Si con el alto cacheado no entraría en la pantalla de ahora (cambió solo el alto:
        // teclado en pantalla, ventana), el top se calcula con el alto vivo.
        const centrar = (grupo) => {
          const c = (h) => Math.max(MARGEN, Math.round((h - grupo) / 2))
          const arriba = c(alto)
          return arriba + grupo > window.innerHeight ? c(window.innerHeight) : arriba
        }
        // ¿Entra con MARGEN arriba y abajo? Con el alto cacheado: en celular la barra del navegador no cambia el modo en
        // pleno gesto. Los altos no dependen del modo (el ancho de las columnas no cambia), así que no oscila.
        const entra = (grupo) => grupo + 2 * MARGEN <= alto
        if (escritorio.matches || !titulo) {
          if (seccion) delete seccion.dataset.obra
          seccion?.toggleAttribute('data-hitos-libres', !entra(lista))
          seccion?.style.removeProperty('--cola')
          if (titulo) titulo.style.top = ''
          const top = centrar(lista)
          fijo.style.top = `${top}px`
          if (alineado) {
            alineado.style.top = `${top}px`
            // El párrafo enganchado (lg) se suelta junto con la lista: su bloque contenedor es su área de la grilla
            // (lista más recorrido), así que sin esto seguiría enganchado hasta que su propio borde de abajo llegue al
            // final, o sea (alto lista - alto párrafo) px de más. Solo mientras es sticky: suelto, un alto mínimo lo
            // estiraría.
            alineado.style.minHeight = getComputedStyle(alineado).position === 'sticky' ? `${lista}px` : ''
          }
        } else {
          // Debajo de lg: título (con su margen de abajo), párrafo y el espacio hasta la lista (el margen de arriba del
          // bloque, que colapsa con el de la lista).
          const cabeza = titulo.offsetHeight + parseFloat(getComputedStyle(titulo).marginBottom)
          const texto = parrafo ? parrafo.offsetHeight : 0
          const hueco = Math.max(
            parseFloat(getComputedStyle(bloque).marginTop) || 0,
            parseFloat(getComputedStyle(el).marginTop) || 0,
          )
          const trio = cabeza + texto + hueco + lista
          const modo = reduce.matches ? null : entra(trio) ? 'trio' : entra(cabeza + lista) ? 'titulo' : null
          if (modo) seccion.dataset.obra = modo
          else delete seccion.dataset.obra
          seccion.toggleAttribute('data-hitos-libres', !modo)
          if (alineado) alineado.style.minHeight = ''
          if (modo === 'trio') {
            // El envoltorio (título y párrafo) y la lista, a `hueco` px; se sueltan juntos si el contenedor termina
            // hueco + lista antes que el bloque de la lista (--cola).
            const top = centrar(trio)
            titulo.style.top = ''
            if (alineado) alineado.style.top = `${top}px`
            fijo.style.top = `${top + cabeza + texto + hueco}px`
            seccion.style.setProperty('--cola', `${hueco + lista}px`)
          } else if (modo === 'titulo') {
            // El título y la lista, a su margen de abajo; el título, con un tope (ver TOPE_TITULO).
            const top = Math.min(centrar(cabeza + lista), TOPE_TITULO)
            titulo.style.top = `${top}px`
            fijo.style.top = `${top + cabeza}px`
            if (alineado) alineado.style.top = ''
            seccion.style.setProperty('--cola', `${lista}px`)
          } else {
            titulo.style.top = ''
            if (alineado) alineado.style.top = ''
            fijo.style.top = `${centrar(lista)}px`
            seccion.style.removeProperty('--cola')
          }
        }
      }
      medida = fijo ? medirEnganche(fijo) : { enganchado: false }
      // La entrada de título y párrafo (acercar) es solo de lg.
      medida.alineadoEnganchado =
        escritorio.matches && Boolean(alineado) && getComputedStyle(alineado).position === 'sticky'
      if (!medida.alineadoEnganchado) for (const nodo of moviles) nodo.style.translate = ''
      pedir()
    }
    const escuchar = (si) => {
      const metodo = si ? 'addEventListener' : 'removeEventListener'
      window[metodo]('scroll', pedir, { passive: true })
      window[metodo]('resize', remedir)
    }
    // Si activan "reducir movimiento" con la página abierta, corta el recorrido en curso.
    const alCambiarMovimiento = () => {
      remedir()
      if (reduce.matches) directo()
    }

    // Escucha el scroll solo con la lista a menos de una pantalla de distancia.
    let escuchando = false
    const observador = new IntersectionObserver(
      (entradas) => {
        const cerca = entradas[entradas.length - 1].isIntersecting
        if (cerca !== escuchando) {
          escuchando = cerca
          escuchar(cerca)
          if (cerca) {
            entrando = true
            remedir()
          }
        }
      },
      { rootMargin: '100% 0px' },
    )
    observador.observe(el)
    const ro = bloque ? new ResizeObserver(remedir) : null
    ro?.observe(bloque)
    if (titulo) ro?.observe(titulo)
    if (parrafo) ro?.observe(parrafo)
    reduce.addEventListener('change', alCambiarMovimiento)
    for (const evento of GESTOS) window.addEventListener(evento, alGesto, { passive: true })
    if (document.readyState === 'complete') alCargar()
    else window.addEventListener('load', alCargar, { once: true })
    // Primer pintado sincrónico (efecto de layout): al recargar a mitad de la entrada, el primer frame ya sale con el
    // translate de título y párrafo y el hito correctos; con la medida en rAF salía un frame con el trío junto y después
    // saltaban (hallazgo de la revisión del 22/09/2026). Chrome ya restauró el scroll cuando corre el efecto.
    remedir()
    cancelAnimationFrame(pedido)
    medir()

    return () => {
      observador.disconnect()
      ro?.disconnect()
      reduce.removeEventListener('change', alCambiarMovimiento)
      for (const evento of GESTOS) window.removeEventListener(evento, alGesto)
      window.removeEventListener('load', alCargar)
      clearTimeout(temporizador)
      if (escuchando) escuchar(false)
      cancelAnimationFrame(pedido)
      clearTimeout(reloj)
      if (alineado) alineado.style.minHeight = ''
      for (const nodo of moviles) nodo.style.translate = ''
      if (titulo) titulo.style.top = ''
      if (alineado) alineado.style.top = ''
      seccion?.removeAttribute('data-hitos-libres')
      if (seccion) delete seccion.dataset.obra
      seccion?.style.removeProperty('--cola')
    }
  }, [lista, bloqueRef, fijoRef, alineadoRef, tituloRef, parrafoRef])

  return activo
}
