import { ui } from '../content.js'
import BarraHoy from './BarraHoy.jsx'
import Logo from './Logo.jsx'
import Menu from './Menu.jsx'
import MenuMovil from './MenuMovil.jsx'

// Header de todas las páginas (plan 6.7; el del tablero "Web" de la diseñadora, Figma, 02/11/2026, y debajo de lg el
// marco de celular de "Web Mobile", 3106:17311, 10/11/2026): "Ir al contenido", la barra de hoy (BarraHoy.jsx, solo
// debajo de lg), el logo (Logo.jsx: la marca, que lleva al inicio, y los isotipos de la UNSJ y de Gobierno) y, a la
// derecha, el menú (Menu.jsx desde xl; debajo, el botón de tres líneas con su <dialog>: MenuMovil.jsx).
// - Transparente y absolute arriba en TODAS las páginas (decisión D8): sube con la página, nada fijo ni sticky que tape
//   o corra los enganches de la Home. Las páginas con una foto arriba (la Home, los hero del tablero) la ponen debajo de
//   él; las que no llevan foto arriba (las fichas de una muestra y de una novedad, y la 404) dejan arriba su lugar
//   (CONTENEDOR_SIN_FOTO de tablero.js).
// - Medidas del tablero a 1440: 128 de alto, 64 a los costados (max-w-tablero con px-16: más allá de 1440 queda
//   centrado con el contenido) y el logo y el menú centrados en el alto.
// - Debajo de lg, el marco de celular: la barra de hoy (40, negra; sin horario cargado no va) y la fila del logo, de 73
//   (16 de padding arriba y abajo en todo el tramo; los márgenes del sitio, 24 y 40): 113 en total, 7,0625rem. Las
//   páginas reservan 10,0625rem (161: el marco más los 48 de aire del cuadro) antes de su primer texto, con barra o sin
//   ella (los dos hero y CONTENEDOR_SIN_FOTO). Es el contrato del marco: si la fila deja de medir 73, se corren todas.
// - Sin JavaScript el botón del menú no se ve (no abriría nada): el camino son las secciones del pie (Pie.jsx).
// - Sobre una foto (sobreFoto, lo declara la página: Home.sobreFoto), el logo no se invierte con colores forzados en un
//   tema claro (Logo.jsx, A11Y-08).

/**
 * @param {{ ruta: string | null, compra: { url: string } | null, sobreFoto?: boolean, abiertoHoy?: boolean | null }} props
 *   ruta: estado.ruta, para aria-current (null en la 404); compra: estado.museo.compra (solo si está activa);
 *   sobreFoto: la página empieza con una foto debajo del header; abiertoHoy: estado.abiertoHoy, para la barra de hoy
 *   (lo resuelve el servidor; null: sin barra)
 */
export default function Header({ ruta, compra, sobreFoto = false, abiertoHoy = null }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        {ui.irAlContenido}
      </a>

      <BarraHoy abierto={abiertoHoy} />

      <div className="mx-auto flex max-w-tablero items-center justify-between gap-2 px-6 py-4 sm:gap-4 md:px-10 lg:h-32 lg:px-16 lg:py-0">
        <Logo sobreFoto={sobreFoto} />
        <div className="flex shrink-0 items-center print:hidden">
          <Menu ruta={ruta} compra={compra} className="hidden xl:block" />
          <MenuMovil ruta={ruta} compra={compra} abiertoHoy={abiertoHoy} className="xl:hidden noscript:hidden" />
        </div>
      </div>
    </header>
  )
}
