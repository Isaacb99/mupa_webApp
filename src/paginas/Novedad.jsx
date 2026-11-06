import Ficha, { DatoFicha, DatosFicha } from '../components/Ficha.jsx'
import { BOTON_NARANJA, DATO_TARJETA } from '../components/tablero.js'
import { paginas } from '../content.js'

// /novedades/<slug> (E4.4, plan 6.1): una noticia (con su fecha de publicación) o una actividad (cuándo, dónde y
// cuánto cuesta, y el enlace para inscribirse mientras no se realizó; ya realizada: 200, con "Realizada" y sin la
// inscripción) y, con Ficha.jsx, el resumen, la portada, el texto y la galería. Los datos, de server/paginas.js.
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R2 a R4 del desarrollador, 04/11/2026): sin hero (el
// título arriba, sobre el fondo; Ficha.jsx). La fecha, como el texto de las tarjetas de información de Visitas (Regular
// 18/28 en gris, DATO_TARJETA); los datos de la actividad, cada uno con su rótulo (el de una tarjeta del tablero) y su
// valor debajo, en tres columnas desde md (en una en el celular: DatosFicha y DatoFicha de Ficha.jsx, que usa también
// la sala de una muestra); y "Inscribirse", el botón naranja del tablero con el texto oscuro (BOTON_NARANJA, decisión
// D4).
const t = paginas.novedad

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
        <p className={`${DATO_TARJETA} mt-6`}>
          <time dateTime={d.fechaIso}>{d.fecha}</time>
        </p>
      ) : null}
      {a && (a.cuando || a.lugar || a.costo) ? (
        <DatosFicha>
          {a.cuando ? (
            <DatoFicha rotulo={t.cuando}>
              <time dateTime={a.cuandoIso}>{a.cuando}</time>
            </DatoFicha>
          ) : null}
          {a.lugar ? <DatoFicha rotulo={t.lugar}>{a.lugar}</DatoFicha> : null}
          {a.costo ? <DatoFicha rotulo={t.costo}>{a.costo}</DatoFicha> : null}
        </DatosFicha>
      ) : null}
      {a?.inscripcion ? (
        <p className="mt-8">
          <a href={a.inscripcion} className={BOTON_NARANJA}>
            {t.inscripcion}
          </a>
        </p>
      ) : null}
    </Ficha>
  )
}
