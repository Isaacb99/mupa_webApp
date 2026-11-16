import { barraHoy } from '../content.js'
import { FlechaDerecha } from './Iconos.jsx'
import { seccionDe } from './navegacion.js'

// La barra de hoy del celular (Figma "Web Mobile", el "Menu" de 402x40 del header: 3106:17312; decisión M3 del
// desarrollador, 10/11/2026): arriba de todo y solo debajo de lg, dice si el museo abre HOY según el horario semanal
// del panel, con "Horarios →", que lleva a la tarjeta Horarios de Visitas.
// - El dato lo resuelve el servidor (estado.abiertoHoy, server/ssr.js: el "hoy" de San Juan y abreElDia de
//   compartido/horarios.js): true, false o null. Con null (el horario sin cargar) no se dibuja. El navegador no calcula
//   ninguna fecha: lo que dibuja el servidor es lo que se hidrata.
// - Límites conocidos (M3): un feriado dice "abierto" (el panel no tiene feriados) y después de la hora de cierre sigue
//   diciendo "abierto hoy" (es "hoy", no "ahora").
// - Va en el HTML en todos los anchos y desde lg no se ve; tampoco al imprimir. Se dibuja dos veces (en el header y
//   adentro del menú del celular, que tapa la página): sin ids.
// - Medidas del cuadro a 402: 40 de alto, fondo #010101, 24 a los costados; el punto de 12 (un anillo de 1 px y un
//   círculo de 8), 8 a su derecha el texto Google Sans Flex Regular 12 en crema, y a la derecha "Horarios" en Roboto
//   Mono 12 con la flecha de 12 a 4. El interlineado es de 16 (el cuadro, 24) con el alto mínimo en la barra: en un
//   renglón se ve igual, y cuando el texto no entra (debajo de 348 px, o con la letra agrandada) va en dos renglones de
//   16 y la barra crece. Entre el texto y el enlace, 16 como mínimo (el cuadro, 24): así entra en un renglón a 360.
// - Texto común dentro del <header>, no una región viva: no cambia con la página abierta. Va en un <span> y no en un
//   párrafo: el espaciado de texto de WCAG 1.4.12 les suma dos renglones de margen a los párrafos, y con él la barra
//   crecía 24 px (a 320 px de ancho, el header pasaba el lugar que le dejan las páginas: 167 contra 161).
// - El punto es decorado (aria-hidden): el estado lo dice el texto. Cerrado, el bordó del cuadro; abierto, el verde
//   claro del sitio (nuestro, como el texto "abierto": a validar con la diseñadora). Con colores forzados conserva su
//   color (el navegador no fuerza el de un SVG que trae el suyo; medido el 10/11/2026): la barra y su texto sí toman
//   los del sistema.
// - "Horarios": lleva a la tarjeta Horarios de Visitas, por su id (el mismo que escribe src/paginas/Visitas.jsx: lo
//   comprueba layout.test.js). 44 de alto para el dedo, todos adentro de la pantalla: arranca en el borde de arriba de
//   la barra y sobresale 4 px por abajo, encima de la fila del logo (z-10: si no, la fila, que va después, le tapaba
//   esos 4 px al dedo, sobre todo adentro del menú); el texto queda centrado en los 40 de la barra (el padding de abajo)
//   y el margen negativo no mueve nada. 6 de aire a los costados del texto (sin correrlo): el contorno del foco va por
//   dentro y no pisa la «H» ni la flecha (VMAR-01, VMAR-02 y VA11-01 de la verificación, 11/11/2026). Si la página de
//   Visitas no existiera, no va.
// - Debajo de 22rem (352 px) la barra mide siempre lo de dos renglones (48): ahí el texto pasa de uno a dos según el
//   ancho y la fuente, y en la primera visita, entre 341 y 348 px, iba en un renglón con el respaldo y en dos con Google
//   Sans Flex: la fila del logo bajaba 8 px al llegar la fuente (VREN-02). Con el alto fijo no se mueve nada.

// 40 de alto como mínimo (48 debajo de 22rem), negra, con los márgenes del header.
const BARRA =
  'flex min-h-10 items-center justify-between gap-x-4 bg-ink px-6 max-[22rem]:min-h-12 md:px-10 lg:hidden print:hidden'
const ESTADO = 'flex min-w-0 items-center gap-2 py-2 text-xs leading-4 text-paper text-pretty'
const PUNTO_ABIERTO = 'size-3 shrink-0 text-verde-claro'
const PUNTO_CERRADO = 'size-3 shrink-0 text-bordo'
const ENLACE =
  'relative z-10 -mx-1.5 -mb-1 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-1.5 pb-1 font-mono ' +
  'text-xs leading-4 whitespace-nowrap ' +
  'text-paper decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 ' +
  'focus-visible:-outline-offset-2 focus-visible:outline-blanco'

/**
 * @param {{ abierto: boolean | null | undefined }} props  estado.abiertoHoy; si no es true ni false, no se dibuja
 */
export default function BarraHoy({ abierto }) {
  if (abierto !== true && abierto !== false) return null
  const visitas = seccionDe('visitas')
  return (
    <div data-hoy={abierto ? 'abierto' : 'cerrado'} className={BARRA}>
      <span className={ESTADO}>
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" className={abierto ? PUNTO_ABIERTO : PUNTO_CERRADO}>
          <circle cx="6" cy="6" r="5.5" fill="none" stroke="currentColor" />
          <circle cx="6" cy="6" r="4" fill="currentColor" />
        </svg>
        {abierto ? barraHoy.abierto : barraHoy.cerrado}
      </span>
      {visitas ? (
        <a href={`${visitas.ruta}#visitas-horarios`} className={ENLACE}>
          {barraHoy.horarios}
          <FlechaDerecha className="size-3" />
        </a>
      ) : null}
    </div>
  )
}
