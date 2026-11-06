import { Icono } from './Iconos.jsx'

// Los íconos de las tarjetas Teléfono, Correo y Redes de /contacto (DatosDeContacto.jsx; decisión R4 del desarrollador,
// 05/11/2026: los datos de contacto con el lenguaje de las tarjetas de información de Visitas). Como los de
// IconosTarjetas.jsx (Dirección lleva su Brujula): de 24x24 (size-6, en la caja de 24), con el trazo de 2 px y del color
// del texto, dentro del cuadrado de 48 de cada tarjeta (ICONO_TARJETA de tablero.js), en línea y con aria-hidden (la
// tarjeta tiene su rótulo). Van en su archivo para que Visitas, que comparte IconosTarjetas.jsx con Contacto, no los
// baje.
// El tablero no los tiene en su "Icon System": son phone, mail y share-2 de Feather Icons 4.29 (la familia del tablero,
// licencia MIT), con sus trazados tal cual (las líneas y la polilínea escritas como path). Desvío a confirmar con la
// diseñadora.

/** phone (Feather), la tarjeta Teléfono. @param {{ className?: string }} props */
export function Telefono({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icono>
  )
}

/** mail (Feather), la tarjeta Correo. @param {{ className?: string }} props */
export function Correo({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </Icono>
  )
}

/** share-2 (Feather), la tarjeta Redes. @param {{ className?: string }} props */
export function Redes({ className = 'size-6' }) {
  return (
    <Icono className={className} caja={24}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </Icono>
  )
}
