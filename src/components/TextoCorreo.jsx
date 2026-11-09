import { partesDelCorreo } from './datosMuseo.js'

/**
 * El texto visible de un enlace a un correo (el mailto: de las tarjetas Contacto de Visitas y Correo de Contacto), con
 * el corte después de la arroba (<wbr>, datosMuseo.js: partesDelCorreo; BDIS-02 del cierre de E6.3). Va en un <span>
 * porque el enlace (ENLACE_DATO) es inline-flex: sin él, cada trozo de texto sería un ítem flex aparte. Lo que se copia
 * es el correo entero; el nombre del enlace, también, pero por el aria-label del enlace (aria-label={correo}, en quien lo
 * usa): Chrome cuenta el <wbr> como un espacio y el nombre quedaba «contacto@ mupa…».
 * @param {{ correo: string }} props
 */
export default function TextoCorreo({ correo }) {
  const [antes, despues] = partesDelCorreo(correo)
  return (
    <span>
      {antes}
      <wbr />
      {despues}
    </span>
  )
}
