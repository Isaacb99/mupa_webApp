import { site } from '../content.js'

// El logo MuPa del header, que lleva al inicio: las dos piezas (marca + texto) en la misma celda, con las posiciones
// del Figma en % del ancho del logo: la marca ocupa el 32,95 % y el texto arranca en el 36,57 %, 4,32 px más abajo
// (1,08 %). 260 px en el celular, 320 desde md y 458 desde lg (V03 y V04 de la diseñadora, medido sobre el PDF).
// Lo usan el header (Header.jsx) y el menú del celular (MenuMovil.jsx), en el mismo lugar.
// min-w-0: si al lado no entra el botón del menú (pantallas de menos de ~370 px, con la letra agrandada), el logo se
// achica en vez de empujarlo fuera de la pantalla; a 375 px mide sus 260.
// href="/" y no "./": con varias páginas, "./" en /novedades/x llevaría a /novedades/ (plan 6.7 y 13.3).
// Debajo de lg el logo mide 28 px de alto (22 a 320 px de ancho, 35 en md): 12 px de padding arriba y abajo, que el
// margen negativo devuelve, lo llevan a 44 px o más, el mínimo para el dedo, sin mover nada (A11Y-01 de la
// verificación de E4). Las dos piezas son SVG blancos: data-logo-blanco, para que index.css las invierta con colores
// forzados en un tema claro (A11Y-04).
export default function Logo({ className = '' }) {
  const { logo } = site
  return (
    <a
      href="/"
      className={`inline-grid w-[16.25rem] min-w-0 rounded-sm max-lg:-my-3 max-lg:py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper md:w-[20rem] lg:w-[28.625rem] ${className}`.trim()}
    >
      <img
        src={logo.marca}
        alt={site.nombre}
        width={132}
        height={44}
        data-logo-blanco=""
        className="col-start-1 row-start-1 w-[32.95%]"
      />
      <img
        src={logo.texto}
        alt={logo.textoAlt}
        width={254}
        height={39}
        data-logo-blanco=""
        className="col-start-1 row-start-1 mt-[1.08%] ml-[36.57%] w-[63.43%]"
      />
    </a>
  )
}
