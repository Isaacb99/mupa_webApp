import Seccion from './Seccion.jsx'
import Tarjeta from './Tarjeta.jsx'
import { LISTA_TARJETAS_TABLERO } from './tablero.js'

// Una sección con una grilla de tarjetas (las muestras de Exposiciones, las próximas actividades y las noticias de
// Novedades), con el rótulo y el h2 de Seccion.jsx. En su propio archivo desde el cierre de E6.3 (09/11/2026): estaba en
// Seccion.jsx, y por el import de Tarjeta.jsx (y de Foto.jsx) El Museo, que usa solo Seccion, bajaba dos archivos de JS
// que no usa (INT-SEC-01). El HTML es el mismo.

/**
 * Cada tarjeta llega del servidor con la forma de Tarjeta.jsx ({ titulo, url, resumen, portada, etiqueta, detalle,
 * fechaIso }). children: lo que va debajo de la grilla (la paginación de Novedades).
 * Ninguna foto de las tarjetas va con prioridad: desde el hero (R1) la foto del primer pantallazo, la del LCP, es la del
 * hero (antes era la de la primera tarjeta: PAG-02 de la verificación de E4); las de las tarjetas, lazy.
 * min-w-0 en cada tarjeta: una palabra larga no ensancha la columna de la grilla (PAG-01 de la verificación de E4).
 * @param {{ id: string, rotulo?: string | null, titulo: string, tarjetas: object[],
 *   children?: import('react').ReactNode }} props
 */
export default function SeccionDeTarjetas({ id, rotulo = null, titulo, tarjetas, children = null }) {
  return (
    <Seccion id={id} rotulo={rotulo} titulo={titulo}>
      <ul className={LISTA_TARJETAS_TABLERO}>
        {tarjetas.map((t) => (
          <li key={t.url} className="min-w-0">
            <Tarjeta {...t} />
          </li>
        ))}
      </ul>
      {children}
    </Seccion>
  )
}
