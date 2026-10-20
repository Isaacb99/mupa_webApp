import useScrollSuave from '../hooks/useScrollSuave.js'
import Header from './Header.jsx'
import Pie from './Pie.jsx'

// Aspecto provisorio hasta el diseño (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// El marco de todas las páginas (E4.1, plan 6.7): Header (con "Ir al contenido" y el menú), <main id="main"> con la
// página y el Pie. Lo arma src/Raiz.jsx alrededor de la página que pide el estado.
// - La única instancia de Lenis (useScrollSuave): scroll suave en todas las páginas. En la Home es la misma de siempre
//   (antes la creaba la Home), con mantenerEnPantalla y scrollSuaveEnCurso para el acordeón de Áreas.
// - En la Home el header va sobre el hero (absolute); en las demás, en el flujo.
// - <main id="main" tabIndex={-1}>: el destino de "Ir al contenido" (y lo que mantienen las recetas de la Home). Sin
//   clases: cada página pone las suyas adentro, así el <main> de la Home es el mismo de antes.
// - Header, main y footer van sueltos en #root, como en la landing: un envoltorio (por ejemplo flex, para empujar el
//   pie al final de una página corta) cambiaría cómo se juntan los márgenes de la Home.

/** @param {{ estado: { pagina: string, ruta: string, museo?: object }, children: import('react').ReactNode }} props */
export default function Layout({ estado, children }) {
  useScrollSuave()
  const museo = estado.museo ?? null
  // La 404 no es la página de ninguna sección aunque su dirección empiece como una (/exposiciones/no-existe): ningún
  // enlace del menú (ni del pie) lleva aria-current.
  const ruta = estado.pagina === 'no-encontrada' ? null : estado.ruta
  return (
    <>
      <Header ruta={ruta} compra={museo?.compra ?? null} sobreHero={estado.pagina === 'home'} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Pie museo={museo} ruta={ruta} />
    </>
  )
}
