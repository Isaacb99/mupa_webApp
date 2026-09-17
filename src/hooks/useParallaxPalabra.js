import { useEffect } from 'react'

// Mueve una palabra con el scroll para que "baje" de fila en fila junto a otras líneas fijas.
// Solo escribe transform (sin layout), lee el DOM una vez por frame y se apaga con prefers-reduced-motion.
//
// refs.palabra  -> el span que se mueve (vive en la primera fila).
// refs.primera  -> la línea fija de la primera fila (referencia de arriba).
// refs.ultima   -> la línea fija de la última fila (referencia de abajo).
// refs.bloque   -> el contenedor del titular (define cuándo empieza y termina el recorrido).

function suavizar(t) {
  return t * t * (3 - 2 * t)
}

// Progreso 0..1 con mesetas en cada parada, para que cada frase se lea un rato antes de seguir.
export function conMesetas(p, paradas, meseta = 0.25) {
  const tramos = paradas - 1
  const tramo = Math.min(Math.floor(p * tramos), tramos - 1)
  const t = p * tramos - tramo
  const u = Math.min(Math.max((t - meseta) / (1 - 2 * meseta), 0), 1)
  return (tramo + suavizar(u)) / tramos
}

export default function useParallaxPalabra(refs, { paradas = 3, activo = true } = {}) {
  useEffect(() => {
    const { palabra, primera, ultima, bloque } = refs
    if (!activo || !palabra.current || !primera.current || !ultima.current || !bloque.current) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let recorrido = 0 // px que baja la palabra entre la primera y la última fila
    let visible = true
    let pedido = 0

    const medir = () => {
      recorrido = ultima.current.getBoundingClientRect().top - primera.current.getBoundingClientRect().top
    }

    // Progreso 0..1 según dónde está el bloque en el viewport. Se calcula en cada frame (es barato) para que
    // un cambio de alto por encima del titular, por ejemplo una imagen que carga tarde, no desfase el recorrido.
    const progreso = (top) => {
      const alto = window.innerHeight
      // Empieza cuando el bloque entra por el 80 % del alto; si ya estaba a la vista al cargar, desde donde está.
      const inicio = Math.min(alto * 0.8, top + window.scrollY)
      // Termina medio viewport más arriba, sin pasar del 15 % (por debajo del header fijo).
      const fin = Math.max(inicio - alto * 0.5, alto * 0.15)
      if (inicio <= fin) return 1
      return Math.min(Math.max((inicio - top) / (inicio - fin), 0), 1)
    }

    const pintar = () => {
      pedido = 0
      if (reduce.matches) {
        palabra.current.style.transform = ''
        return
      }
      const p = progreso(bloque.current.getBoundingClientRect().top)
      const y = conMesetas(p, paradas) * recorrido
      palabra.current.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
    }

    const pedir = () => {
      if (!visible || pedido) return
      pedido = requestAnimationFrame(pintar)
    }

    const remedir = () => {
      medir()
      pedir()
    }

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        pedir()
      },
      { rootMargin: '50% 0px' },
    )
    io.observe(bloque.current)

    const ro = new ResizeObserver(remedir)
    ro.observe(bloque.current)

    window.addEventListener('scroll', pedir, { passive: true })
    window.addEventListener('resize', remedir)
    reduce.addEventListener('change', remedir)
    document.fonts?.ready.then(remedir)
    remedir()

    return () => {
      if (pedido) cancelAnimationFrame(pedido)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', pedir)
      window.removeEventListener('resize', remedir)
      reduce.removeEventListener('change', remedir)
      if (palabra.current) palabra.current.style.transform = ''
    }
  }, [refs, paradas, activo])
}
