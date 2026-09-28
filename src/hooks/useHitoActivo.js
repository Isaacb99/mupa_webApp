import { useLayoutEffect, useState } from 'react'
import { medirEnganche, progresoEnganche } from './enganche.js'
import { filaDestino } from './useScrollPorPasos.js'

// Línea de lectura: fracción del alto de la pantalla (desde arriba) que marca el hito actual.
const LINEA = 0.55
// ms que queda encendido, como mínimo, cada hito (= lo que tarda en encenderse del todo: ObraHistorica.jsx).
const PASO = 350

// Margen mínimo entre los bordes de la pantalla y lo enganchado. Con el trío de celular (título + párrafo + lista) es
// más chico: con 32 no entraba en pantallas de 800 px por 21 px y el título se iba con el scroll.
const MARGEN = 32
const MARGEN_TRIO = 16
// Entrada de título y párrafo (lg): el título viene DESCENSO px más arriba de su lugar y baja, y el párrafo SUBIDA px
// más abajo y sube, ligados al scroll durante los últimos ENTRADA px antes del enganche, hasta encontrarse justo cuando
// la lista llega a su top; ahí queda todo quieto y arranca el resaltado (pedido del desarrollador el 21/09/2026 y otra
// vez el 25/09, después de que el título pasara a cruzar las dos columnas: "que el título y el párrafo se muevan hasta
// encontrarse con los hitos").
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
//   pantalla, a MARGEN como mínimo; `enganche.alineado` (título y párrafo, en lg) recibe el mismo top y el alto de la
//   lista, y adentro `enganche.titulo` baja y `enganche.parrafo` sube hasta encontrarse antes del enganche.
//   Debajo de lg, si el trío (título + párrafo + lista) entra en la pantalla, se engancha entero: el envoltorio con el
//   top que pone el hook y la lista `hueco` px debajo (data-obra="trio" en la sección; pedidos del desarrollador del
//   22/09/2026 y del 25/09, "el título y el párrafo deberían quedar"). Para que se suelten en el mismo scroll, el hook
//   deja --cola = hueco + alto de la lista, que el bloque de la lista lleva como margen negativo y el mosaico devuelve.
//   Si el trío no entra, se engancha solo la lista.
// - Lista suelta (variante hitos-libres: reduced-motion, impresión, o si la lista no entra en la pantalla con MARGEN
//   arriba y abajo, que mide este hook y marca con data-hitos-libres en la sección): el último hito cuya parte de arriba
//   ya pasó la línea de lectura; antes de que el primero llegue, el primero (como en el Figma).
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

    // Encuentro de título y párrafo antes del enganche: a ENTRADA px o más están separados (el título arriba, el
    // párrafo abajo) y en su lugar (translate 0) cuando la lista llega a su top y de ahí en adelante.
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
        const centrar = (grupo, margen = MARGEN) => {
          const c = (h) => Math.max(margen, Math.round((h - grupo) / 2))
          const arriba = c(alto)
          return arriba + grupo > window.innerHeight ? c(window.innerHeight) : arriba
        }
        // ¿Entra con MARGEN arriba y abajo? Con el alto cacheado: en celular la barra del navegador no cambia el modo en
        // pleno gesto. Los altos no dependen del modo (el ancho de las columnas no cambia), así que no oscila.
        const entra = (grupo, margen = MARGEN) => grupo + 2 * margen <= alto
        seccion?.toggleAttribute('data-hitos-libres', !entra(lista))
        // Debajo de lg: título + párrafo + lista juntos si entran (en lg el párrafo va al lado de la lista y el trío es
        // la lista sola). El hueco es el margen de arriba del bloque de la lista, que colapsa con el de la lista.
        const trio =
          !escritorio.matches && alineado && titulo
            ? alineado.offsetHeight +
              Math.max(parseFloat(getComputedStyle(bloque).marginTop) || 0, parseFloat(getComputedStyle(el).marginTop) || 0) +
              lista
            : 0
        const enTrio = trio > 0 && !reduce.matches && entra(trio, MARGEN_TRIO)
        if (seccion) {
          if (enTrio) seccion.dataset.obra = 'trio'
          else delete seccion.dataset.obra
        }
        if (enTrio) seccion?.style.setProperty('--cola', `${trio - alineado.offsetHeight}px`)
        else seccion?.style.removeProperty('--cola')
        const top = enTrio ? centrar(trio, MARGEN_TRIO) : centrar(lista)
        fijo.style.top = `${enTrio ? top + trio - lista : top}px`
        if (alineado) {
          alineado.style.top = `${top}px`
          // El párrafo enganchado (lg) se suelta junto con la lista: su bloque contenedor es su área de la grilla
          // (lista más recorrido), así que sin esto seguiría enganchado hasta que su propio borde de abajo llegue al
          // final, o sea (alto lista - alto párrafo) px de más. Solo mientras es sticky: suelto, un alto mínimo lo
          // estiraría.
          // Solo en lg: ahí el envoltorio está al lado de la lista y sin este alto mínimo seguiría enganchado
          // (alto lista - alto párrafo) px de más. En el trío de celular va arriba de la lista y estirarlo rompería
          // la medida del propio trío (se hacía y deshacía solo).
          alineado.style.minHeight =
            escritorio.matches && getComputedStyle(alineado).position === 'sticky' ? `${lista}px` : ''
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
      if (alineado) alineado.style.top = ''
      seccion?.removeAttribute('data-hitos-libres')
      if (seccion) delete seccion.dataset.obra
      seccion?.style.removeProperty('--cola')
    }
  }, [lista, bloqueRef, fijoRef, alineadoRef, tituloRef, parrafoRef])

  return activo
}
