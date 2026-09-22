import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { mantenerEnPantalla, scrollSuaveEnCurso } from './useScrollSuave.js'

// Líneas de lectura (fracción del alto de la pantalla, desde arriba): una banda pasa a ser la activa cuando su cabecera
// sube por encima de ABRIR y deja de serlo cuando vuelve a bajar por debajo de CERRAR. La diferencia es la histéresis:
// entre las dos líneas no cambia, así no titila.
const ABRIR = 0.6
const CERRAR = 0.7
// Como en useScrollPorPasos: hasta el primer gesto de la persona (o 1 s después de load) el scroll es del navegador
// (restauración al recargar) y el estado se pinta directo, sin animar.
const GESTOS = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown']
const ESPERA_CARGA = 1000
// ms sin eventos de scroll para dar el scroll por terminado (y cerrar las bandas que quedaron arriba).
const QUIETO = 200
// ms que tarda en plegarse a la vista la banda de arriba: con el dedo, más lento (el panel mide ~1000 px en un celular y
// a 550 ms se sentía brusco; pedido del desarrollador, 22/09/2026).
const PLEGADO = 550
const PLEGADO_DEDO = 1000
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
// Para el alto, una curva de seno: llega a 1,57 veces la velocidad media en el medio del plegado, contra 2 de la cúbica
// (con un panel de ~1000 px en el celular, eso es lo que se sentía brusco).
const suaveAlto = (t) => (1 - Math.cos(Math.PI * t)) / 2
// Gestos que terminan de golpe un plegado en curso (sin touchmove: el touchstart ya lo cortó).
const CORTAN_PLEGADO = ['wheel', 'touchstart', 'keydown', 'pointerdown']

