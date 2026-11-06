import Ficha, { DatoFicha } from '../components/Ficha.jsx'
import { DATO_TARJETA, ENLACE_DATO } from '../components/tablero.js'
import { paginas } from '../content.js'

// /exposiciones/<slug> (E4.2, plan 6.1): una muestra publicada, también finalizada ("Finalizó el 30 de noviembre de
// 2026": 200, porque Google ya la indexó). Su situación, su período, su sala (si está publicada: lleva a su sección en
// /exposiciones) y, con Ficha.jsx, el resumen, la portada, la descripción y la galería. Los datos, de
// server/paginas.js.
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R2 a R4 del desarrollador, 04/11/2026): sin hero (el
// título arriba, sobre el fondo; Ficha.jsx). El período, como el texto de las tarjetas de información de Visitas
// (Regular 18/28 en gris, DATO_TARJETA), como la fecha de una noticia. La sala, como los datos de una actividad: el
// rótulo "Sala" (el de una tarjeta del tablero) y debajo su nombre con el enlace de un dato (ENLACE_DATO: subrayado,
// 44 de alto), en un <dl> (DatoFicha de Ficha.jsx), 32 debajo de lo de arriba. Es un dato solo: va a lo ancho, no en
// la primera de las tres columnas de los de una actividad (DatosFicha), así un nombre largo no se parte en renglones
// de un tercio del ancho. Hasta la corrección del rediseño (EST-06 de su verificación, 05/11/2026) iba en línea,
// "Sala: …", distinta de los datos de una actividad.

/** @param {{ estado: { datos: object } }} props */
export default function Muestra({ estado }) {
  const d = estado.datos ?? {}
  return (
    <Ficha
      volver={{ url: '/exposiciones', texto: paginas.exposiciones.titulo }}
      etiqueta={d.situacion}
      titulo={d.titulo}
      resumen={d.resumen}
      portada={d.portada}
      texto={d.descripcion}
      galeria={d.galeria}
    >
      {d.fechas ? <p className={`${DATO_TARJETA} mt-6`}>{d.fechas}</p> : null}
      {d.sala ? (
        <dl className="mt-8">
          <DatoFicha rotulo={paginas.muestra.sala} enlace>
            <a href={d.sala.url} className={ENLACE_DATO}>
              {d.sala.nombre}
            </a>
          </DatoFicha>
        </dl>
      ) : null}
    </Ficha>
  )
}
