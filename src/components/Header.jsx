import { ui } from '../content.js'
import Logo from './Logo.jsx'
import Menu from './Menu.jsx'
import MenuMovil from './MenuMovil.jsx'

// Aspecto provisorio hasta el diseño del header (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// Header de todas las páginas (plan 6.7): "Ir al contenido", el logo (que lleva al inicio) y, a la derecha, el menú
// (Menu.jsx desde xl, el botón "Menú" con su <dialog> debajo: MenuMovil.jsx).
// - En la Home va absolute sobre la foto del hero y sube con él (no se engancha: nada fijo ni sticky que tape o corra
//   los enganches de la Home); el menú queda arriba a la derecha, sobre el degradé del hero.
// - En las otras páginas va en el flujo, con el mismo logo en el mismo lugar.
// El logo mide 458 px en 1440 y va a 82,5 px del borde izquierdo y 71 del de arriba (V03 y V04 de la diseñadora, medido
// sobre el PDF); en el celular, 260 px a 24 del borde.
// El menú va centrado en el alto del logo sin correrlo: su caja mide 0 de alto (h-0) y está centrada en la fila, que
// mide lo que el logo; el botón de 44 px sobresale lo mismo arriba y abajo.

/**
 * @param {{ ruta: string | null, compra: { url: string, texto: string | null } | null, sobreHero: boolean }} props
 *   ruta: estado.ruta, para aria-current (null en la 404); compra: estado.museo.compra; sobreHero: true en la Home
 */
export default function Header({ ruta, compra, sobreHero }) {
  return (
    <header className={sobreHero ? 'absolute inset-x-0 top-0 z-40' : 'relative'}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        {ui.irAlContenido}
      </a>

      <div
        className={`flex items-start justify-between gap-2 px-6 pt-6 md:px-10 md:pt-8 lg:px-[5.15625rem] lg:pt-[4.4375rem] ${sobreHero ? '' : 'pb-8 md:pb-10 lg:pb-14'}`}
      >
        <Logo />
        <div className="flex h-0 shrink-0 items-center self-center print:hidden">
          <Menu ruta={ruta} compra={compra} className="hidden xl:block" />
          <MenuMovil ruta={ruta} compra={compra} className="xl:hidden" />
        </div>
      </div>
    </header>
  )
}
