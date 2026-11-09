import useScrollSuave from '../hooks/useScrollSuave.js'
import Header from './Header.jsx'
import Pie from './Pie.jsx'

// El marco de todas las páginas (E4.1, plan 6.7; header y pie del tablero "Web" de la diseñadora desde el 02/11/2026):
// Header (con "Ir al contenido" y el menú), <main id="main"> con la página y el Pie. Lo arma src/Raiz.jsx alrededor de
// la página que pide el estado.
// - La única instancia de Lenis (useScrollSuave): scroll suave en todas las páginas, con mantenerEnPantalla y
//   scrollSuaveEnCurso para el acordeón de Áreas de la landing.
// - El header va absolute arriba en todas las páginas (decisión D8): la página pone debajo su foto (sobreFoto, lo
//   declara la página) o deja el lugar que mide el header (las que no tienen foto, CONTENEDOR_SIN_FOTO de tablero.js).
// - <main id="main" tabIndex={-1}>: el destino de "Ir al contenido" (y lo que mantienen las recetas de la Home). Solo
//   lleva grow: cada página pone sus clases adentro.
// - Header, main y footer van sueltos en #root, sin envoltorio. Desde el cierre de E6.3 (BDIS-04, 09/11/2026) #root va
//   en columna y de al menos el alto de la ventana (src/index.css) y el main se estira (grow): en una página más baja
//   que la ventana (la 404) el pie queda abajo. Con las más altas no cambia nada (medido en todas las rutas).
// - El año del © del pie llega del servidor en el estado (estado.anio): igual en el servidor y en el navegador.

/**
 * @param {{ estado: { pagina: string, ruta: string, museo?: object, anio?: number }, sobreFoto?: boolean,
 *   children: import('react').ReactNode }} props
 */
export default function Layout({ estado, sobreFoto = false, children }) {
  useScrollSuave()
  const museo = estado.museo ?? null
  // La 404 no es la página de ninguna sección aunque su dirección empiece como una (/exposiciones/no-existe): ningún
  // enlace del menú (ni del pie) lleva aria-current.
  const ruta = estado.pagina === 'no-encontrada' ? null : estado.ruta
  return (
    <>
      <Header ruta={ruta} compra={museo?.compra ?? null} sobreFoto={sobreFoto} />
      <main id="main" tabIndex={-1} className="grow">
        {children}
      </main>
      <Pie museo={museo} ruta={ruta} anio={estado.anio ?? null} />
    </>
  )
}
