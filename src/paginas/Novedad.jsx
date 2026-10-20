import Ficha from '../components/Ficha.jsx'
import { BOTON, ROTULO } from '../components/estilos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las fichas (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// /novedades/<slug> (E4.4, plan 6.1): una noticia (con su fecha de publicación) o una actividad (cuándo, dónde y
// cuánto cuesta, y el enlace para inscribirse mientras no se realizó; ya realizada: 200, con "Realizada" y sin la
// inscripción) y, con Ficha.jsx, el resumen, la portada, el texto y la galería. Los datos, de server/paginas.js.
const t = paginas.novedad

/**
 * Un dato de la actividad: el rótulo y el valor. Columnas minmax(0,1fr) y el valor que se parte: un lugar que es una
 * dirección web no ensancha la página (PAG-01 de la verificación de E4).
 */
function Dato({ rotulo, children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
      <dt className={`${ROTULO} sm:pt-[0.35rem]`}>{rotulo}</dt>
      <dd className="text-lg font-light wrap-anywhere">{children}</dd>
    </div>
  )
}

/** @param {{ estado: { datos: object } }} props */
export default function Novedad({ estado }) {
  const d = estado.datos ?? {}
  const a = d.actividad
  return (
    <Ficha
      volver={{ url: '/novedades', texto: paginas.novedades.titulo }}
      etiqueta={a?.realizada ? t.realizada : null}
      titulo={d.titulo}
      resumen={d.resumen}
      portada={d.portada}
      texto={d.cuerpo}
      galeria={d.galeria}
    >
      {!a && d.fecha ? (
        <p className="mt-4 text-lg font-light text-muted">
          <time dateTime={d.fechaIso}>{d.fecha}</time>
        </p>
      ) : null}
      {a && (a.cuando || a.lugar || a.costo) ? (
        <dl className="mt-8 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-4">
          {a.cuando ? (
            <Dato rotulo={t.cuando}>
              <time dateTime={a.cuandoIso}>{a.cuando}</time>
            </Dato>
          ) : null}
          {a.lugar ? <Dato rotulo={t.lugar}>{a.lugar}</Dato> : null}
          {a.costo ? <Dato rotulo={t.costo}>{a.costo}</Dato> : null}
        </dl>
      ) : null}
      {a?.inscripcion ? (
        <p className="mt-8">
          <a href={a.inscripcion} className={BOTON}>
            {t.inscripcion}
          </a>
        </p>
      ) : null}
    </Ficha>
  )
}
