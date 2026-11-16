import { CONTENEDOR_TABLERO, ROTULO_SECCION, SECCION_TABLERO, TITULO_SECCION } from './tablero.js'

// Una sección de una página interna, con el lenguaje del tablero "Web" de la diseñadora (decisión R4 del desarrollador,
// 04/11/2026; como las de Visitas): el rótulo en Roboto Mono (ROTULO_SECCION), 24 abajo el h2 Thin 64 (TITULO_SECCION,
// con el id que nombra la sección: aria-labelledby) y lo que tiene adentro; 80 de aire arriba y abajo y 1280 de
// contenido a 1440 (SECCION_TABLERO y CONTENEDOR_TABLERO). Debajo de lg el h2 va a 16 del rótulo, como en el cuadro de
// celular (Figma "Web Mobile", 10/11/2026). Quien la usa la dibuja solo si tiene contenido (plan 6.1: una sección vacía
// no se dibuja, ni su título ni su rótulo).
// - rotulo: el título de la página ("Exposiciones", "Novedades"), como el tablero repite "Circuitos paleontológicos"
//   arriba de cada circuito: así no hace falta ningún texto nuevo (D13). Sin rotulo, solo el h2.
// - contenedor: false dentro de algo que ya tiene el ancho del contenido (la galería de una ficha, Ficha.jsx), con su
//   propio className (el aire de arriba).
// - cerca: el h2 a 16 del rótulo también desde lg, en vez de 24 (mt-4: El Museo, Figma 2823:10228, en Cogestión,
//   Haciendo el MuPa y Autoridades, 06/11/2026; Nuestro equipo lo escribe a mano con el mismo margen, para centrar el
//   encabezado en el celular; como "Recursos educativos" de Educación, SeccionRecursos.jsx). Sin ella, el de siempre
//   (Exposiciones, Novedades y las fichas).
// La sección con una grilla de tarjetas (Exposiciones y Novedades) está en SeccionDeTarjetas.jsx.

/** El h2 debajo del rótulo: a 24 desde lg y a 16 debajo (el de siempre), o a 16 en todos los anchos (cerca). */
const TITULO_CON_ROTULO = `${TITULO_SECCION} mt-4 lg:mt-6`
const TITULO_CERCA = `${TITULO_SECCION} mt-4`

/**
 * @param {{ id: string, rotulo?: string | null, titulo: string, contenedor?: boolean, cerca?: boolean,
 *   className?: string, children: import('react').ReactNode }} props
 */
export default function Seccion({
  id,
  rotulo = null,
  titulo,
  contenedor = true,
  cerca = false,
  className = SECCION_TABLERO,
  children,
}) {
  const conRotulo = cerca ? TITULO_CERCA : TITULO_CON_ROTULO
  const contenido = (
    <>
      {rotulo ? <p className={ROTULO_SECCION}>{rotulo}</p> : null}
      <h2 id={id} className={rotulo ? conRotulo : TITULO_SECCION}>
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
