// Los íconos del tablero "Web" de la diseñadora (Figma, 02/11/2026; los componentes del "Icon System" de su archivo,
// que son los de Feather Icons, licencia MIT): flechas de 20x20 con trazo de 2 px, puntas y uniones redondeadas, del
// color del texto (currentColor). Los trazados son los del Figma, en la caja de 20 (los de Feather llevados de 24 a 20).
// Van en línea y con aria-hidden: el nombre lo da el texto del enlace o del botón que los lleva (un botón que tiene solo
// el ícono necesita su aria-label). size-5: 20 px, como en el tablero; otro tamaño, con className.
// - FlechaDiagonal: "Ver todas las novedades" (arrow-up-right) y "Abrir en Google Maps" de Visitas.
// - FlechaIzquierda y FlechaDerecha: Anterior y Siguiente del carrusel (arrow-left y arrow-right), "Ir a Contacto" de
//   la tarjeta Contacto de Visitas y, a 12 px, "Horarios" de la barra de hoy del celular (BarraHoy.jsx).
// Desde el rediseño de las páginas que el tablero no dibuja (04 y 05/11/2026) las usan también las fichas, la
// paginación, las salas de Exposiciones, "Abrir en Google Maps" de Contacto y la 404 ("Volver al inicio" y las
// secciones). La 404 va en el bundle principal, así que desde el 05/11/2026 este archivo también (hasta entonces Vite lo
// ponía en un JS aparte, que bajaban todas las páginas salvo la 404).
// Los de las tarjetas (24x24) están en IconosTarjetas.jsx, con este mismo Icono: así la Home, que usa solo las flechas,
// no los baja.
// Desde la versión de celular (Figma "Web Mobile", 10/11/2026), también los dos del menú de debajo de xl (IconoMenu e
// IconoCerrar, MenuMovil.jsx): menu y x del mismo "Icon System", llevados de 24 a 40 como en el cuadro (la caja de 40
// con el trazo de 2, que así mide 2 px).

/**
 * El <svg> de un ícono de trazo: fill none, trazo de 2 del color del texto, puntas y uniones redondeadas, aria-hidden.
 * @param {{ className?: string, caja?: number, children: import('react').ReactNode }} props  caja: el lado del viewBox
 *   (20 en las flechas, 24 en los de las tarjetas, 40 en los del menú)
 */
export function Icono({ className = 'size-5', caja = 20, children }) {
  return (
    <svg
      viewBox={`0 0 ${caja} ${caja}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  )
}

/** @param {{ className?: string }} props */
export function FlechaDiagonal({ className }) {
  return (
    <Icono className={className}>
      <path d="M5.83 14.17 14.17 5.83M14.17 14.17V5.83H5.83" />
    </Icono>
  )
}

/** @param {{ className?: string }} props */
export function FlechaIzquierda({ className }) {
  return (
    <Icono className={className}>
      <path d="M15.83 10H4.17M10 4.17 4.17 10 10 15.83" />
    </Icono>
  )
}

/** @param {{ className?: string }} props */
export function FlechaDerecha({ className }) {
  return (
    <Icono className={className}>
      <path d="M4.17 10h11.66M10 15.83 15.83 10 10 4.17" />
    </Icono>
  )
}

/**
 * Las tres líneas del botón del menú (menu de Feather a 40: de x = 5 a 35, en y = 10, 20 y 30).
 * @param {{ className?: string }} props
 */
export function IconoMenu({ className = 'size-10' }) {
  return (
    <Icono className={className} caja={40}>
      <path d="M5 10h30M5 20h30M5 30h30" />
    </Icono>
  )
}

/**
 * La cruz que cierra el menú (x de Feather a 40: de 10 a 30).
 * @param {{ className?: string }} props
 */
export function IconoCerrar({ className = 'size-10' }) {
  return (
    <Icono className={className} caja={40}>
      <path d="M30 10 10 30M10 10l20 20" />
    </Icono>
  )
}
