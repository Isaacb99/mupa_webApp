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
// Con paradas < 2 no hay recorrido; p fuera de 0..1 se recorta.
export function conMesetas(p, paradas, meseta = 0.3) {
  if (!(paradas >= 2)) return 0
  const q = Math.min(Math.max(p, 0), 1)
  const tramos = paradas - 1
  const tramo = Math.min(Math.floor(q * tramos), tramos - 1)
  const t = q * tramos - tramo
  const u = Math.min(Math.max((t - meseta) / (1 - 2 * meseta), 0), 1)
  return (tramo + suavizar(u)) / tramos
}

export default function useParallaxPalabra(refs, { paradas = 3, activo = true } = {}) {
  useEffect(() => {
    const { palabra, primera, ultima, bloque } = refs
    if (!activo || !palabra.current || !primera.current || !ultima.current || !bloque.current) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let cancelado = false
    let recorrido = 0 // px que baja la palabra entre la primera y la última fila
    let alto = 0 // alto del viewport "estable" (ver medir)
    let ancho = 0
    let visible = true
    let pedido = 0

    const medir = () => {
      recorrido = ultima.current.getBoundingClientRect().top - primera.current.getBoundingClientRect().top
      // El alto solo se actualiza si cambió el ancho (rotación, ventana) o si el salto es grande: la barra de
      // direcciones del navegador móvil cambia innerHeight en pleno gesto y haría saltar la palabra.
      const h = window.innerHeight
      if (!alto || window.innerWidth !== ancho || Math.abs(h - alto) > 200) alto = h
      ancho = window.innerWidth
    }

    // Progreso 0..1 según dónde está el bloque en el viewport. Empieza cuando el bloque entra por el 80 % del alto
    // (o desde donde está, si ya era visible al cargar) y dura al menos 480 px de scroll para que cada frase se lea.
    const progreso = (top) => {
      const inicio = Math.min(alto * 0.8, top + window.scrollY)
      const rango = Math.max(alto * 0.6, 480)
      const fin = Math.max(inicio - rango, alto * 0.15)
      if (inicio <= fin) return 1
      return Math.min(Math.max((inicio - top) / (inicio - fin), 0), 1)
    }

    const pintar = () => {
      pedido = 0
      if (cancelado || !palabra.current || !bloque.current) return
      if (reduce.matches) {
        palabra.current.style.transform = ''
        return
      }
      const p = progreso(bloque.current.getBoundingClientRect().top)
      // Redondeado a píxel entero para que el texto no quede desenfocado en las paradas.
      const y = Math.round(conMesetas(p, paradas) * recorrido)
      palabra.current.style.transform = `translate(0, ${y}px)`
    }

    // forzar: pintar aunque el bloque esté fuera de vista (cambios de tamaño, fuentes o reduced-motion).
    const pedir = (forzar = false) => {
      if (pedido || (!visible && !forzar)) return
      pedido = requestAnimationFrame(pintar)
    }
    const alScroll = () => {
      if (!reduce.matches) pedir()
    }
    const remedir = () => {
      if (cancelado) return
      medir()
      pedir(true)
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

    window.addEventListener('scroll', alScroll, { passive: true })
    window.addEventListener('resize', remedir)
    reduce.addEventListener('change', remedir)
    document.fonts?.ready.then(remedir)
    remedir()

    return () => {
      cancelado = true
      if (pedido) cancelAnimationFrame(pedido)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', alScroll)
      window.removeEventListener('resize', remedir)
      reduce.removeEventListener('change', remedir)
      if (palabra.current) palabra.current.style.transform = ''
    }
  }, [refs, paradas, activo])
}
