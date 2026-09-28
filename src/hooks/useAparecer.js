import { useEffect, useState } from 'react'

// true desde que el elemento llega a `linea` (fracción del alto de la pantalla; 0,8 por defecto). El párrafo de la
// intro usa 1: aparece apenas entra en pantalla, para estar arriba antes de que la palabra del titular llegue a "hecho
// por" (pedido del desarrollador el 25/09/2026, con el titular de dos filas del V03). Por defecto una sola vez (el remate de Áreas); con
// `reversible` vuelve a false si el scroll lo baja de esa línea otra vez (el párrafo de la intro: "si el scroll sube,
// vuelve a desaparecer", pedido del desarrollador el 21/09/2026). Si la página carga con el elemento ya pasado (recarga a
// mitad de página, ancla), aparece de una. El scroll cubre lo que el IntersectionObserver no avisa: un salto desde lejos
// que pasa por encima del elemento en un solo frame (Fin, ancla) no cruza el umbral y no dispara el observador.
export default function useAparecer(ref, { reversible = false, linea = 0.8 } = {}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let estado = false
    let cerrado = false
    const poner = (si) => {
      if (cerrado || si === estado) return
      estado = si
      setVisible(si)
      if (si && !reversible) {
        cerrado = true
        observador.disconnect()
        window.removeEventListener('scroll', alScroll)
      }
    }
    const alScroll = () => {
      poner(el.getBoundingClientRect().top < window.innerHeight * linea)
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        const e = entradas[entradas.length - 1]
        poner(e.isIntersecting || e.boundingClientRect.top < 0)
      },
      { rootMargin: `0px 0px ${-(1 - linea) * 100}% 0px` },
    )
    observador.observe(el)
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => {
      cerrado = true
      observador.disconnect()
      window.removeEventListener('scroll', alScroll)
    }
  }, [ref, reversible, linea])

  return visible
}
