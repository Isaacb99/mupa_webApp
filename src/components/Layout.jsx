import useScrollSuave from '../hooks/useScrollSuave.js'
import Header from './Header.jsx'
import Pie from './Pie.jsx'

// El marco de todas las páginas (E4.1, plan 6.7; header y pie del tablero "Web" de la diseñadora desde el 02/11/2026):
// Header (con "Ir al contenido" y el menú), <main id="main"> con la página y el Pie. Lo arma src/Raiz.jsx alrededor de
// la página que pide el estado.
// - La única instancia de Lenis (useScrollSuave): scroll suave en todas las páginas, con mantenerEnPantalla y
//   scrollSuaveEnCurso para el acordeón de Áreas de la landing.
// - El header va absolute arriba en todas las páginas (decisión D8): la página pone debajo su foto (sobreFoto, lo
//   declara la página) o deja el lugar que mide el header (CONTENEDOR de estilos.js).
// - <main id="main" tabIndex={-1}>: el destino de "Ir al contenido" (y lo que mantienen las recetas de la Home). Sin
//   clases: cada página pone las suyas adentro.
// - Header, main y footer van sueltos en #root, como en la landing: un envoltorio (por ejemplo flex, para empujar el
//   pie al final de una página corta) cambiaría cómo se juntan los márgenes de la Home.
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
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Pie museo={museo} ruta={ruta} anio={estado.anio ?? null} />
    </>
  )
}
