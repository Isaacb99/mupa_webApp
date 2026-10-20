import Tarjeta from './Tarjeta.jsx'
import { LISTA_TARJETAS, SUBTITULO } from './estilos.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// Una sección de una página interna: su h2 (con el id que la nombra, aria-labelledby) y lo que tiene adentro. Quien la
// usa la dibuja solo si tiene contenido (plan 6.1: una sección vacía no se dibuja, ni su título).

/** @param {{ id: string, titulo: string, className?: string, children: import('react').ReactNode }} props */
export default function Seccion({ id, titulo, className = 'mt-14 md:mt-20', children }) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className={SUBTITULO}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

/**
 * Una sección con una lista de tarjetas (las muestras de Exposiciones, las próximas actividades y las noticias de
 * Novedades). Cada tarjeta llega del servidor con la forma de Tarjeta.jsx ({ titulo, url, resumen, portada, etiqueta,
 * detalle, fechaIso }).
 * primera: es la primera lista de la página; su primera tarjeta lleva la foto con prioridad (Tarjeta.jsx).
 * min-w-0 en cada tarjeta: una palabra larga no ensancha la columna de la grilla (PAG-01 de la verificación de E4).
 * @param {{ id: string, titulo: string, tarjetas: object[], primera?: boolean }} props
 */
export function SeccionDeTarjetas({ id, titulo, tarjetas, primera = false }) {
  return (
    <Seccion id={id} titulo={titulo}>
      <ul className={LISTA_TARJETAS}>
        {tarjetas.map((t, i) => (
          <li key={t.url} className="min-w-0">
            <Tarjeta {...t} prioridad={primera && i === 0} />
          </li>
        ))}
      </ul>
    </Seccion>
  )
}
