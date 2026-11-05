import { ui } from '../content.js'
import Logo from './Logo.jsx'
import Menu from './Menu.jsx'
import MenuMovil from './MenuMovil.jsx'

// Header de todas las páginas (plan 6.7; el del tablero "Web" de la diseñadora, Figma, 02/11/2026): "Ir al contenido",
// el logo (Logo.jsx: la marca, que lleva al inicio, y los isotipos de la UNSJ y de Gobierno) y, a la derecha, el menú
// (Menu.jsx desde xl; debajo, el botón "Menú" con su <dialog>: MenuMovil.jsx).
// - Transparente y absolute arriba en TODAS las páginas (decisión D8): sube con la página, nada fijo ni sticky que tape
//   o corra los enganches de la Home. Las páginas con una foto arriba (la Home, los hero del tablero) la ponen debajo de
//   él; las que todavía no tienen el diseño nuevo dejan arriba el lugar que mide (CONTENEDOR de estilos.js: 92 px en el
//   celular, 108 desde md y 128 desde lg).
// - Medidas del tablero a 1440: 128 de alto, 64 a los costados (max-w-tablero con px-16: más allá de 1440 queda
//   centrado con el contenido) y el logo y el menú centrados en el alto. Debajo de lg no hay diseño (D2): los márgenes
//   del sitio (24 y 40).
// - Sobre una foto (sobreFoto, lo declara la página: Home.sobreFoto), el logo no se invierte con colores forzados en un
//   tema claro (Logo.jsx, A11Y-08).

/**
 * @param {{ ruta: string | null, compra: { url: string } | null, sobreFoto?: boolean }} props
 *   ruta: estado.ruta, para aria-current (null en la 404); compra: estado.museo.compra (solo si está activa);
 *   sobreFoto: la página empieza con una foto debajo del header
 */
export default function Header({ ruta, compra, sobreFoto = false }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        {ui.irAlContenido}
      </a>

      <div className="mx-auto flex max-w-tablero items-center justify-between gap-2 px-6 py-6 sm:gap-4 md:px-10 md:py-8 lg:h-32 lg:px-16 lg:py-0">
        <Logo sobreFoto={sobreFoto} />
        <div className="flex shrink-0 items-center print:hidden">
          <Menu ruta={ruta} compra={compra} className="hidden xl:block" />
          <MenuMovil ruta={ruta} compra={compra} className="xl:hidden" />
        </div>
      </div>
    </header>
  )
}
