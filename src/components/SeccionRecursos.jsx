import { Descarga, Enlace, FlechaDerecha24, Video } from './IconosRecursos.jsx'
import {
  BAJADA,
  CONTENEDOR_TABLERO,
  ICONO_TARJETA,
  ROTULO_SECCION,
  ROTULO_TARJETA,
  SECCION_TABLERO,
  TEXTO_TARJETA,
  TITULO_SECCION,
} from './tablero.js'

// La sección de tarjetas de recursos del tablero "Web" de la diseñadora: "NEWSLETTER" de Divulgación (Figma 2857:5575,
// decisiones DV1 y DV9, 06/11/2026) y "Recursos educativos" de Educación (Figma 2851:104, decisiones IN1 a IN3 e IN9,
// 06/11/2026). Salió del newsletter de Divulgacion.jsx sin cambiar su HTML (IN9: se comprobó contra el build de antes).
// Medidas a 1440:
// - El h2 Thin 64 (TITULO_SECCION); con rótulo (Educación: "Recursos", Roboto Mono Medium 14/20 en mayúsculas,
//   ROTULO_SECCION), el h2 va 16 debajo del rótulo (no 24, como en las demás secciones: así en el tablero).
// - 16 abajo, la bajada (Regular 18/28 en gris, BAJADA; en un renglón a 1440: max-w-none le saca el tope de 42em de los
//   párrafos de index.css).
// - 48 abajo, tres tarjetas, como las de información de Visitas: tres columnas de 400 con 40 entre sí y 40 de padding
//   (entre lg y xl, 24 a los costados), sin fondo propio (el del tablero es el de la página). Cada una: el ícono de 24
//   en su cuadrado de 48 (ICONO_TARJETA, en crema; en Divulgación, en naranja: iconoNaranja), 24 abajo el rótulo
//   (ROTULO_TARJETA, un h3) y 8 abajo el texto (TEXTO_TARJETA), y 24 abajo la acción ("Ver guías"…: Roboto Mono 14/20
//   crema con la flecha de 24 a 8).
// - La acción: sin url, como texto (un <p>, sin <a>, sin foco ni cursor de mano, con la flecha aria-hidden: ningún
//   control sin destino, DV9 e IN2); con url (cuando el museo pase el enlace o lo guarde el panel, IN3), como enlace con
//   el mismo aspecto, 44 de alto para el dedo (-my-3: ocupa los 20 del renglón) y el foco de ENLACE_FLECHA. Esa clase
//   va escrita entera, sin ENLACE_FLECHA: con text-base y text-sm juntas ganaría la que Tailwind ordena después.
// - Debajo de lg no hay diseño (D2): una columna.
// Encabezados: el h2 de la sección y un h3 por tarjeta.

// Los íconos de las tarjetas, por la clave de content.js.
const ICONOS = { descarga: Descarga, video: Video, enlace: Enlace }

const TITULO_CON_ROTULO = `${TITULO_SECCION} mt-4`
const BAJADA_SECCION = `${BAJADA} mt-4 max-w-none`
const ICONO = 'size-6'
const ICONO_NARANJA = 'size-6 text-naranja'
const ACCION_TARJETA = 'flex items-center gap-2 font-mono text-sm leading-5 font-normal text-paper'
const ENLACE_TARJETA =
  '-my-3 inline-flex min-h-11 items-center gap-2 self-start rounded-sm font-mono text-sm leading-5 font-normal ' +
  'text-paper decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-blanco'

/**
 * @param {{ id: string, rotulo?: string | null, titulo: string, bajada: string,
 *   tarjetas: { icono: 'descarga' | 'video' | 'enlace', titulo: string, texto: string, accion: string,
 *     url?: string | null }[],
 *   iconoNaranja?: boolean }} props
 *   id: el del h2 (lo nombra la sección con aria-labelledby); tarjetas[].url: sin ella, la acción va como texto
 */
export default function SeccionRecursos({ id, rotulo = null, titulo, bajada, tarjetas, iconoNaranja = false }) {
  return (
    <section aria-labelledby={id} className={SECCION_TABLERO}>
      <div className={CONTENEDOR_TABLERO}>
        {rotulo ? <p className={ROTULO_SECCION}>{rotulo}</p> : null}
        <h2 id={id} className={rotulo ? TITULO_CON_ROTULO : TITULO_SECCION}>
          {titulo}
        </h2>
        <p className={BAJADA_SECCION}>{bajada}</p>
        <ul className="mt-12 grid gap-10 lg:grid-cols-3">
          {tarjetas.map((tarjeta) => {
            const Icono = ICONOS[tarjeta.icono]
            return (
              <li key={tarjeta.titulo} className="flex min-w-0 flex-col gap-6 lg:px-6 lg:py-10 xl:px-10">
                <span className={ICONO_TARJETA}>
                  <Icono className={iconoNaranja ? ICONO_NARANJA : ICONO} />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className={ROTULO_TARJETA}>{tarjeta.titulo}</h3>
                  <p className={TEXTO_TARJETA}>{tarjeta.texto}</p>
                </div>
                {tarjeta.url ? (
                  <a href={tarjeta.url} className={ENLACE_TARJETA}>
                    {tarjeta.accion}
                    <FlechaDerecha24 />
                  </a>
                ) : (
                  <p className={ACCION_TARJETA}>
                    {tarjeta.accion}
                    <FlechaDerecha24 />
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
