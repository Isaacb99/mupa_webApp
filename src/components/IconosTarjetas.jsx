import { Icono } from './Iconos.jsx'

// Los íconos de las tarjetas del tablero "Web" de la diseñadora (Visitas, 03/11/2026): de 24x24 (size-6, en la caja de
// 24), con el trazo de 2 px y del color del texto de Iconos.jsx, dentro del cuadrado de 48 de cada tarjeta
// (ICONO_TARJETA de tablero.js). Van en línea y con aria-hidden: la tarjeta tiene su rótulo (un h3). Están aparte de
// las flechas para que la Home no los baje.
// - Brujula, Reloj e Info: las tarjetas Dirección, Horarios y Contacto, los del tablero (compass, clock e info del "Icon
//   System" de su archivo, que son los de Feather Icons, licencia MIT; con los trazados del Figma).
// - Accesibilidad, Ojo, Oreja y Cerebro: las cuatro tarjetas de "Museo accesible" (física, visual, auditiva y
//   neurodivergencia). Los del tablero son de relleno (navigation, info, navigation-2 y calendar): van unos que
//   corresponden a cada tema, de Lucide (accessibility, eye, ear y brain, versión 1.60.0, con sus trazados tal cual;
//   decisión V4 del desarrollador, a confirmar con la diseñadora). Lucide tiene licencia ISC:
//   Copyright (c) 2026 Lucide Icons and Contributors. Permission to use, copy, modify, and/or distribute this software
//   for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission
//   notice appear in all copies.

/** compass (Feather), la tarjeta Dirección. @param {{ className?: string }} props */
export function Brujula({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </Icono>
  )
}

/** clock (Feather), la tarjeta Horarios. @param {{ className?: string }} props */
export function Reloj({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icono>
  )
}

/** info (Feather), la tarjeta Contacto. @param {{ className?: string }} props */
export function Info({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </Icono>
  )
}

/** accessibility (Lucide), Accesibilidad física. @param {{ className?: string }} props */
export function Accesibilidad({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <circle cx="16" cy="4" r="1" />
      <path d="m18 19 1-7-6 1" />
      <path d="m5 8 3-3 5.5 3-2.36 3.5" />
      <path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
      <path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
    </Icono>
  )
}

/** eye (Lucide), Accesibilidad visual. @param {{ className?: string }} props */
export function Ojo({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </Icono>
  )
}

/** ear (Lucide), Accesibilidad auditiva. @param {{ className?: string }} props */
export function Oreja({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
      <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />
    </Icono>
  )
}

/** brain (Lucide), Neurodivergencia. @param {{ className?: string }} props */
export function Cerebro({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M12 18V5" />
      <path d="M15 13a4.17 4.17 0 01-3-4 4.17 4.17 0 01-3 4" />
      <path d="M17.707 6.294A3 3 0 1012 5a3 3 0 10-5.707 1.294" />
      <path d="M17.996 5.125a4 4 0 012.526 5.77" />
      <path d="M18 18a4 4 0 002-7.465" />
      <path d="M19.967 17.482a4 4 0 11-7.967.517 4 4 0 11-7.967-.517" />
      <path d="M6 18a4 4 0 01-2-7.465" />
      <path d="M6.004 5.125a4 4 0 00-2.526 5.77" />
    </Icono>
  )
}