// Acordeón que se abre con el scroll (pedidos del desarrollador del 22/09/2026: "que a medida que se haga scroll se vayan
// abriendo" y después "que cuando ya pasó a la siguiente card la de arriba se cierre, así queda abierta solo la que
// estás navegando"). `lista` es un <ul> cuyos <li> tienen [data-panel] (con el contenido dentro de un envoltorio). La
// banda activa es la última cuya cabecera (el borde de arriba de su <li>) pasó ABRIR (con histéresis):
// - Bajando, al cambiar de activa se abre la nueva (animada, debajo de la línea). La anterior se cierra:
//   · Con el scroll en marcha, en cuanto queda entera por arriba de la pantalla: al instante y corrigiendo el scroll en
//     el mismo frame, así no se ve nada (mantenerEnPantalla: el anclaje de scroll del navegador o, si no, el hook; en
//     los dos casos corre también la animación en curso de Lenis, que si no devolvía la página ~1000 px y se salteaba
//     una banda, Educación -> Forma Lab, 22/09/2026). También con el dedo: el desarrollador pidió el 22/09/2026 el mismo
//     criterio que en escritorio, "que se cierre cuando la pantalla pase en su totalidad a la banda de abajo".
//   · Con puntero fino, si el scroll se detiene mientras todavía se ve, se pliega a la vista (PLEGADO ms) con la banda
//     activa clavada en su lugar: el alto del panel lo lleva este hook cuadro a cuadro y en el mismo cuadro corrige el
//     scroll, así no hay un frame de atraso; un gesto a mitad del plegado lo termina de golpe. Con el dedo no se pliega
//     nunca a la vista: con el dedo apoyado en la pantalla se veía raro.
// - Subiendo, el scroll no abre ni cierra nada (pedido del desarrollador el 22/09/2026: las cerradas volvían a abrirse
//   al subir; "que queden cerradas y si el usuario quiere volver a abrirlas, que haga clic"). La activa igual sigue la
//   posición, así al volver a bajar se abre la que llega.
// - Bajando, al cambiar de activa se cierran también las de abajo de la nueva (animadas: están debajo de la línea).
// - El clic abre y cierra cualquiera en cualquier momento. La que se abre con un clic pasa a ser la activa (la que se
//   está leyendo) y se cierran las de abajo; si no, el cierre automático la tomaba como "una de arriba de la activa" y la
//   volvía a plegar enseguida, corrigiendo el scroll para dejar quieta a la activa vieja, que la apertura había empujado
//   fuera de la pantalla: la página se iba al principio de la sección (22/09/2026).
// Pinta directo (sin animar, con data-directo) en la primera medida, al acercarse la lista a la pantalla (saltos desde
// lejos: Fin, ancla, recarga) y antes del primer gesto. Con reduced-motion, todas abiertas y sin scroll. Devuelve el
// estado, la función del clic y si la lista está cerca de la pantalla (para cargar las fotos).
export default function useAcordeonScroll(lista, cantidad) {
  const [abiertos, setAbiertos] = useState(() => Array(cantidad).fill(false))
  const [cerca, setCerca] = useState(false)
  const estado = useRef(abiertos)
  estado.current = abiertos
  // Índice de la banda activa (-1: ninguna). En un ref porque la cambian el scroll (el efecto) y el clic.
  const activaRef = useRef(-1)

  const alternar = useCallback(
    (i) =>
      setAbiertos((a) => {
        if (a[i]) return a.map((v, j) => (j === i ? false : v))
        activaRef.current = i
        return a.map((v, j) => (j === i ? true : j > i ? false : v))
      }),
    [],
  )

  useEffect(() => {
    const ul = lista.current
    if (!ul) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    // Sin hover (celular) la barra del navegador cambia el alto en pleno gesto: el alto cacheado solo se actualiza si
    // cambia el ancho (giro), como en el motor, así las líneas no se corren.
    const sinHover = matchMedia('(hover: none)').matches
    let alto = 0
    let ancho = 0
    let pedido = 0
    let limpiar = 0
    let quieto = 0
    let primera = true
    let entrando = true
    let gesto = false
    let temporizador = 0
    let escuchando = false
    let plegado = null

    const medirAlto = () => {
      if (!alto || !sinHover || window.innerWidth !== ancho) alto = window.innerHeight
      ancho = window.innerWidth
    }
    const bandas = () => [...ul.children]
    // Posición de la cabecera: el borde de arriba de su <li>.
    const arriba = (li) => li.getBoundingClientRect().top
    const panel = (li) => li.querySelector('[data-panel]')
    const alto0 = (el) => (el ? el.getBoundingClientRect().height : 0)

    // Aplica un estado sin animar (data-directo en la lista, o solo en los <li> indicados).
    const sinAnimar = (nuevos, nodos = [ul]) => {
      for (const n of nodos) n.dataset.directo = ''
      flushSync(() => setAbiertos(nuevos))
      cancelAnimationFrame(limpiar)
      limpiar = requestAnimationFrame(() => {
        limpiar = requestAnimationFrame(() => {
          for (const n of nodos) delete n.dataset.directo
        })
      })
    }

    // Todas las bandas de una vez: la activa es la última cuya cabecera queda por encima de ABRIR con las de arriba
    // cerradas (su posición menos el alto actual de los paneles de arriba); solo ella queda abierta.
    const directo = () => {
      let corrimiento = 0
      activaRef.current = -1
      bandas().forEach((li, i) => {
        if (arriba(li) + corrimiento <= alto * ABRIR) activaRef.current = i
        corrimiento -= alto0(panel(li))
      })
      sinAnimar(Array.from({ length: cantidad }, (_, i) => i === activaRef.current))
    }

    // Con el scroll quieto, cierra las bandas de arriba de la activa que siguen abiertas: plegándolas a la vista, con la
    // cabecera activa quieta, o al instante si ya estaban enteras por arriba de la pantalla.
    const cerrarPasadas = () => {
      quieto = 0
      if (plegado) return
      if (scrollSuaveEnCurso()) {
        quieto = setTimeout(cerrarPasadas, QUIETO)
        return
      }
      if (activaRef.current < 1) return
      const lis = bandas()
      const cerrar = lis.map((_, i) => i).filter((i) => i < activaRef.current && estado.current[i])
      if (!cerrar.length) return
      const referencia = lis[activaRef.current]
      const fuera = cerrar.filter((i) => panel(lis[i]).getBoundingClientRect().bottom <= 0)
      if (fuera.length) cerrarFuera(fuera, lis)
      // Con el dedo no se pliega a la vista: las de arriba esperan a quedar fuera de la pantalla.
      const visibles = sinHover ? [] : cerrar.filter((i) => !fuera.includes(i))
      if (visibles.length) plegar(visibles.map((i) => lis[i]), referencia)
    }

    // Cierra al instante las bandas `indices` (enteras por arriba de la pantalla) sin que se mueva lo que se ve.
    const cerrarFuera = (indices, lis) => {
      const referencia = lis[activaRef.current]
      const topAntes = referencia.getBoundingClientRect().top
      const yAntes = window.scrollY
      sinAnimar(
        estado.current.map((v, i) => (indices.includes(i) ? false : v)),
        indices.map((i) => lis[i]),
      )
      mantenerEnPantalla(referencia, topAntes, yAntes)
    }

    // Pliega a la vista las bandas `lis` (abiertas, arriba de la activa): alto del panel de su valor a 0 y
    // el contenido que se desvanece, cuadro a cuadro, corrigiendo el scroll en el mismo cuadro para que `referencia` (el
    // <li> de la banda activa) no se mueva. Al terminar pasa el estado a cerradas sin animar y saca los estilos en línea.
    const plegar = (lis, referencia) => {
      const partes = lis.map((li) => {
        li.dataset.directo = ''
        // Que el anclaje de scroll del navegador no elija algo de la banda que se pliega (la corrección es nuestra).
        li.style.overflowAnchor = 'none'
        const p = panel(li)
        return { li, p, contenido: p.firstElementChild, alto: alto0(p) }
      })
      const donde = referencia.getBoundingClientRect().top
      const inicio = performance.now()
      const duracion = sinHover ? PLEGADO_DEDO : PLEGADO
      // El contenido se desvanece en los primeros dos tercios, antes de que el panel termine de plegarse: así el alto que
      // se va no arrastra texto a la vista y el cierre se siente más suave.
      const aplicar = (t) => {
        const yAntes = window.scrollY
        const alturas = suaveAlto(t)
        const fundido = 1 - suave(Math.min(t * 1.5, 1))
        for (const { p, contenido, alto: h } of partes) {
          p.style.height = `${h * (1 - alturas)}px`
          contenido.style.opacity = String(fundido)
        }
        mantenerEnPantalla(referencia, donde, yAntes)
      }
      // Al terminar por un gesto, en el evento solo se deja el alto final y el scroll corregido; el cambio de estado de
      // React y la limpieza van en el frame siguiente, así el toque no espera un render (medido: con todo junto, la
      // página iba ~160-210 ms en contra del dedo).
      const terminar = (e) => {
        if (!plegado) return
        cancelAnimationFrame(plegado.cuadro)
        for (const g of CORTAN_PLEGADO) window.removeEventListener(g, terminar)
        aplicar(1)
        if (e?.type) {
          plegado.cuadro = requestAnimationFrame(cerrarEstado)
          return
        }
        cerrarEstado()
      }
      const cerrarEstado = () => {
        const cerradas = new Set(partes.map((x) => x.li))
        const antes = referencia.getBoundingClientRect().top
        const yAntes = window.scrollY
        flushSync(() => setAbiertos(bandas().map((li, i) => (cerradas.has(li) ? false : estado.current[i]))))
        for (const { li, p, contenido } of partes) {
          p.style.height = ''
          contenido.style.opacity = ''
          li.style.overflowAnchor = ''
          requestAnimationFrame(() => requestAnimationFrame(() => delete li.dataset.directo))
        }
        mantenerEnPantalla(referencia, antes, yAntes)
        plegado = null
      }
      const cuadro = (ahora) => {
        const t = Math.min((ahora - inicio) / duracion, 1)
        if (t >= 1) {
          terminar()
          return
        }
        aplicar(t)
        plegado.cuadro = requestAnimationFrame(cuadro)
      }
      plegado = { cuadro: requestAnimationFrame(cuadro), terminar }
      for (const g of CORTAN_PLEGADO) window.addEventListener(g, terminar, { passive: true, once: true })
    }

    const medir = () => {
      pedido = 0
      if (reduce.matches) return
      medirAlto()
      if (primera || entrando || !gesto) {
        primera = false
        entrando = false
        directo()
        return
      }
      // Cabeceras en su posición final (con los paneles de arriba ya abiertos o cerrados del todo).
      let corrimiento = 0
      const tops = bandas().map((li, i) => {
        const top = arriba(li) + corrimiento
        const p = panel(li)
        corrimiento += (estado.current[i] ? p.firstElementChild.scrollHeight : 0) - alto0(p)
        return top
      })
      let nueva = activaRef.current
      while (nueva + 1 < cantidad && tops[nueva + 1] <= alto * ABRIR) nueva++
      while (nueva >= 0 && tops[nueva] > alto * CERRAR) nueva--
      // Al final de la página ya no queda scroll para que la última cabecera llegue a la línea (debajo de ella solo está
      // el footer, más bajo que el 40 % de la pantalla): ahí la activa es la última banda que se ve. Sin esto, la última
      // banda no se abría nunca en el celular (22/09/2026).
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        const ultima = tops.reduce((acc, top, i) => (top <= alto ? i : acc), -1)
        if (ultima > nueva) nueva = ultima
      }
      if (nueva !== activaRef.current) {
        const bajando = nueva > activaRef.current
        activaRef.current = nueva
        // Bajando se abre la nueva y se cierran las de abajo; las de arriba, cuando salen de la pantalla o al frenar.
        // Subiendo no se toca nada.
        if (bajando) setAbiertos((a) => a.map((v, i) => (i === nueva ? true : i > nueva ? false : v)))
      }
      // Las de arriba de la activa que ya quedaron enteras fuera de la pantalla se cierran ya, sin esperar a que frene.
      if (activaRef.current >= 1 && !plegado) {
        const lis = bandas()
        const fuera = lis
          .map((_, i) => i)
          .filter((i) => i < activaRef.current && estado.current[i] && panel(lis[i]).getBoundingClientRect().bottom <= 0)
        if (fuera.length) cerrarFuera(fuera, lis)
      }
      clearTimeout(quieto)
      quieto = setTimeout(cerrarPasadas, QUIETO)
    }
    const pedir = () => {
      if (!pedido) pedido = requestAnimationFrame(medir)
    }
    const alGesto = () => {
      gesto = true
    }
    const alCargar = () => {
      temporizador = setTimeout(alGesto, ESPERA_CARGA)
    }
    const alCambiarMovimiento = () => {
      if (reduce.matches) {
        setAbiertos(Array(cantidad).fill(true))
        return
      }
      entrando = true
      pedir()
    }
    const escuchar = (si) => {
      const metodo = si ? 'addEventListener' : 'removeEventListener'
      window[metodo]('scroll', pedir, { passive: true })
      window[metodo]('resize', pedir)
    }

    // Escucha el scroll solo con la lista a menos de una pantalla de distancia; al acercarse, pinta directo.
    const observador = new IntersectionObserver(
      (entradas) => {
        const estaCerca = entradas[entradas.length - 1].isIntersecting
        if (estaCerca) setCerca(true)
        if (estaCerca !== escuchando) {
          escuchando = estaCerca
          escuchar(estaCerca)
          if (estaCerca) {
            entrando = true
            pedir()
          }
        }
      },
      { rootMargin: '100% 0px' },
    )
    observador.observe(ul)
    reduce.addEventListener('change', alCambiarMovimiento)
    for (const evento of GESTOS) window.addEventListener(evento, alGesto, { passive: true })
    if (document.readyState === 'complete') alCargar()
    else window.addEventListener('load', alCargar, { once: true })
    if (reduce.matches) setAbiertos(Array(cantidad).fill(true))

    return () => {
      observador.disconnect()
      reduce.removeEventListener('change', alCambiarMovimiento)
      for (const evento of GESTOS) window.removeEventListener(evento, alGesto)
      window.removeEventListener('load', alCargar)
      clearTimeout(temporizador)
      clearTimeout(quieto)
      if (plegado) plegado.terminar()
      if (escuchando) escuchar(false)
      cancelAnimationFrame(pedido)
      cancelAnimationFrame(limpiar)
      delete ul.dataset.directo
      for (const li of ul.children) delete li.dataset.directo
    }
  }, [lista, cantidad])

  return { abiertos, alternar, cerca }
}
