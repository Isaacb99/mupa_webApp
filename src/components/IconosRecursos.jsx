import { Icono } from './Iconos.jsx'

// Los íconos de 24x24 de los bloques de texto y foto y de las tarjetas de recursos del tablero "Web" de la diseñadora
// (Divulgación, Figma 2857:5439, 06/11/2026; en el tablero también Educación y Circuitos): los de Feather Icons
// (licencia MIT), que son los del "Icon System" del archivo, con el trazo de 2 px y del color del texto de Iconos.jsx.
// Van en línea y con aria-hidden: el nombre lo da el texto que los acompaña. Están aparte de Iconos.jsx (que va en el
// JS principal: la 404 lo usa) y de IconosTarjetas.jsx (Visitas y Contacto), así solo los baja la página que los usa.
// - FlechaCirculo (arrow-right-circle): los enlaces de un bloque de texto y foto (BloqueTextoFoto.jsx: «Coordinar
//   visita» y las cuatro actividades del laboratorio; en el tablero, la cuarta lleva un arrow-right, un descuido del
//   archivo). El trazado de Figma (figma/iconos/arrow-right-circle-22.svg del relevamiento) es el de Feather.
// - Descarga, Video y Enlace (download, video y link): las tres tarjetas de "NEWSLETTER" de Divulgación (en naranja;
//   en Educación, en crema).
// - FlechaDerecha24 (arrow-right de 24): el "enlace" de cada tarjeta ("Ver guías", "Ver videos", "Explorar"). La de
//   Iconos.jsx es la de 20.

/** arrow-right-circle (Feather). @param {{ className?: string }} props */
export function FlechaCirculo({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16l4-4-4-4M8 12h8" />
    </Icono>
  )
}

/** download (Feather). @param {{ className?: string }} props */
export function Descarga({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </Icono>
  )
}

/** video (Feather). @param {{ className?: string }} props */
export function Video({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </Icono>
  )
}

/** link (Feather). @param {{ className?: string }} props */
export function Enlace({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icono>
  )
}

/** arrow-right de 24 (Feather). @param {{ className?: string }} props */
export function FlechaDerecha24({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Icono>
  )
}
