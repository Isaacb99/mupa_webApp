import Ficha from '../components/Ficha.jsx'
import { ENLACE_SUELTO } from '../components/estilos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las fichas (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// /exposiciones/<slug> (E4.2, plan 6.1): una muestra publicada, también finalizada ("Finalizó el 30 de noviembre de
// 2026": 200, porque Google ya la indexó). Su situación, su período, su sala (si está publicada: lleva a su sección en
// /exposiciones) y, con Ficha.jsx, el resumen, la portada, la descripción y la galería. Los datos, de
// server/paginas.js.

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
      {d.fechas ? <p className="mt-4 text-lg font-light text-muted">{d.fechas}</p> : null}
      {d.sala ? (
        <p className="mt-1 text-lg font-light wrap-anywhere">
          {paginas.muestra.sala}:{' '}
          <a href={d.sala.url} className={ENLACE_SUELTO}>
            {d.sala.nombre}
          </a>
        </p>
      ) : null}
    </Ficha>
  )
}
