import { site, ui } from '../content.js'

// El logo del header (tablero "Web" de la diseñadora, Figma, 02/11/2026: el bloque "Frame 40" de 272x40 a 64 del borde
// izquierdo y 44 del de arriba a 1440): la marca MuPa de 120x40, que lleva al inicio, una línea vertical de 1 px y 41 de
// alto, y los isotipos de la UNSJ (el sello) y de Gobierno de San Juan (la flor), de 40x40; 24 px entre cada pieza y
// todo blanco. Lo usan el header (Header.jsx) y el menú del celular (MenuMovil.jsx), en el mismo lugar.
// - La marca es el enlace al inicio (href="/" y no "./": con varias páginas, "./" en /novedades/x llevaría a
//   /novedades/). Su alt es el nombre del sitio. Con el padding mide 46,5 px de alto en el celular y 52 desde sm (el
//   margen negativo lo devuelve, así no mueve nada): más de los 44 mínimos para el dedo.
// - Los isotipos son información (quiénes co-gestionan el museo): una lista con su nombre, no enlaces.
// - La línea es decorativa y va como borde, no como fondo: con colores forzados un fondo desaparece y un borde no. No
//   ocupa lugar (-mr-px), como la línea del Figma: así los isotipos quedan en 232 y 296 a 1440.
// - Debajo de sm (640 px), las medidas del cuadro de celular (Figma "Web Mobile", 3106:17322, 10/11/2026): la marca de
//   80x26,5 (2/3 de la de escritorio), la línea de 41, los isotipos de 32 y 24 entre piezas (216 de ancho); entra con
//   el ícono del menú desde 320 px. Desde sm, las medidas del tablero (como hasta ahora).
//   Como todo va en rem, con la letra del navegador agrandada no entra (a 390 px con la letra en 24, el botón del menú
//   quedaba encima de los isotipos: CIR-02 de la verificación de Circuitos, 06/11/2026). Debajo de 20rem (320 px con
//   la letra normal, 400 con 20 y 480 con 24) no van la línea ni los isotipos (OCULTO_SI_NO_ENTRA): siguen en el pie.
// - Las piezas son SVG blancos: data-logo-blanco, para que index.css las invierta con colores forzados en un tema claro
//   (A11Y-04), salvo sobreFoto (el header sobre la foto de un hero, como en la Home): ahí lo de atrás no pasa a blanco
//   (los colores forzados no tocan la foto) y negro sobre la foto quedaba de 3 a 3,7:1 (A11Y-08).

// El ancho desde el que la marca, la línea, los isotipos y el ícono del menú entran juntos: 3rem de márgenes, 13,5 del
// bloque, 0,5 de separación y 2,5 del ícono son 19,5rem justos; con 20rem quedan de 8 a 12 px de margen (medido con la
// letra del navegador en 16, 20 y 24).
const OCULTO_SI_NO_ENTRA = 'max-[20rem]:hidden'

/**
 * @param {{ className?: string, sobreFoto?: boolean }} props
 */
export default function Logo({ className = '', sobreFoto = false }) {
  const { logo } = site
  const blanco = sobreFoto ? {} : { 'data-logo-blanco': '' }
  return (
    <div className={`flex min-w-0 items-center gap-6 ${className}`.trim()}>
      <a
        href="/"
        className="-my-2.5 block shrink-0 rounded-sm py-2.5 sm:-my-1.5 sm:py-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco"
      >
        <img src={logo.marca} alt={logo.alt} width={120} height={40} {...blanco} className="block h-auto w-20 sm:h-10 sm:w-30" />
      </a>
      <span aria-hidden="true" className={`-mr-px h-[2.5625rem] shrink-0 border-l border-blanco ${OCULTO_SI_NO_ENTRA}`} />
      <ul aria-label={ui.instituciones} className={`flex shrink-0 items-center gap-6 ${OCULTO_SI_NO_ENTRA}`}>
        {logo.isotipos.map((isotipo) => (
          <li key={isotipo.nombre}>
            <img
              src={isotipo.src}
              alt={isotipo.nombre}
              width={40}
              height={40}
              {...blanco}
              className="block size-8 sm:size-10"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
