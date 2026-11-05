import { site, ui } from '../content.js'

// El logo del header (tablero "Web" de la diseñadora, Figma, 02/11/2026: el bloque "Frame 40" de 272x40 a 64 del borde
// izquierdo y 44 del de arriba a 1440): la marca MuPa de 120x40, que lleva al inicio, una línea vertical de 1 px y 41 de
// alto, y los isotipos de la UNSJ (el sello) y de Gobierno de San Juan (la flor), de 40x40; 24 px entre cada pieza y
// todo blanco. Lo usan el header (Header.jsx) y el menú del celular (MenuMovil.jsx), en el mismo lugar.
// - La marca es el enlace al inicio (href="/" y no "./": con varias páginas, "./" en /novedades/x llevaría a
//   /novedades/). Su alt es el nombre del sitio. Con el padding mide 44 px de alto en el celular y 52 desde sm (el
//   margen negativo lo devuelve, así no mueve nada): los 44 mínimos para el dedo.
// - Los isotipos son información (quiénes co-gestionan el museo): una lista con su nombre, no enlaces.
// - La línea es decorativa y va como borde, no como fondo: con colores forzados un fondo desaparece y un borde no. No
//   ocupa lugar (-mr-px), como la línea del Figma: así los isotipos quedan en 232 y 296 a 1440.
// - Debajo de sm (640 px) no hay diseño (decisión D2): el bloque se achica a 197 px (marca de 96x32, isotipos de 32 y 12
//   entre piezas) para que entre con el botón "Menú" desde 320 px sin desbordar; desde sm, las medidas del tablero.
// - Las piezas son SVG blancos: data-logo-blanco, para que index.css las invierta con colores forzados en un tema claro
//   (A11Y-04), salvo sobreFoto (el header sobre la foto de un hero, como en la Home): ahí lo de atrás no pasa a blanco
//   (los colores forzados no tocan la foto) y negro sobre la foto quedaba de 3 a 3,7:1 (A11Y-08).
/**
 * @param {{ className?: string, sobreFoto?: boolean }} props
 */
export default function Logo({ className = '', sobreFoto = false }) {
  const { logo } = site
  const blanco = sobreFoto ? {} : { 'data-logo-blanco': '' }
  return (
    <div className={`flex min-w-0 items-center gap-3 sm:gap-6 ${className}`.trim()}>
      <a
        href="/"
        className="-my-1.5 block shrink-0 rounded-sm py-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco"
      >
        <img src={logo.marca} alt={logo.alt} width={120} height={40} {...blanco} className="block h-8 w-24 sm:h-10 sm:w-30" />
      </a>
      <span aria-hidden="true" className="-mr-px h-8 shrink-0 border-l border-blanco sm:h-[2.5625rem]" />
      <ul aria-label={ui.instituciones} className="flex shrink-0 items-center gap-3 sm:gap-6">
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
