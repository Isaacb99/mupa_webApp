import Tarjeta from './Tarjeta.jsx'
import { CONTENEDOR_TABLERO, LISTA_TARJETAS_TABLERO, ROTULO_SECCION, SECCION_TABLERO, TITULO_SECCION } from './tablero.js'

// Una sección de una página interna, con el lenguaje del tablero "Web" de la diseñadora (decisión R4 del desarrollador,
// 04/11/2026; como las de Visitas): el rótulo en Roboto Mono (ROTULO_SECCION), 24 abajo el h2 Thin 64 (TITULO_SECCION,
// con el id que nombra la sección: aria-labelledby) y lo que tiene adentro; 80 de aire arriba y abajo y 1280 de
// contenido a 1440 (SECCION_TABLERO y CONTENEDOR_TABLERO). Quien la usa la dibuja solo si tiene contenido (plan 6.1:
// una sección vacía no se dibuja, ni su título ni su rótulo).
// - rotulo: el título de la página ("Exposiciones", "Novedades"), como el tablero repite "Circuitos paleontológicos"
//   arriba de cada circuito: así no hace falta ningún texto nuevo (D13). Sin rotulo, solo el h2.
// - contenedor: false dentro de algo que ya tiene el ancho del contenido (la galería de una ficha, Ficha.jsx), con su
//   propio className (el aire de arriba).

/**
 * @param {{ id: string, rotulo?: string | null, titulo: string, contenedor?: boolean, className?: string,
 *   children: import('react').ReactNode }} props
 */
export default function Seccion({ id, rotulo = null, titulo, contenedor = true, className = SECCION_TABLERO, children }) {
  const contenido = (
    <>
      {rotulo ? <p className={ROTULO_SECCION}>{rotulo}</p> : null}
      <h2 id={id} className={rotulo ? `${TITULO_SECCION} mt-6` : TITULO_SECCION}>
        {titulo}
      </h2>
      {children}
    </>
  )
  return (
    <section aria-labelledby={id} className={className}>
      {contenedor ? <div className={CONTENEDOR_TABLERO}>{contenido}</div> : contenido}
    </section>
  )
}

/**
 * Una sección con una grilla de tarjetas (las muestras de Exposiciones, las próximas actividades y las noticias de
 * Novedades). Cada tarjeta llega del servidor con la forma de Tarjeta.jsx ({ titulo, url, resumen, portada, etiqueta,
 * detalle, fechaIso }). children: lo que va debajo de la grilla (la paginación de Novedades).
 * Ninguna foto de las tarjetas va con prioridad: desde el hero (R1) la foto del primer pantallazo, la del LCP, es la del
 * hero (antes era la de la primera tarjeta: PAG-02 de la verificación de E4); las de las tarjetas, lazy.
 * min-w-0 en cada tarjeta: una palabra larga no ensancha la columna de la grilla (PAG-01 de la verificación de E4).
 * @param {{ id: string, rotulo?: string | null, titulo: string, tarjetas: object[],
 *   children?: import('react').ReactNode }} props
 */
export function SeccionDeTarjetas({ id, rotulo = null, titulo, tarjetas, children = null }) {
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
