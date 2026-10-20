// El <h1> de cada pantalla (plan 5.6): pone el título de la pestaña ("Inicio · Panel del MuPa", WCAG 2.4.2) y, cuando
// se llega navegando dentro del panel, recibe el foco, así el lector de pantalla anuncia la pantalla nueva y el Tab
// sigue desde ahí (en una SPA el navegador no lo hace solo). En la primera pantalla de la carga no lo mueve: el
// navegador ya empieza por el principio (y "Ir al contenido" es lo primero del Tab). Toda pantalla (también los
// errores) tiene uno, y uno solo.
// El foco va cuando cambia la ruta, no cuando el componente se monta: dos pantallas que usan el mismo componente
// (las fichas de Novedades y Exposiciones, por ejemplo) también lo reciben, y el doble montaje de StrictMode en
// desarrollo no lo mueve.
// En ese momento la página también vuelve arriba de todo (el panel no usa <ScrollRestoration />: guarda en
// sessionStorage, ver rutas.jsx). Un título con una palabra o una dirección larga corta donde haga falta
// (wrap-anywhere; corrección de E3, 16/10/2026: a 320 px la ficha quedaba con scroll horizontal).
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router'

export const NOMBRE_PANEL = 'Panel del MuPa'

/** La ruta de la última pantalla que se mostró (null: todavía ninguna en esta carga). */
let rutaAnterior = null

/**
 * @param {{ titulo: string, children?: import('react').ReactNode }} props  children: lo que va a la derecha del título
 *   (un botón de la pantalla), opcional
 */
export function Encabezado({ titulo, children }) {
  const h1 = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = `${titulo} · ${NOMBRE_PANEL}`
  }, [titulo])
  // De layout: el foco llega en el mismo cuadro en que aparece la pantalla.
  useLayoutEffect(() => {
    if (rutaAnterior !== null && rutaAnterior !== pathname) {
      window.scrollTo(0, 0)
      h1.current?.focus({ preventScroll: true })
    }
    rutaAnterior = pathname
  }, [pathname])
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 ref={h1} tabIndex={-1} className="min-w-0 text-3xl font-bold wrap-anywhere">
        {titulo}
      </h1>
      {children}
    </div>
  )
}
