import { site, ui } from '../content.js'

// Header: el logo MuPa sobre la foto del hero. En 1440 mide 458 px de ancho y va a 82,5 px del borde izquierdo y 71 del
// de arriba (V03 y V04 de la diseñadora, medido sobre el PDF; el Figma V02 lo tenía a 400 px y 64/48, que es lo que
// hubo hasta el 28/09/2026). No se engancha arriba: el diseño no tiene menú, así que sube con el hero.
export default function Header() {
  const { logo } = site

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        {ui.irAlContenido}
      </a>

      <div className="px-6 pt-6 md:px-10 md:pt-8 lg:px-[5.15625rem] lg:pt-[4.4375rem]">
        {/* Las dos piezas del logo en la misma celda, con las posiciones del Figma en % del ancho del logo: la
            marca ocupa el 32,95 % y el texto arranca en el 36,57 %, 4,32 px más abajo (1,08 %). */}
        <a
          href="./"
          className="inline-grid w-[16.25rem] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper md:w-[20rem] lg:w-[28.625rem]"
        >
          <img src={logo.marca} alt={site.nombre} width={132} height={44} className="col-start-1 row-start-1 w-[32.95%]" />
          <img
            src={logo.texto}
            alt={logo.textoAlt}
            width={254}
            height={39}
            className="col-start-1 row-start-1 mt-[1.08%] ml-[36.57%] w-[63.43%]"
          />
        </a>
      </div>
    </header>
  )
}
