import { useEffect, useState } from 'react'

// true desde que el elemento llega al 80 % del alto de la pantalla. Por defecto una sola vez (el remate de Áreas); con
// `reversible` vuelve a false si el scroll lo baja de esa línea otra vez (el párrafo de la intro: "si el scroll sube,
// vuelve a desaparecer", pedido del desarrollador el 21/09/2026). Si la página carga con el elemento ya pasado (recarga a
// mitad de página, ancla), aparece de una. El scroll cubre lo que el IntersectionObserver no avisa: un salto desde lejos
// que pasa por encima del elemento en un solo frame (Fin, ancla) no cruza el umbral y no dispara el observador.
export default function useAparecer(ref, { reversible = false } = {}) {
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
      poner(el.getBoundingClientRect().top < window.innerHeight * 0.8)
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        const e = entradas[entradas.length - 1]
        poner(e.isIntersecting || e.boundingClientRect.top < 0)
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    observador.observe(el)
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => {
      cerrado = true
      observador.disconnect()
      window.removeEventListener('scroll', alScroll)
    }
  }, [ref, reversible])

  return visible
}
