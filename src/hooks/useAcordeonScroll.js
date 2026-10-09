import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { hayDeslizamientos } from './deslizarAparicion.js'
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
// ms sin eventos de scroll para dar el scroll por terminado (y cerrar las bandas que quedaron arriba). Con el dedo,
// más: la cola de la deceleración de iOS y el rebote del final de página (~400 ms) mueven la página con subpíxeles o sin
// disparar scroll, y la corrección tiene que salir después.
const QUIETO = 200
const QUIETO_DEDO = 450
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
// Anclaje de scroll del navegador (Chrome y Firefox): cuando algo de arriba de la pantalla cambia de alto, el navegador
// corre el scroll solo y lo que se ve no se mueve. Safari no lo tiene: ahí la corrección la hace el hook
// (mantenerEnPantalla) y, si se hace con el scroll en marcha (inercia, que en iOS corre fuera del hilo principal, o el
// dedo apoyado), el scrollTo pelea con el gesto y se ve un tirón. Sin anclaje, las bandas de arriba se cierran recién
// con el scroll quieto y el dedo levantado (el desarrollador lo vio en su iPhone el 30/09/2026).
const CON_ANCLAJE = typeof CSS !== 'undefined' && CSS.supports('overflow-anchor', 'auto')
// iOS y iPadOS (Safari y los demás navegadores de iOS, que usan WebKit): -webkit-touch-callout solo existe ahí. En iOS el
// scroll del dedo es asíncrono (lo lleva el proceso de UI), así que el camino de Safari sigue valiendo aunque algún día
// tenga anclaje: sin esto, el mismo día que Safari lo sumara se apagarían de golpe todas las protecciones del iPhone
// (revisión del 30/09/2026).
const ES_IOS = typeof CSS !== 'undefined' && CSS.supports('-webkit-touch-callout', 'none')
// Camino de Safari: cierres con el scroll quieto o al volver a tocar, espera del dedo, guardia del cuadro fantasma y
// aparición al abrir por scroll con el dedo.
const CAMINO_SAFARI = !CON_ANCLAJE || ES_IOS
// px/ms a partir de los cuales la aparición es directa, sin deslizar lo de abajo (un flick de lectura va a 1-3).
const VELOCIDAD_RAPIDA = 3

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
    // Dedo apoyado en la pantalla (touchstart sin touchend): sin anclaje, mientras tanto no se cierra nada.
    let dedo = false
    // Último evento scroll y velocidad del scroll en ese momento (px/ms), para elegir cómo aparece una banda.
    let ultimoScroll = 0
    let yPrevio = 0
    let velocidad = 0
    // Veces seguidas que cerrarPasadas esperó por el dedo: con un touchend perdido (gesto del sistema) se cierra igual.
    let esperasDedo = 0
    // Después de una corrección del hook, la posición que manda el proceso de UI de iOS puede llegar vieja (sin la
    // corrección) un cuadro o dos: esa medida se saltea y se repite (ver medir).
    let sospechosa = null

    const medirAlto = () => {
      if (!alto || !sinHover || window.innerWidth !== ancho) alto = window.innerHeight
      ancho = window.innerWidth
    }
    const bandas = () => [...ul.children]
    // Posición de la cabecera: el borde de arriba de su <li>, sin el transform de una aparición en curso (lo de debajo de
    // la banda que se abrió baja deslizándose unos 200-300 ms, ver deslizarAparicion): las decisiones se toman con la
    // posición final. Fuera de eso no lee nada más.
    const corrida = (li) => {
      if (!hayDeslizamientos()) return 0
      const t = getComputedStyle(li).transform
      return t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0
    }
    const arriba = (li) => li.getBoundingClientRect().top - corrida(li)
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
    const esperaQuieto = () => (sinHover ? QUIETO_DEDO : QUIETO)
    const cerrarPasadas = () => {
      quieto = 0
      if (plegado || reduce.matches) return
      // Lenis deslizando o dedo apoyado (sin anclaje): se vuelve a esperar. Con el dedo apoyado más de ~2 s se cierra
      // igual (touchend perdido por un gesto del sistema). El rebote del final de iOS no hace falta mirarlo: mientras
      // rebota dispara scroll, así que a esta altura (QUIETO_DEDO sin scroll) ya terminó; un scrollY que sigue pasado del
      // máximo es un margen fijo del navegador y no tiene que frenar el cierre (30/09/2026: con esa condición, en el
      // iPhone las bandas de arriba no se cerraban).
      if (scrollSuaveEnCurso() || (CAMINO_SAFARI && dedo && ++esperasDedo < 5)) {
        window.__acordeonDiag?.('espera', { motivo: dedo ? 'dedo' : 'lenis', veces: esperasDedo })
        quieto = setTimeout(cerrarPasadas, esperaQuieto())
        return
      }
      esperasDedo = 0
      if (activaRef.current < 1) return
      const lis = bandas()
      const cerrar = lis.map((_, i) => i).filter((i) => i < activaRef.current && estado.current[i])
      if (!cerrar.length) return
      const referencia = lis[activaRef.current]
      const fuera = cerrar.filter((i) => panel(lis[i]).getBoundingClientRect().bottom <= 0)
      window.__acordeonDiag?.('reposo', { abiertasArriba: cerrar, fuera })
      if (fuera.length) cerrarFuera(fuera, lis, 'reposo')
      // Con el dedo no se pliega a la vista: las de arriba esperan a quedar fuera de la pantalla.
      const visibles = sinHover ? [] : cerrar.filter((i) => !fuera.includes(i))
      if (visibles.length) plegar(visibles.map((i) => lis[i]), referencia)
    }

    // Cierra al instante las bandas `indices` (enteras por arriba de la pantalla) sin que se mueva lo que se ve.
    const cerrarFuera = (indices, lis, motivo = 'scroll') => {
      const referencia = lis[activaRef.current]
      const topAntes = referencia.getBoundingClientRect().top
      const yAntes = window.scrollY
      const plegadoPx = indices.reduce((suma, i) => suma + alto0(panel(lis[i])), 0)
      // Con una función y no con un valor armado con estado.current: si React tiene pendiente la apertura de la banda
      // nueva (medir la pide con setAbiertos dentro de un rAF y React la renderiza en otra tarea) y en ese intervalo llega
      // un toque (alTocar), un valor viejo la pisaba y la banda quedaba salteada (revisión del 30/09/2026).
      sinAnimar(
        (a) => a.map((v, i) => (indices.includes(i) ? false : v)),
        indices.map((i) => lis[i]),
      )
      const movido = mantenerEnPantalla(referencia, topAntes, yAntes)
      window.__acordeonDiag?.('cierra', { bandas: indices, motivo, plegado: Math.round(plegadoPx), corregido: Math.round(movido) })
      // scrollY ya está corregido (WebKit lo aplica sincrónico); lo que puede llegar viejo es el próximo evento scroll.
      if (CAMINO_SAFARI && sinHover) sospechosa = { y: window.scrollY, h: plegadoPx, hasta: performance.now() + 100 }
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
        const indices = bandas().flatMap((li, i) => (cerradas.has(li) ? [i] : []))
        flushSync(() => setAbiertos((a) => a.map((v, i) => (indices.includes(i) ? false : v))))
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
      // Cuadro fantasma (iOS, solo sin anclaje): la posición que llega del proceso de UI justo después de una corrección
      // puede ser la de antes de corregir, unos H px más abajo con el DOM ya plegado; con ella se abriría una banda de
      // más o se cerraría la que se está leyendo. Se saltea y se repite en 50 ms.
      if (sospechosa) {
        if (performance.now() > sospechosa.hasta) sospechosa = null
        else if (Math.abs(window.scrollY - sospechosa.y) > sospechosa.h * 0.8) {
          window.__acordeonDiag?.('fantasma', { y: Math.round(window.scrollY), esperado: Math.round(sospechosa.y) })
          setTimeout(pedir, 50)
          return
        }
      }
      // Rebote del final del documento (iOS): el scroll pasa del máximo y vuelve, y mientras tanto las cabeceras están
      // más arriba de lo que van a quedar; se miden como si el scroll estuviera en el máximo, así el rebote no cambia
      // la banda activa. En Chrome el scroll nunca pasa del máximo: da 0.
      const rebote = Math.max(0, window.scrollY - (document.documentElement.scrollHeight - window.innerHeight))
      // Cabeceras en su posición final (con los paneles de arriba ya abiertos o cerrados del todo).
      let corrimiento = rebote
      const tops = bandas().map((li, i) => {
        const top = arriba(li) + corrimiento
        const p = panel(li)
        corrimiento += (estado.current[i] ? p.firstElementChild.scrollHeight : 0) - alto0(p)
        return top
      })
      // Al pasar por una banda cerrada que se va a abrir, las de abajo se evalúan con lo que va a crecer (extra): si en un
      // mismo cuadro cruzaban la línea dos cabeceras cerradas (~60 px entre sí en el celular: un flick de iPhone lo hace),
      // la activa saltaba dos y la del medio no se abría nunca (revisión del 30/09/2026; ya pasaba antes).
      let nueva = activaRef.current
      let extra = 0
      const lisMedir = bandas()
      while (nueva + 1 < cantidad && tops[nueva + 1] + extra <= alto * ABRIR) {
        nueva++
        if (!estado.current[nueva]) extra += panel(lisMedir[nueva]).firstElementChild.scrollHeight
      }
      while (nueva >= 0 && tops[nueva] > alto * CERRAR) nueva--
      // Al final de la página ya no queda scroll para que la última cabecera llegue a la línea (debajo de ella solo está
      // el footer, más bajo que el 40 % de la pantalla): ahí la activa es la última banda que se ve. Sin esto, la última
      // banda no se abría nunca en el celular (22/09/2026). El final se mide contra el largo FINAL del documento: mientras
      // un panel crece (1 s), el scroll toca el máximo de ahora sin estar al final de verdad, y con el máximo de ahora un
      // flick fuerte abría la última banda salteándose las del medio (medido en Chrome: Ciencia -> Forma Lab directo;
      // 30/09/2026). Al terminar la transición se vuelve a medir (alTerminarTransicion), por si la página quedó quieta.
      const pendiente = Math.max(0, corrimiento - rebote)
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight + pendiente + extra - 2) {
        const ultima = tops.reduce((acc, top, i) => (top <= alto ? i : acc), -1)
        if (ultima > nueva) nueva = ultima
      }
      if (nueva !== activaRef.current) {
        const bajando = nueva > activaRef.current
        window.__acordeonDiag?.('activa', { de: activaRef.current, a: nueva, bajando })
        activaRef.current = nueva
        // Bajando se abre la nueva y se cierran las de abajo; las de arriba, cuando salen de la pantalla o al frenar.
        // Subiendo no se toca nada.
        if (bajando) {
          // Aparición (iPhone: sin anclaje y con el dedo): la banda nueva toma su alto de una vez y solo el texto y la
          // foto aparecen subiendo, en vez de crecer durante 1 s. Creciendo, el final del documento avanzaba de a poco
          // justo cuando un flick llegaba a él, y en iOS eso es un rebote en cada cambio de banda; y el crecimiento
          // necesita al hilo principal en cada cuadro. El desarrollador la vio "tosca, como tildada" y eligió esta
          // opción el 30/09/2026 (se probó también mover con transform lo de abajo: fluido, pero dejaba fondo vacío
          // debajo del pie si el flick llegaba al final durante la apertura). Android, escritorio y los clics siguen
          // animando el alto, como estaba aprobado.
          // Solo si estaba cerrada: si ya estaba abierta (un clic) Banda no vuelve a renderizar y la marca quedaría puesta.
          const aparicion = CAMINO_SAFARI && sinHover && !estado.current[nueva]
          // Con un flick rápido la aparición es directa (ver deslizarAparicion).
          const rapida = performance.now() - ultimoScroll < 100 && velocidad > VELOCIDAD_RAPIDA
          for (const li of bandas()) li.removeAttribute('data-aparicion')
          if (aparicion) bandas()[nueva]?.setAttribute('data-aparicion', rapida ? 'rapida' : '')
          window.__acordeonDiag?.('abre', {
            banda: nueva,
            modo: aparicion ? (rapida ? 'aparición directa' : 'aparición') : 'alto',
            velocidad: Math.round(velocidad * 10) / 10,
          })
          setAbiertos((a) => a.map((v, i) => (i === nueva ? true : i > nueva ? false : v)))
        }
      }
      // Las de arriba de la activa que ya quedaron enteras fuera de la pantalla se cierran ya, sin esperar a que frene:
      // solo fuera del camino de Safari (ver CAMINO_SAFARI); ahí esperan al scroll quieto o al próximo toque.
      if (!CAMINO_SAFARI && activaRef.current >= 1 && !plegado) {
        const lis = bandas()
        const fuera = lis
          .map((_, i) => i)
          .filter((i) => i < activaRef.current && estado.current[i] && panel(lis[i]).getBoundingClientRect().bottom <= 0)
        if (fuera.length) cerrarFuera(fuera, lis)
      }
      clearTimeout(quieto)
      quieto = setTimeout(cerrarPasadas, esperaQuieto())
    }
    const pedir = () => {
      if (!pedido) pedido = requestAnimationFrame(medir)
    }
    const alGesto = () => {
      gesto = true
    }
    const alApoyar = () => {
      dedo = true
    }
    // Sin anclaje (Safari), además de con el scroll quieto, las bandas de arriba que ya están enteras fuera de la pantalla
    // se cierran cuando el dedo vuelve a tocar el vidrio: ese toque ya frenó la inercia del flick anterior y el gesto
    // nuevo todavía no empezó a mover la página, así que la corrección no pelea con nada. Sin esto, leyendo con flicks
    // seguidos nunca había 450 ms de quietud y las de arriba quedaban abiertas (lo vio el desarrollador en el iPhone el
    // 30/09/2026). Con anclaje no hace falta: se cierran en pleno scroll (medir).
    const alTocar = () => {
      dedo = true
      if (!CAMINO_SAFARI || plegado || reduce.matches || !escuchando || !gesto || activaRef.current < 1) return
      // También en el final de la página. Hasta el 30/09 a la tarde ahí no se cerraba al tocar (si el toque llega durante
      // el rebote de iOS, la corrección lo corta: los px que estaba pasado del final desaparecen de golpe, unos pocos),
      // y con un flick hasta el final y un toque para volver a subir las bandas de arriba no se cerraban nunca, porque al
      // subir ya estaban otra vez a la vista: el desarrollador vio que solo se había cerrado Ciencia. Se prefiere cerrar.
      const lis = bandas()
      const fuera = lis
        .map((_, i) => i)
        .filter((i) => i < activaRef.current && estado.current[i] && panel(lis[i]).getBoundingClientRect().bottom <= 0)
      if (fuera.length) cerrarFuera(fuera, lis, 'toque')
    }
    const alLevantar = () => {
      dedo = false
      esperasDedo = 0
      // Si el scroll ya estaba quieto con el dedo apoyado, el cierre pendiente sale ahora.
      if (CAMINO_SAFARI && !quieto && escuchando && !reduce.matches) quieto = setTimeout(cerrarPasadas, esperaQuieto())
    }
    // Al terminar (o cancelarse) la transición de un panel se vuelve a medir: si la página quedó quieta en el máximo
    // mientras el panel crecía no llega ningún scroll y la regla del final de página no se volvería a evaluar.
    const alTerminarTransicion = (e) => {
      if (e.propertyName === 'grid-template-rows') pedir()
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
    // La barra del navegador móvil cambia solo el alto (y menos de 200 px): con el alto cacheado no hay nada que
    // remedir, y remedirlo igual costaba layouts forzados en pleno gesto (ver Compatibilidad entre navegadores).
    const alRedimensionar = () => {
      if (sinHover && alto && window.innerWidth === ancho && Math.abs(window.innerHeight - alto) <= 200) return
      pedir()
    }
    const alScroll = () => {
      const ahora = performance.now()
      const y = window.scrollY
      velocidad = ahora - ultimoScroll < 100 ? Math.abs(y - yPrevio) / Math.max(1, ahora - ultimoScroll) : 0
      ultimoScroll = ahora
      yPrevio = y
      pedir()
    }
    const escuchar = (si) => {
      const metodo = si ? 'addEventListener' : 'removeEventListener'
      window[metodo]('scroll', alScroll, { passive: true })
      window[metodo]('resize', alRedimensionar)
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
    // touchmove también apoya el dedo: iOS puede mandar touchcancel al tomar el gesto y nunca touchend.
    window.addEventListener('touchstart', alTocar, { passive: true })
    window.addEventListener('touchmove', alApoyar, { passive: true })
    window.addEventListener('touchend', alLevantar, { passive: true })
    window.addEventListener('touchcancel', alLevantar, { passive: true })
    ul.addEventListener('transitionend', alTerminarTransicion)
    ul.addEventListener('transitioncancel', alTerminarTransicion)
    if (document.readyState === 'complete') alCargar()
    else window.addEventListener('load', alCargar, { once: true })
    if (reduce.matches) setAbiertos(Array(cantidad).fill(true))

    return () => {
      observador.disconnect()
      reduce.removeEventListener('change', alCambiarMovimiento)
      for (const evento of GESTOS) window.removeEventListener(evento, alGesto)
      window.removeEventListener('touchstart', alTocar)
      window.removeEventListener('touchmove', alApoyar)
      window.removeEventListener('touchend', alLevantar)
      window.removeEventListener('touchcancel', alLevantar)
      ul.removeEventListener('transitionend', alTerminarTransicion)
      ul.removeEventListener('transitioncancel', alTerminarTransicion)
      window.removeEventListener('load', alCargar)
      clearTimeout(temporizador)
      clearTimeout(quieto)
      if (plegado) plegado.terminar()
      if (escuchando) escuchar(false)
      cancelAnimationFrame(pedido)
      cancelAnimationFrame(limpiar)
      delete ul.dataset.directo
      for (const li of ul.children) {
        delete li.dataset.directo
        li.removeAttribute('data-aparicion')
      }
    }
  }, [lista, cantidad])

  return { abiertos, alternar, cerca }
}
